"use client";

import { ChangeEvent } from "react";
import { AudioWaveform, BellRing, Clock, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MetadataItem } from "@/components/ui/metadata-item";
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
    <section className="rounded-card border border-line bg-surface-primary p-ds-5 shadow-1 sm:p-ds-6">
      <div className="flex flex-col gap-ds-5">
        <div className="space-y-ds-2">
          <h2 className="text-section-title text-content-primary">
            Current Context
          </h2>
          <p className="text-body-small text-content-secondary">
            Tell WhatNext what your situation is right now.
          </p>
        </div>

        <div className="grid gap-ds-4 border-t border-line-subtle pt-ds-5 md:grid-cols-2 xl:grid-cols-4">
          <SelectField
            id="timeAvailable"
            label="Time available now"
            name="timeAvailable"
            options={timeOptions}
            value={context.timeAvailable}
            onChange={handleChange}
            suffix="minutes"
            icon={Clock}
          />

          <SelectField
            id="currentFocus"
            label="Current focus"
            name="currentFocus"
            options={priorityOptions}
            value={context.currentFocus}
            onChange={handleChange}
            icon={AudioWaveform}
          />

          <SelectField
            id="interruptionRisk"
            label="Chance you'll be interrupted"
            name="interruptionRisk"
            options={priorityOptions}
            value={context.interruptionRisk}
            onChange={handleChange}
            helperText="High interruption favors shorter, lower-focus tasks."
            icon={BellRing}
          />

          <SelectField
            id="location"
            label="Where are you now?"
            name="location"
            options={locationOptions}
            value={context.location}
            onChange={handleChange}
            getOptionLabel={formatLocationLabel}
            icon={MapPin}
          />
        </div>

        <div className="flex flex-col gap-ds-3 rounded-control bg-surface-secondary px-ds-4 py-ds-3 sm:flex-row sm:items-center">
          <p className="shrink-0 text-label text-content-muted">Using now</p>
          <dl className="flex flex-wrap gap-x-ds-5 gap-y-ds-2">
            <ContextDetail
              label="Time available"
              value={`${context.timeAvailable} minutes`}
              icon={Clock}
            />
            <ContextDetail
              label="Current focus"
              value={`${formatLabel(context.currentFocus)} focus`}
              icon={AudioWaveform}
            />
            <ContextDetail
              label="Chance you'll be interrupted"
              value={`${formatLabel(context.interruptionRisk)} interruption risk`}
              icon={BellRing}
            />
            <ContextDetail
              label="Current location"
              value={formatLocationLabel(context.location)}
              icon={MapPin}
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
  icon: LucideIcon;
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
  icon: Icon,
}: SelectFieldProps<T>) {
  const helperTextId = helperText ? `${id}-helper` : undefined;

  return (
    <div className="space-y-ds-2">
      <label className="block text-label text-content-secondary" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute left-ds-3 top-1/2 size-icon-standard -translate-y-1/2 text-content-muted"
          strokeWidth={1.75}
        />
        <Select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          aria-describedby={helperTextId}
          className="pl-ds-10"
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
      </div>
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
  icon: LucideIcon;
};

function ContextDetail({ label, value, icon }: ContextDetailProps) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <MetadataItem icon={icon}>{value}</MetadataItem>
      </dd>
    </div>
  );
}
