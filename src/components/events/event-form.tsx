"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Field, inputClass } from "@/src/components/ui/field";
import { type EventItem, MAX_CAPACITY, type NewEvent } from "@/src/lib/mock-events";

type Values = {
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  capacity: string;
  description: string;
  requireNda: boolean;
  requirePhoto: boolean;
  requireApproval: boolean;
};

type Errors = Partial<Record<"title" | "start" | "end" | "capacity", string>>;

const emptyValues: Values = {
  title: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  capacity: "",
  description: "",
  requireNda: false,
  requirePhoto: false,
  requireApproval: false,
};

const fromEvent = (event: EventItem): Values => ({
  title: event.title,
  startDate: event.startDate,
  startTime: event.startTime,
  endDate: event.endDate,
  endTime: event.endTime,
  capacity: String(event.capacity),
  description: event.description,
  requireNda: event.requireNda,
  requirePhoto: event.requirePhoto,
  requireApproval: event.requireApproval,
});

const input = `${inputClass} aria-invalid:border-red-500`;
const textarea =
  "min-h-[92px] w-full resize-y rounded-lg border border-line-strong bg-surface-soft px-3.5 py-2.5 text-sm text-fg transition placeholder:text-muted hover:border-brand/40 focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20";

const policies = [
  { key: "requireNda", label: "Require NDA/Waiver signing on check-in" },
  { key: "requirePhoto", label: "Require photo capture on check-in" },
  { key: "requireApproval", label: "Require host approval to attend" },
] as const;

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!values.title.trim()) errors.title = "Enter an event title";
  if (!values.startDate || !values.startTime) errors.start = "Choose a start date and time";
  if (!values.endDate || !values.endTime) errors.end = "Choose an end date and time";

  // "2026-11-09T14:00" strings sort the same way the times do
  if (!errors.start && !errors.end && `${values.endDate}T${values.endTime}` <= `${values.startDate}T${values.startTime}`) {
    errors.end = "The event must end after it starts";
  }

  const capacity = Number(values.capacity);
  if (!values.capacity.trim() || !Number.isInteger(capacity) || capacity < 1 || capacity > MAX_CAPACITY) {
    errors.capacity = `Enter a whole number from 1 to ${MAX_CAPACITY}`;
  }
  return errors;
}

const ErrorText = ({ id, children }: { id: string; children?: ReactNode }) =>
  children ? (
    <p id={id} role="alert" className="mt-1.5 text-xs text-red-500">
      {children}
    </p>
  ) : null;

/**
 * onSave resolves to an error message to show in the form, or null when the event was saved.
 * Pass `initial` to edit an existing event instead of creating a new one.
 */
type EventFormProps = { onSave: (event: NewEvent) => Promise<string | null>; onCancel: () => void; initial?: EventItem };

export function EventForm({ onSave, onCancel, initial }: EventFormProps) {
  const editing = Boolean(initial);
  const [values, setValues] = useState<Values>(initial ? fromEvent(initial) : emptyValues);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function change<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    // clear a message as soon as the person starts fixing it
    setErrors((current) => {
      const field = key === "startDate" || key === "startTime" ? "start" : key === "endDate" || key === "endTime" ? "end" : key;
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field as keyof Errors];
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setFormError("");
    const problem = await onSave({
      title: values.title.trim(),
      startDate: values.startDate,
      startTime: values.startTime,
      endDate: values.endDate,
      endTime: values.endTime,
      capacity: Number(values.capacity),
      description: values.description.trim(),
      requireNda: values.requireNda,
      requirePhoto: values.requirePhoto,
      requireApproval: values.requireApproval,
    });
    // on success the page closes this form; on failure keep what was typed and say why
    if (problem) {
      setFormError(problem);
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-5 [box-shadow:var(--shadow)] sm:p-6" aria-label={editing ? "Edit event" : "Create new event"}>
      <h2 className="mb-5 text-sm font-semibold">{editing ? "Edit Event" : "Create New Event"}</h2>

      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Field label="Event Title" htmlFor="event-title" required>
            <input
              id="event-title"
              autoFocus
              value={values.title}
              onChange={(event) => change("title", event.target.value)}
              placeholder="e.g. Annual Partner Summit"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "event-title-error" : undefined}
              className={input}
            />
            <ErrorText id="event-title-error">{errors.title}</ErrorText>
          </Field>

          <Field label="Start Date & Time" htmlFor="event-start-date" required>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                id="event-start-date"
                type="date"
                value={values.startDate}
                onChange={(event) => change("startDate", event.target.value)}
                aria-invalid={Boolean(errors.start)}
                aria-describedby={errors.start ? "event-start-error" : undefined}
                className={input}
              />
              <input
                type="time"
                value={values.startTime}
                onChange={(event) => change("startTime", event.target.value)}
                aria-label="Start time"
                aria-invalid={Boolean(errors.start)}
                aria-describedby={errors.start ? "event-start-error" : undefined}
                className={input}
              />
            </div>
            <ErrorText id="event-start-error">{errors.start}</ErrorText>
          </Field>

          <Field label="End Date & Time" htmlFor="event-end-date" required>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                id="event-end-date"
                type="date"
                value={values.endDate}
                min={values.startDate || undefined}
                onChange={(event) => change("endDate", event.target.value)}
                aria-invalid={Boolean(errors.end)}
                aria-describedby={errors.end ? "event-end-error" : undefined}
                className={input}
              />
              <input
                type="time"
                value={values.endTime}
                onChange={(event) => change("endTime", event.target.value)}
                aria-label="End time"
                aria-invalid={Boolean(errors.end)}
                aria-describedby={errors.end ? "event-end-error" : undefined}
                className={input}
              />
            </div>
            <ErrorText id="event-end-error">{errors.end}</ErrorText>
          </Field>

          <Field label="Capacity Limit" htmlFor="event-capacity" required>
            <input
              id="event-capacity"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_CAPACITY}
              value={values.capacity}
              onChange={(event) => change("capacity", event.target.value)}
              placeholder={`Max ${MAX_CAPACITY} attendees`}
              aria-invalid={Boolean(errors.capacity)}
              aria-describedby={errors.capacity ? "event-capacity-error" : undefined}
              className={input}
            />
            <ErrorText id="event-capacity-error">{errors.capacity}</ErrorText>
          </Field>
        </div>

        <Field label="Event Description" htmlFor="event-description">
          <textarea
            id="event-description"
            rows={3}
            value={values.description}
            onChange={(event) => change("description", event.target.value)}
            placeholder="Details shown to attendees on the registration page..."
            className={textarea}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {policies.map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer select-none items-center gap-2 text-xs text-soft">
              <input
                type="checkbox"
                checked={values[key]}
                onChange={(event) => change(key, event.target.checked)}
                className="h-3.5 w-3.5 cursor-pointer accent-green-600"
              />
              {label}
            </label>
          ))}
        </div>

        {formError && (
          <p role="alert" className="rounded-lg border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-600 dark:text-red-300">
            {formError}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {submitting ? "Saving…" : editing ? "Save Changes" : "Save Event"}
          </Button>
        </div>
      </form>
    </section>
  );
}