"use client";

import { ChangeEvent } from "react";
import {
  CurrentContext,
  formatLabel,
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
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex h-full flex-col gap-5">
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold text-slate-900">Current Context</h2>
          <p className="text-sm text-slate-500">
            Set what your day looks like right now.
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
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
            id="currentEnergy"
            label="Current energy"
            name="currentEnergy"
            options={priorityOptions}
            value={context.currentEnergy}
            onChange={handleChange}
          />

          <SelectField
            id="interruptionRisk"
            label="Interruption risk"
            name="interruptionRisk"
            options={priorityOptions}
            value={context.interruptionRisk}
            onChange={handleChange}
          />

          <SelectField
            id="location"
            label="Location"
            name="location"
            options={locationOptions}
            value={context.location}
            onChange={handleChange}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900">Selected context</h3>
            <p className="text-sm text-slate-500">
              This is the context used for the current recommendation.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
            <ContextTag label={`${context.timeAvailable} minutes available`} />
            <ContextTag label={`Energy: ${context.currentEnergy}`} />
            <ContextTag label={`Interruption risk: ${context.interruptionRisk}`} />
            <ContextTag label={`Location: ${context.location}`} />
          </div>
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
};

function SelectField<T extends string>({
  id,
  label,
  name,
  options,
  value,
  onChange,
  suffix,
}: SelectFieldProps<T>) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {suffix ? `${option} ${suffix}` : formatLabel(option)}
          </option>
        ))}
      </select>
    </div>
  );
}

type ContextTagProps = {
  label: string;
};

function ContextTag({ label }: ContextTagProps) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
      {label}
    </span>
  );
}
