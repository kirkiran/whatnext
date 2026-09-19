"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  defaultTaskFormValues,
  formatLabel,
  formatTaskContextLabel,
  partialProgressOptions,
  priorityOptions,
  readinessOptions,
  taskContextOptions,
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

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  }

  function resetForm() {
    setFormValues(defaultTaskFormValues);
    setEditingTaskId(null);
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

    resetForm();
  }

  function handleEdit(task: Task) {
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
  }

  function handleDelete(taskId: number) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));

    if (editingTaskId === taskId) {
      resetForm();
    }
  }

  return (
    <section className="rounded-card border border-line bg-surface-primary p-ds-5 sm:p-ds-6">
      <div className="flex flex-col gap-ds-6">
        <div className="space-y-ds-2">
          <h2 className="text-section-title text-content-primary">
            Step 1: Add or review your tasks
          </h2>
          <p className="text-body-small text-content-secondary">
            Start by listing the tasks you want WhatNext to consider.
          </p>
        </div>

        <form
          className="space-y-ds-6 border-t border-line-subtle pt-ds-6"
          onSubmit={handleSubmit}
        >
          <div className="space-y-ds-1">
            <p className="text-component-title text-content-primary">
              {editingTaskId !== null ? "Edit task" : "Add a task"}
            </p>
            <p className="text-body-small text-content-muted">
              Keep task details short and practical so they are easy to scan later.
            </p>
          </div>

          <div className="space-y-ds-5">
            <FormField>
              <FormLabel htmlFor="name">Task name</FormLabel>
              <Input
                id="name"
                name="name"
                type="text"
                value={formValues.name}
                onChange={handleInputChange}
                placeholder="Enter a task"
              />
            </FormField>

            <div className="grid gap-ds-4 md:grid-cols-2">
              <FormField>
                <FormLabel htmlFor="duration">Estimated duration</FormLabel>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  value={formValues.duration}
                  onChange={handleInputChange}
                />
              </FormField>

              <SelectField
                id="contextTag"
                label="Where can you do this?"
                name="contextTag"
                options={taskContextOptions}
                value={formValues.contextTag}
                onChange={handleInputChange}
                getOptionLabel={formatTaskContextLabel}
              />
            </div>

            <div className="grid gap-ds-4 md:grid-cols-2">
              <SelectField
                id="urgency"
                label="Urgency"
                name="urgency"
                options={priorityOptions}
                value={formValues.urgency}
                onChange={handleInputChange}
              />

              <SelectField
                id="importance"
                label="Importance"
                name="importance"
                options={priorityOptions}
                value={formValues.importance}
                onChange={handleInputChange}
              />

              <SelectField
                id="focusRequired"
                label="Focus required"
                name="focusRequired"
                options={priorityOptions}
                value={formValues.focusRequired}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid gap-ds-4 md:grid-cols-2">
              <SelectField
                id="readiness"
                label="Can this be done now?"
                name="readiness"
                options={readinessOptions}
                value={formValues.readiness}
                onChange={handleInputChange}
              />

              <SelectField
                id="canBeDoneInParts"
                label="Can be done in parts?"
                name="canBeDoneInParts"
                options={partialProgressOptions}
                value={formValues.canBeDoneInParts}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-ds-3">
            <Button type="submit" variant="primary">
              {editingTaskId !== null ? "Save task" : "Add task"}
            </Button>

            {editingTaskId !== null ? (
              <Button type="button" variant="tertiary" onClick={resetForm}>
                Cancel edit
              </Button>
            ) : null}
          </div>
        </form>

        <div className="border-t border-line-subtle pt-ds-6">
          <div className="flex flex-wrap items-end justify-between gap-ds-3 pb-ds-3">
            <div className="space-y-ds-1">
              <h3 className="text-component-title text-content-primary">
                Task list
              </h3>
              <p className="text-body-small text-content-muted">
                Blocked tasks stay visible, but they are skipped for recommendations.
              </p>
            </div>
            <div className="flex items-center gap-ds-3">
              <p className="text-metadata text-content-muted">
                {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
              </p>
              <Button variant="tertiary" onClick={onResetSampleTasks}>
                Reset sample tasks
              </Button>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="space-y-ds-1 border-t border-line-subtle py-ds-6">
              <p className="text-component-title text-content-primary">
                No tasks yet
              </p>
              <p className="text-body-small text-content-secondary">
                Add a task when you’re ready, or restore the sample tasks.
              </p>
            </div>
          ) : null}

          {tasks.map((task) => (
            <article key={task.id} className="border-t border-line-subtle py-ds-5">
              <div className="flex flex-col gap-ds-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-ds-3">
                  <div className="flex flex-wrap items-center gap-ds-2">
                    <h3 className="text-component-title text-content-primary">
                      {task.name}
                    </h3>
                    <Badge
                      variant={task.readiness === "ready" ? "success" : "danger"}
                    >
                      {task.readiness === "ready" ? "Ready" : "Blocked"}
                    </Badge>
                  </div>

                  <p className="text-metadata text-content-secondary">
                    {`${task.duration} min · ${formatTaskContextLabel(task.contextTag)} · ${formatLabel(task.focusRequired)} focus · ${formatLabel(task.importance)} importance · ${formatLabel(task.urgency)} urgency`}
                  </p>

                  <p className="text-body-small text-content-muted">
                    {task.canBeDoneInParts === "yes"
                      ? "Can be done in parts"
                      : "Needs a full session"}
                  </p>
                </div>

                <div className="flex shrink-0 gap-ds-2">
                  <Button
                    type="button"
                    variant="tertiary"
                    onClick={() => handleEdit(task)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleDelete(task.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

type SelectFieldProps<T extends string> = {
  id: string;
  label: string;
  name: string;
  options: T[];
  value: T;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  getOptionLabel?: (option: T) => string;
};

function SelectField<T extends string>({
  id,
  label,
  name,
  options,
  value,
  onChange,
  getOptionLabel,
}: SelectFieldProps<T>) {
  return (
    <FormField>
      <FormLabel htmlFor={id}>{label}</FormLabel>
      <Select id={id} name={name} value={value} onChange={onChange}>
        {options.map((option) => (
          <option key={option} value={option}>
            {getOptionLabel ? getOptionLabel(option) : formatLabel(option)}
          </option>
        ))}
      </Select>
    </FormField>
  );
}

type FormFieldProps = {
  children: React.ReactNode;
};

function FormField({ children }: FormFieldProps) {
  return <div className="space-y-ds-2">{children}</div>;
}

type FormLabelProps = {
  children: React.ReactNode;
  htmlFor: string;
};

function FormLabel({ children, htmlFor }: FormLabelProps) {
  return (
    <label className="block text-label text-content-secondary" htmlFor={htmlFor}>
      {children}
    </label>
  );
}
