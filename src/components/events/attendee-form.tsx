"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Field, inputClass } from "@/src/components/ui/field";
import { phoneCodes } from "@/src/lib/mock-preregistrations";

export type AttendeeValues = {
  firstName: string;
  lastName: string;
  email: string;
  phoneCode: string;
  phone: string;
  company: string;
};

type Errors = Partial<Record<"firstName" | "lastName" | "email" | "phone", string>>;

const empty: AttendeeValues = { firstName: "", lastName: "", email: "", phoneCode: phoneCodes[0], phone: "", company: "" };
const input = `${inputClass} aria-invalid:border-red-500`;

function validate(values: AttendeeValues): Errors {
  const errors: Errors = {};
  if (!values.firstName.trim()) errors.firstName = "Enter a first name";
  if (!values.lastName.trim()) errors.lastName = "Enter a last name";
  if (values.email.trim() && !/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "Enter a valid email address";
  if (!values.phone.trim()) errors.phone = "Enter a phone number";
  return errors;
}

const ErrorText = ({ id, children }: { id: string; children?: ReactNode }) =>
  children ? (
    <p id={id} role="alert" className="mt-1.5 text-xs text-red-500">
      {children}
    </p>
  ) : null;

type AttendeeFormProps = {
  /** Resolves to an error message to show in the form, or null when the person was registered */
  onSubmit: (values: AttendeeValues) => Promise<string | null>;
  submitLabel: string;
  /** Keeps the field ids unique when two of these forms are on one page */
  idPrefix: string;
  onCancel?: () => void;
};

/** The registration form, used by staff on the event page and by attendees on the public registration page */
export function AttendeeForm({ onSubmit, submitLabel, idPrefix, onCancel }: AttendeeFormProps) {
  const [values, setValues] = useState<AttendeeValues>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function change<K extends keyof AttendeeValues>(key: K, value: AttendeeValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
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
    const problem = await onSubmit({
      ...values,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      company: values.company.trim(),
    });
    setSubmitting(false);
    if (problem) setFormError(problem);
    else setValues(empty); // ready for the next person
  }

  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="First name" htmlFor={id("first-name")} required>
          <input
            id={id("first-name")}
            autoComplete="given-name"
            value={values.firstName}
            onChange={(event) => change("firstName", event.target.value)}
            aria-invalid={Boolean(errors.firstName)}
            aria-describedby={errors.firstName ? id("first-name-error") : undefined}
            className={input}
          />
          <ErrorText id={id("first-name-error")}>{errors.firstName}</ErrorText>
        </Field>

        <Field label="Last name" htmlFor={id("last-name")} required>
          <input
            id={id("last-name")}
            autoComplete="family-name"
            value={values.lastName}
            onChange={(event) => change("lastName", event.target.value)}
            aria-invalid={Boolean(errors.lastName)}
            aria-describedby={errors.lastName ? id("last-name-error") : undefined}
            className={input}
          />
          <ErrorText id={id("last-name-error")}>{errors.lastName}</ErrorText>
        </Field>

        <Field label="Phone number" htmlFor={id("phone")} required>
          <div className="flex">
            <select
              value={values.phoneCode}
              onChange={(event) => change("phoneCode", event.target.value)}
              aria-label="Country code"
              className={`${inputClass} w-[92px] shrink-0 cursor-pointer rounded-r-none border-r-0 px-2.5`}
            >
              {phoneCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <input
              id={id("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              value={values.phone}
              onChange={(event) => change("phone", event.target.value)}
              placeholder="801 234 5678"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? id("phone-error") : undefined}
              className={`${input} rounded-l-none`}
            />
          </div>
          <ErrorText id={id("phone-error")}>{errors.phone}</ErrorText>
        </Field>

        <Field label="Email" htmlFor={id("email")}>
          <input
            id={id("email")}
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => change("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? id("email-error") : undefined}
            className={input}
          />
          <ErrorText id={id("email-error")}>{errors.email}</ErrorText>
        </Field>

        <div className="sm:col-span-2">
          <Field label="Company" htmlFor={id("company")}>
            <input id={id("company")} autoComplete="organization" value={values.company} onChange={(event) => change("company", event.target.value)} className={input} />
          </Field>
        </div>
      </div>

      {formError && (
        <p role="alert" className="rounded-lg border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-600 dark:text-red-300">
          {formError}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
