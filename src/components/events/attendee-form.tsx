"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { BuildingIcon, MailIcon, UserIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { Field, inputClass } from "@/src/components/ui/field";
import { PhoneInput } from "@/src/components/ui/phone-input";
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
/** A text box with an icon inside its left edge */
const iconInput = `${input} pl-10`;

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

/** Puts an icon inside the left edge of the box it wraps */
function WithIcon({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">{icon}</span>
      {children}
    </div>
  );
}

function Spinner() {
  return <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}

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
  // the phone box keeps its own text, so a new key is how it gets emptied for the next person
  const [phoneKey, setPhoneKey] = useState(0);

  function clearError(key: keyof Errors) {
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function change<K extends keyof AttendeeValues>(key: K, value: AttendeeValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    clearError(key as keyof Errors);
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
    if (problem) {
      setFormError(problem);
    } else {
      setValues(empty); // ready for the next person
      setPhoneKey((key) => key + 1);
    }
  }

  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {/* every field below sits on its own row, so nothing is squeezed against its neighbour */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="First name" htmlFor={id("first-name")} required>
          <WithIcon icon={<UserIcon size={16} />}>
            <input
              id={id("first-name")}
              autoComplete="given-name"
              placeholder="First name"
              value={values.firstName}
              onChange={(event) => change("firstName", event.target.value)}
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={errors.firstName ? id("first-name-error") : undefined}
              className={iconInput}
            />
          </WithIcon>
          <ErrorText id={id("first-name-error")}>{errors.firstName}</ErrorText>
        </Field>

        <Field label="Last name" htmlFor={id("last-name")} required>
          <WithIcon icon={<UserIcon size={16} />}>
            <input
              id={id("last-name")}
              autoComplete="family-name"
              placeholder="Last name"
              value={values.lastName}
              onChange={(event) => change("lastName", event.target.value)}
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={errors.lastName ? id("last-name-error") : undefined}
              className={iconInput}
            />
          </WithIcon>
          <ErrorText id={id("last-name-error")}>{errors.lastName}</ErrorText>
        </Field>
      </div>

      <Field label="Phone number" htmlFor={id("phone")} required>
        <PhoneInput
          key={phoneKey}
          id={id("phone")}
          required
          invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? id("phone-error") : undefined}
          onChange={({ phoneCode, phone }) => {
            setValues((current) => ({ ...current, phoneCode, phone }));
            clearError("phone");
          }}
        />
        <ErrorText id={id("phone-error")}>{errors.phone}</ErrorText>
      </Field>

      <Field label="Email address" htmlFor={id("email")}>
        <WithIcon icon={<MailIcon size={16} />}>
          <input
            id={id("email")}
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={values.email}
            onChange={(event) => change("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? id("email-error") : undefined}
            className={iconInput}
          />
        </WithIcon>
        <ErrorText id={id("email-error")}>{errors.email}</ErrorText>
      </Field>

      <Field label="Company / Organization" htmlFor={id("company")}>
        <WithIcon icon={<BuildingIcon size={16} />}>
          <input
            id={id("company")}
            autoComplete="organization"
            placeholder="Organization name"
            value={values.company}
            onChange={(event) => change("company", event.target.value)}
            className={iconInput}
          />
        </WithIcon>
      </Field>

      {formError && (
        <p role="alert" className="rounded-lg border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-600 dark:text-red-300">
          {formError}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 pt-1">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting} className={onCancel ? "" : "h-12 w-full text-sm"}>
          {submitting ? (
            <>
              <Spinner /> Saving…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}