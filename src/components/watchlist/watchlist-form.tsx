"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { ShieldAlertIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { Field, inputClass } from "@/src/components/ui/field";
import { type NewWatchlistEntry, phoneCodes, type Severity, severities } from "@/src/lib/mock-watchlist";

type Values = Omit<NewWatchlistEntry, "severity"> & { severity: Severity };
type Errors = Partial<Record<"firstName" | "lastName" | "email" | "reason", string>>;

const emptyValues: Values = {
  firstName: "",
  lastName: "",
  email: "",
  phoneCode: phoneCodes[0],
  phone: "",
  company: "",
  severity: "Medium",
  reason: "",
};

const input = `${inputClass} aria-invalid:border-red-500`;
const textarea =
  "min-h-[104px] w-full resize-y rounded-lg border border-line-strong bg-surface-soft px-3.5 py-2.5 text-sm text-fg transition placeholder:text-muted hover:border-brand/40 focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20";

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!values.firstName.trim()) errors.firstName = "Enter a first name";
  if (!values.lastName.trim()) errors.lastName = "Enter a last name";
  if (values.email.trim() && !/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "Enter a valid email address";
  if (!values.reason.trim()) errors.reason = "Describe the reason for watchlisting";
  return errors;
}

const ErrorText = ({ id, children }: { id: string; children?: ReactNode }) =>
  children ? (
    <p id={id} role="alert" className="mt-1.5 text-xs text-red-500">
      {children}
    </p>
  ) : null;

/** onSave resolves to an error message to show in the form, or null when the entry was saved */
type WatchlistFormProps = { onSave: (entry: NewWatchlistEntry) => Promise<string | null>; onCancel: () => void };

export function WatchlistForm({ onSave, onCancel }: WatchlistFormProps) {
  const [values, setValues] = useState<Values>(emptyValues);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function change<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    // clear a message as soon as the person starts fixing it
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key as keyof Errors];
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
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phoneCode: values.phoneCode,
      phone: values.phone.trim(),
      company: values.company.trim(),
      severity: values.severity,
      reason: values.reason.trim(),
    });
    // on success the page closes this form; on failure keep what was typed and say why
    if (problem) {
      setFormError(problem);
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-5 [box-shadow:var(--shadow)] sm:p-6" aria-label="Add watchlist entry">
      <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold">
        <ShieldAlertIcon size={16} className="text-brand" />
        Add Watchlist Entry
      </h2>

      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="First Name" htmlFor="wl-first-name" required>
            <input
              id="wl-first-name"
              autoFocus
              value={values.firstName}
              onChange={(event) => change("firstName", event.target.value)}
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={errors.firstName ? "wl-first-name-error" : undefined}
              className={input}
            />
            <ErrorText id="wl-first-name-error">{errors.firstName}</ErrorText>
          </Field>

          <Field label="Last Name" htmlFor="wl-last-name" required>
            <input
              id="wl-last-name"
              value={values.lastName}
              onChange={(event) => change("lastName", event.target.value)}
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={errors.lastName ? "wl-last-name-error" : undefined}
              className={input}
            />
            <ErrorText id="wl-last-name-error">{errors.lastName}</ErrorText>
          </Field>

          <Field label="Email" htmlFor="wl-email">
            <input
              id="wl-email"
              type="email"
              value={values.email}
              onChange={(event) => change("email", event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "wl-email-error" : undefined}
              className={input}
            />
            <ErrorText id="wl-email-error">{errors.email}</ErrorText>
          </Field>

          <Field label="Phone" htmlFor="wl-phone">
            <div className="flex gap-2">
              <select
                value={values.phoneCode}
                onChange={(event) => change("phoneCode", event.target.value)}
                aria-label="Country code"
                className={`${inputClass} w-[88px] shrink-0 px-2.5`}
              >
                {phoneCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
              <input
                id="wl-phone"
                type="tel"
                inputMode="tel"
                value={values.phone}
                onChange={(event) => change("phone", event.target.value)}
                placeholder="801 234 5678"
                className={inputClass}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted">Check-in is blocked by phone number, so add one if you have it.</p>
          </Field>

          <Field label="Company" htmlFor="wl-company">
            <input id="wl-company" value={values.company} onChange={(event) => change("company", event.target.value)} className={input} />
          </Field>

          <Field label="Severity" htmlFor="wl-severity">
            <select
              id="wl-severity"
              value={values.severity}
              onChange={(event) => change("severity", event.target.value as Severity)}
              className={`${inputClass} px-3`}
            >
              {severities.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </Field>

          <div className="md:col-span-2">
            <Field label="Reason" htmlFor="wl-reason" required>
              <textarea
                id="wl-reason"
                rows={4}
                value={values.reason}
                onChange={(event) => change("reason", event.target.value)}
                placeholder="Describe the reason for watchlisting..."
                aria-invalid={Boolean(errors.reason)}
                aria-describedby={errors.reason ? "wl-reason-error" : undefined}
                className={`${textarea} aria-invalid:border-red-500`}
              />
              <ErrorText id="wl-reason-error">{errors.reason}</ErrorText>
            </Field>
          </div>
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
            <ShieldAlertIcon size={15} />
            {submitting ? "Adding…" : "Add to Watchlist"}
          </Button>
        </div>
      </form>
    </section>
  );
}
