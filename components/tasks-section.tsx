"use client";

import { ChangeEvent, FormEvent, MouseEvent, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { TaskForm } from "@/components/task-form";
import { TaskList } from "@/components/task-list";
import { CaptureForm } from "@/components/capture-form";
import { parseTaskDraft } from "@/lib/task-storage";
import type { TaskAddition } from "@/lib/task-storage";
import { TaskApiError } from "@/lib/task-api";
import { Button } from "@/components/ui/button";
import {
  defaultTaskFormValues,
  Task,
  TaskFormValues,
} from "@/lib/whatnext-data";

type TasksSectionProps = {
  tasks: Task[];
  busy: boolean;
  unresolvedAddition: boolean;
  onAdd: (addition: TaskAddition) => Promise<void>;
  onEditTask: (id: number, draft: TaskAddition["tasks"][number]) => Promise<void>;
  onDeleteTask: (id: number) => Promise<void>;
};

export function TasksSection({
  tasks,
  busy,
  unresolvedAddition,
  onAdd,
  onEditTask,
  onDeleteTask,
}: TasksSectionProps) {
  const [formValues, setFormValues] = useState<TaskFormValues>(defaultTaskFormValues);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingAddition, setPendingAddition] = useState<TaskAddition | null>(null);
  const inFlight = useRef(false);
  const locked = busy || unresolvedAddition || saving || deletingId !== null;
  const addTaskButtonRef = useRef<HTMLButtonElement>(null);
  const taskNameInputRef = useRef<HTMLInputElement>(null);
  const formOpenerRef = useRef<HTMLButtonElement | null>(null);
  const shouldReturnFocusRef = useRef(false);

  useEffect(() => {
    if (isFormOpen) {
      taskNameInputRef.current?.focus();
      return;
    }

    if (shouldReturnFocusRef.current) {
      shouldReturnFocusRef.current = false;
      (formOpenerRef.current ?? addTaskButtonRef.current)?.focus();
    }
  }, [editingTaskId, isFormOpen]);

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  }

  function handleOpenAddTask() {
    if (locked) return;
    setError("");
    formOpenerRef.current = addTaskButtonRef.current;
    setFormValues(defaultTaskFormValues);
    setEditingTaskId(null);
    setIsFormOpen(true);

    if (isFormOpen) {
      taskNameInputRef.current?.focus();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || busy || (unresolvedAddition && !pendingAddition)) return;
    let draft;
    try {
      draft = parseTaskDraft({ ...formValues, duration: Number(formValues.duration) });
    } catch {
      setError("Enter a task name of at most 500 characters and a positive duration.");
      return;
    }
    inFlight.current = true;
    setSaving(true);
    setError("");
    try {
      if (editingTaskId !== null) {
        await onEditTask(editingTaskId, draft);
      } else {
        const addition = pendingAddition ?? { requestId: crypto.randomUUID(), tasks: [draft] };
        setPendingAddition(addition);
        try { await onAdd(addition); }
        catch (failure) {
          if (failure instanceof TaskApiError && failure.status === 400) setPendingAddition(null);
          throw failure;
        }
        setPendingAddition(null);
      }
      closeFormAndReturnFocus();
    } catch (failure) {
      setError(failure instanceof TaskApiError && failure.status === 404
        ? "This task is no longer available. Your changes are still here. Cancel to return to your tasks."
        : failure instanceof TaskApiError && failure.status === 400
          ? "Check the task details and try again. Your input is still here."
          : "Could not confirm the save. Your input is still here. Try again.");
    } finally { inFlight.current = false; setSaving(false); }
  }

  function handleEdit(task: Task, event: MouseEvent<HTMLButtonElement>) {
    if (locked) return;
    setError("");
    formOpenerRef.current = event.currentTarget;
    setEditingTaskId(task.id);
    setFormValues({
      name: task.name,
      duration: String(task.duration),
      urgency: task.urgency,
      importance: task.importance,
      focusRequired: task.focusRequired,
      contextTag: task.contextTag,
      readiness: task.readiness,
      canBeDoneInParts: task.canBeDoneInParts,
    });
    setIsFormOpen(true);

    if (isFormOpen && editingTaskId === task.id) {
      taskNameInputRef.current?.focus();
    }
  }

  async function handleDelete(taskId: number) {
    if (inFlight.current || locked) return;
    inFlight.current = true;
    setDeletingId(taskId);
    setError("");
    try {
      await onDeleteTask(taskId);
      if (editingTaskId === taskId) {
        formOpenerRef.current = addTaskButtonRef.current;
        closeFormAndReturnFocus();
      }
    } catch {
      setError("Could not confirm deletion. Refresh tasks or try Delete again.");
    } finally { inFlight.current = false; setDeletingId(null); }
  }

  function closeFormAndReturnFocus() {
    setError("");
    setFormValues(defaultTaskFormValues);
    setEditingTaskId(null);
    shouldReturnFocusRef.current = true;
    setIsFormOpen(false);
  }

  return (
    <section className="rounded-card border border-line bg-surface-primary p-ds-5 sm:p-ds-6">
      <div className="flex flex-col gap-ds-5">
        <div className="flex flex-col gap-ds-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-ds-2">
            <h2 className="text-section-title text-content-primary">
              Your Tasks ({tasks.length})
            </h2>
            <p className="text-body-small text-content-secondary">
              Blocked tasks stay visible, but they are skipped for recommendations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-ds-2 sm:justify-end">
            <Button
              ref={addTaskButtonRef}
              disabled={locked || pendingAddition !== null}
              variant="primary"
              aria-controls="task-form"
              aria-expanded={isFormOpen}
              onClick={handleOpenAddTask}
            >
              <Plus aria-hidden="true" className="size-icon-compact" />
              Add task
            </Button>
          </div>
        </div>

        <CaptureForm ready={!busy && !saving && deletingId === null} blocked={unresolvedAddition || pendingAddition !== null} onSave={onAdd} />
        {unresolvedAddition ? <p role="status" className="text-body-small text-content-secondary">An addition is awaiting confirmation. Use its Retry save before changing tasks. Reloading loads the server’s tasks and abandons this in-memory retry.</p> : null}
        {error ? <p role="alert" className="text-body-small text-status-danger-text">{error}</p> : null}

        {isFormOpen ? (
          <TaskForm
            saving={saving}
            locked={locked || pendingAddition !== null}
            retry={pendingAddition !== null}
            editingTaskId={editingTaskId}
            formValues={formValues}
            nameInputRef={taskNameInputRef}
            onCancel={closeFormAndReturnFocus}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
          />
        ) : null}

        <TaskList
          disabled={locked || pendingAddition !== null}
          deletingId={deletingId}
          editingTaskId={editingTaskId}
          isFormOpen={isFormOpen}
          tasks={tasks}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </div>
    </section>
  );
}
