"use client";

import { ChangeEvent } from "react";
import { Select } from "@/components/ui/select";
import {
  CurrentContext,
  formatLabel,
  formatLocationLabel,
  locationOptions,
  priorityOptions,
  timeOptions,
} from "@/lib/whatnext-data";

type CurrentContextSectionProps = {
  context: CurrentContext;
  setContext: React.Dispatch<React.SetStateAction<CurrentContext>>;
};

export function CurrentContextSection({
  context,
  setContext,
}: CurrentContextSectionProps) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const { name, value } = event.target;

    setContext((currentContext) => ({
      ...currentContext,
      [name]: value,
    }));
  }

  return (
    <section className="rounded-card border border-line bg-surface-primary p-ds-5 sm:p-ds-6">
      <div className="flex flex-col gap-ds-6">
        <div className="space-y-ds-2">
          <h2 className="text-section-title text-content-primary">
            Current Context
          </h2>
          <p className="text-body-small text-content-secondary">
            Tell WhatNext what your situation is right now.
          </p>
        </div>

        <div className="grid gap-ds-5 border-t border-line-subtle pt-ds-6 md:grid-cols-2">
          <SelectField
            id="timeAvailable"
            label="Time available now"
            name="timeAvailable"
            options={timeOptions}
            value={context.timeAvailable}
            onChange={handleChange}
            suffix="minutes"
          />

          <SelectField
            id="currentFocus"
            label="Current focus"
            name="currentFocus"
            options={priorityOptions}
            value={context.currentFocus}
            onChange={handleChange}
          />

          <SelectField
            id="interruptionRisk"
            label="Chance you'll be interrupted"
            name="interruptionRisk"
            options={priorityOptions}
            value={context.interruptionRisk}
            onChange={handleChange}
            helperText="High interruption favors shorter, lower-focus tasks."
          />

          <SelectField
            id="location"
            label="Where are you now?"
            name="location"
            options={locationOptions}
            value={context.location}
            onChange={handleChange}
            getOptionLabel={formatLocationLabel}
          />
        </div>

        <div className="border-t border-line-subtle pt-ds-6">
          <div className="space-y-ds-1">
            <h3 className="text-component-title text-content-primary">
              Selected context
            </h3>
            <p className="text-body-small text-content-muted">
              This is the context used for the current recommendation.
            </p>
          </div>

          <dl className="mt-ds-4 grid gap-ds-3 sm:grid-cols-2">
            <ContextDetail
              label="Time available"
              value={`${context.timeAvailable} minutes`}
            />
            <ContextDetail
              label="Current focus"
              value={formatLabel(context.currentFocus)}
            />
            <ContextDetail
              label="Chance you'll be interrupted"
              value={formatLabel(context.interruptionRisk)}
            />
            <ContextDetail
              label="Current location"
              value={formatLocationLabel(context.location)}
            />
          </dl>
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
  suffix?: string;
  helperText?: string;
  getOptionLabel?: (option: T) => string;
};

function SelectField<T extends string>({
  id,
  label,
  name,
  options,
  value,
  onChange,
  suffix,
  helperText,
  getOptionLabel,
}: SelectFieldProps<T>) {
  const helperTextId = helperText ? `${id}-helper` : undefined;

  return (
    <div className="space-y-ds-2">
      <label className="block text-label text-content-secondary" htmlFor={id}>
        {label}
      </label>
      <Select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        aria-describedby={helperTextId}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {suffix
              ? `${option} ${suffix}`
              : getOptionLabel
                ? getOptionLabel(option)
                : formatLabel(option)}
          </option>
        ))}
      </Select>
      {helperText ? (
        <p id={helperTextId} className="text-body-small text-content-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

type ContextDetailProps = {
  label: string;
  value: string;
};

function ContextDetail({ label, value }: ContextDetailProps) {
  return (
    <div className="space-y-ds-1">
      <dt className="text-metadata text-content-muted">{label}</dt>
      <dd className="text-body-small text-content-secondary">{value}</dd>
    </div>
  );
}
