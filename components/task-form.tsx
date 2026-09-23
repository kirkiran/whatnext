import { ChangeEvent, FormEvent, Ref } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import {
  formatLabel,
  formatTaskContextLabel,
  partialProgressOptions,
  priorityOptions,
  readinessOptions,
  taskContextOptions,
  TaskFormValues,
} from "@/lib/whatnext-data";

type TaskFormProps = {
  editingTaskId: number | null;
  formValues: TaskFormValues;
  nameInputRef: Ref<HTMLInputElement>;
  onCancel: () => void;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function TaskForm({
  editingTaskId,
  formValues,
  nameInputRef,
  onCancel,
  onChange,
  onSubmit,
}: TaskFormProps) {
  const isEditing = editingTaskId !== null;

  return (
    <Surface variant="subtle" className="p-ds-4 sm:p-ds-5">
      <form
        id="task-form"
        className="space-y-ds-5"
        aria-labelledby="task-form-title"
        onSubmit={onSubmit}
      >
        <div className="space-y-ds-1">
          <h3 id="task-form-title" className="text-component-title text-content-primary">
            {isEditing ? "Edit task" : "Add a task"}
          </h3>
          <p className="text-body-small text-content-muted">
            Keep task details short and practical so they are easy to scan later.
          </p>
        </div>

        <div className="grid gap-ds-4 md:grid-cols-2 xl:grid-cols-4">
          <FormField className="md:col-span-2 xl:col-span-4">
            <FormLabel htmlFor="name">Task name</FormLabel>
            <Input
              ref={nameInputRef}
              id="name"
              name="name"
              type="text"
              value={formValues.name}
              onChange={onChange}
              placeholder="Enter a task"
            />
          </FormField>

          <FormField>
            <FormLabel htmlFor="duration">Estimated duration</FormLabel>
            <Input
              id="duration"
              name="duration"
              type="number"
              min="1"
              value={formValues.duration}
              onChange={onChange}
            />
          </FormField>

          <SelectField
            id="contextTag"
            label="Where can you do this?"
            name="contextTag"
            options={taskContextOptions}
            value={formValues.contextTag}
            onChange={onChange}
            getOptionLabel={formatTaskContextLabel}
          />

          <SelectField
            id="urgency"
            label="Urgency"
            name="urgency"
            options={priorityOptions}
            value={formValues.urgency}
            onChange={onChange}
          />

          <SelectField
            id="importance"
            label="Importance"
            name="importance"
            options={priorityOptions}
            value={formValues.importance}
            onChange={onChange}
          />

          <SelectField
            id="focusRequired"
            label="Focus required"
            name="focusRequired"
            options={priorityOptions}
            value={formValues.focusRequired}
            onChange={onChange}
          />

          <SelectField
            id="readiness"
            label="Can this be done now?"
            name="readiness"
            options={readinessOptions}
            value={formValues.readiness}
            onChange={onChange}
          />

          <SelectField
            id="canBeDoneInParts"
            label="Can be done in parts?"
            name="canBeDoneInParts"
            options={partialProgressOptions}
            value={formValues.canBeDoneInParts}
            onChange={onChange}
          />
        </div>

        <div className="flex flex-wrap gap-ds-3">
          <Button type="submit" variant="primary">
            {isEditing ? "Save task" : "Add task"}
          </Button>
          <Button type="button" variant="tertiary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Surface>
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
  className?: string;
};

function FormField({ children, className = "" }: FormFieldProps) {
  return <div className={`space-y-ds-2 ${className}`}>{children}</div>;
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
