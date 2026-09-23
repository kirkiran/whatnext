"use client";

import { ChangeEvent, FormEvent, MouseEvent, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { TaskForm } from "@/components/task-form";
import { TaskList } from "@/components/task-list";
import { Button } from "@/components/ui/button";
import {
  defaultTaskFormValues,
  Task,
  TaskFormValues,
} from "@/lib/whatnext-data";

type TasksSectionProps = {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onResetSampleTasks: () => void;
};

export function TasksSection({
  tasks,
  setTasks,
  onResetSampleTasks,
}: TasksSectionProps) {
  const [formValues, setFormValues] = useState<TaskFormValues>(defaultTaskFormValues);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
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
    formOpenerRef.current = addTaskButtonRef.current;
    setFormValues(defaultTaskFormValues);
    setEditingTaskId(null);
    setIsFormOpen(true);

    if (isFormOpen) {
      taskNameInputRef.current?.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = formValues.name.trim();

    if (!trimmedName) {
      return;
    }

    const nextTask: Task = {
      id: editingTaskId ?? Date.now(),
      name: trimmedName,
      duration: Number(formValues.duration),
      urgency: formValues.urgency,
      importance: formValues.importance,
      focusRequired: formValues.focusRequired,
      contextTag: formValues.contextTag,
      readiness: formValues.readiness,
      canBeDoneInParts: formValues.canBeDoneInParts,
    };

    if (editingTaskId !== null) {
      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === editingTaskId ? nextTask : task)),
      );
    } else {
      setTasks((currentTasks) => [nextTask, ...currentTasks]);
    }

    closeFormAndReturnFocus();
  }

  function handleEdit(task: Task, event: MouseEvent<HTMLButtonElement>) {
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

  function handleDelete(taskId: number) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));

    if (editingTaskId === taskId) {
      formOpenerRef.current = addTaskButtonRef.current;
      closeFormAndReturnFocus();
    }
  }

  function closeFormAndReturnFocus() {
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

          <Button
            ref={addTaskButtonRef}
            variant="primary"
            aria-controls="task-form"
            aria-expanded={isFormOpen}
            onClick={handleOpenAddTask}
          >
            <Plus aria-hidden="true" className="size-icon-compact" />
            Add task
          </Button>
        </div>

        {isFormOpen ? (
          <TaskForm
            editingTaskId={editingTaskId}
            formValues={formValues}
            nameInputRef={taskNameInputRef}
            onCancel={closeFormAndReturnFocus}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
          />
        ) : null}

        <TaskList
          editingTaskId={editingTaskId}
          isFormOpen={isFormOpen}
          tasks={tasks}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onResetSampleTasks={onResetSampleTasks}
        />
      </div>
    </section>
  );
}
