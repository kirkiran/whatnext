import { taskApi, TaskApiError } from "@/lib/task-api";
import type { TaskAddition } from "@/lib/task-storage";
import type { Task } from "@/lib/whatnext-data";

export type TaskState = {
  tasks: Task[] | null; loading: boolean; refreshing: boolean; busy: boolean;
  error: string; unauthorized: boolean; unresolvedAddition: boolean;
};

// One authenticated workspace. No cache, queue, or cross-workspace state.
export function createDurableTasks(publish: (state: TaskState) => void, api = taskApi, isCurrentUser = () => true) {
  let state: TaskState = { tasks: null, loading: true, refreshing: false, busy: false, error: "", unauthorized: false, unresolvedAddition: false };
  let active = true;
  let revision = 0;
  let deferredRefresh = false;
  let pending: TaskAddition | null = null;
  const available = () => active && isCurrentUser();
  function update(patch: Partial<TaskState>) {
    state = { ...state, ...patch };
    if (available()) publish(state);
  }
  function authFailure(error: unknown) {
    if (error instanceof TaskApiError && error.status === 401) {
      update({ unauthorized: true, tasks: null, error: "Sign in to continue." });
    }
  }
  async function refresh() {
    if (!available() || state.unauthorized) return;
    if (state.busy) { deferredRefresh = true; return; }
    if (state.refreshing) return;
    const version = ++revision;
    update({ refreshing: true, loading: state.tasks === null, error: "" });
    try {
      const tasks = await api.list();
      if (available() && version === revision) update({ tasks });
    } catch (error) {
      if (available() && version === revision) {
        authFailure(error);
        if (!state.unauthorized) update({ error: state.tasks === null ? "Could not load tasks. Please retry." : "Could not refresh tasks. Showing the last confirmed tasks." });
      }
    } finally {
      if (available() && version === revision) update({ loading: false, refreshing: false });
    }
  }
  async function mutate<T>(operation: () => Promise<T>): Promise<T> {
    if (!available() || state.unauthorized || state.tasks === null || state.busy) throw new Error("Tasks unavailable");
    ++revision;
    update({ busy: true, refreshing: false });
    try { return await operation(); }
    catch (error) { if (available()) authFailure(error); throw error; }
    finally {
      if (available()) {
        update({ busy: false });
        if (deferredRefresh) { deferredRefresh = false; void refresh(); }
      }
    }
  }
  return {
    refresh,
    dispose() { active = false; ++revision; },
    add(addition: TaskAddition) {
      return mutate(async () => {
        if (pending && JSON.stringify(pending) !== JSON.stringify(addition)) throw new Error("Resolve the pending addition first");
        pending = JSON.parse(JSON.stringify(addition)) as TaskAddition;
        update({ unresolvedAddition: true });
        try {
          const added = await api.add(pending);
          if (available()) {
            const ids = new Set(added.map(task => task.id));
            update({ tasks: [...added, ...(state.tasks ?? []).filter(task => !ids.has(task.id))], unresolvedAddition: false });
            pending = null;
          }
        } catch (error) {
          if (error instanceof TaskApiError && error.status === 400) {
            pending = null;
            update({ unresolvedAddition: false });
          }
          throw error;
        }
      });
    },
    edit(id: number, draft: TaskAddition["tasks"][number]) {
      return mutate(async () => {
        if (pending) throw new Error("Resolve the pending addition first");
        try {
          const task = await api.edit(id, draft);
          if (available()) update({ tasks: state.tasks!.map(current => current.id === id ? task : current) });
        } catch (error) {
          if (error instanceof TaskApiError && error.status === 404) deferredRefresh = true;
          throw error;
        }
      });
    },
    delete(id: number) {
      return mutate(async () => {
        if (pending) throw new Error("Resolve the pending addition first");
        try { await api.delete(id); }
        catch (error) {
          if (!(error instanceof TaskApiError && error.status === 404)) throw error;
          if (!available()) throw error;
          const tasks = await api.list();
          if (tasks.some(task => task.id === id)) throw error;
          if (available()) update({ tasks });
          return;
        }
        if (available()) update({ tasks: state.tasks!.filter(task => task.id !== id) });
      });
    },
  };
}
