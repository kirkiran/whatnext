"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import {
  defaultTaskFormValues,
  formatLabel,
  priorityOptions,
  taskContextOptions,
  Task,
  TaskFormValues,
} from "@/lib/whatnext-data";

type TasksSectionProps = {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
};

export function TasksSection({ tasks, setTasks }: TasksSectionProps) {
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
      energyRequired: formValues.energyRequired,
      contextTag: formValues.contextTag,
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
      energyRequired: task.energyRequired,
      contextTag: task.contextTag,
    });
  }

  function handleDelete(taskId: number) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));

    if (editingTaskId === taskId) {
      resetForm();
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold text-slate-900">Tasks</h2>
          <p className="text-sm text-slate-500">
            Add, update, or remove tasks for the day.
          </p>
        </div>

        <form
          className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5"
          onSubmit={handleSubmit}
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {editingTaskId !== null ? "Edit task" : "Add a task"}
            </p>
            <p className="text-sm text-slate-500">
              Keep task details short and practical so they are easy to scan later.
            </p>
          </div>

          <div className="space-y-4">
            <FormField>
              <FormLabel htmlFor="name">Task name</FormLabel>
              <input
                id="name"
                name="name"
                type="text"
                value={formValues.name}
                onChange={handleInputChange}
                placeholder="Enter a task"
                className={fieldClassName}
              />
            </FormField>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField>
                <FormLabel htmlFor="duration">Estimated duration</FormLabel>
                <input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  value={formValues.duration}
                  onChange={handleInputChange}
                  className={fieldClassName}
                />
              </FormField>

              <SelectField
                id="contextTag"
                label="Context tag"
                name="contextTag"
                options={taskContextOptions}
                value={formValues.contextTag}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
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
                id="energyRequired"
                label="Energy"
                name="energyRequired"
                options={priorityOptions}
                value={formValues.energyRequired}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              {editingTaskId !== null ? "Save task" : "Add task"}
            </button>

            {editingTaskId !== null ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>

        <div className="space-y-3 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">Task list</h3>
            <p className="text-xs text-slate-500">
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
            </p>
          </div>

          {tasks.map((task) => (
            <article
              key={task.id}
              className="rounded-2xl border border-slate-200 bg-white p-3.5"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="pr-2 text-sm font-semibold leading-6 text-slate-900">
                    {task.name}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(task)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(task.id)}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                  <TaskTag label={`${task.duration} min`} />
                  <TaskTag label={`Urgency: ${task.urgency}`} />
                  <TaskTag label={`Importance: ${task.importance}`} />
                  <TaskTag label={`Energy: ${task.energyRequired}`} />
                  <TaskTag label={`Context: ${task.contextTag}`} />
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
};

function SelectField<T extends string>({
  id,
  label,
  name,
  options,
  value,
  onChange,
}: SelectFieldProps<T>) {
  return (
    <FormField>
      <FormLabel htmlFor={id}>{label}</FormLabel>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={fieldClassName}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {formatLabel(option)}
          </option>
        ))}
      </select>
    </FormField>
  );
}

type FormFieldProps = {
  children: React.ReactNode;
};

function FormField({ children }: FormFieldProps) {
  return <div className="space-y-2.5">{children}</div>;
}

type FormLabelProps = {
  children: React.ReactNode;
  htmlFor: string;
};

function FormLabel({ children, htmlFor }: FormLabelProps) {
  return (
    <label
      className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
      htmlFor={htmlFor}
    >
      {children}
    </label>
  );
}

type TaskTagProps = {
  label: string;
};

function TaskTag({ label }: TaskTagProps) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
      {label}
    </span>
  );
}

const fieldClassName =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400";
