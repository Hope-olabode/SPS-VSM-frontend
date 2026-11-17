"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { ChevronDownIcon, UserPlusIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { CompanyCombobox, useResidentCompanies } from "@/src/components/ui/company-combobox";
import { Field, inputClass } from "@/src/components/ui/field";
import { useCurrentUser } from "@/src/components/dashboard/current-user-provider";
import { isAdminRole } from "@/src/lib/mock-users";
import { type NewPreRegistration, phoneCodes, visitorTypes } from "@/src/lib/mock-preregistrations";

type Values = Omit<NewPreRegistration, "expectedTime"> & { hour: string; minute: string; period: string };
type Errors = Partial<Record<"firstName" | "lastName" | "contact" | "residentCompany" | "expectedDate" | "time", string>>;

const emptyValues: Values = {
  firstName: "",
  lastName: "",
  email: "",
  phoneCode: phoneCodes[0],
  phone: "",
  company: "",
  visitorType: visitorTypes[0],
  residentCompany: "",
  host: "",
  purpose: "",
  expectedDate: "",
  hour: "",
  minute: "",
  period: "",
};

const hours = Array.from({ length: 12 }, (_, index) => String(index + 1));
const minutes = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));

const input = `${inputClass} aria-invalid:border-red-500`;

/** Today as yyyy-mm-dd in the browser's own time zone (toISOString would use UTC). */
function today() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!values.firstName.trim()) errors.firstName = "Enter the visitor's first name";
  if (!values.lastName.trim()) errors.lastName = "Enter the visitor's last name";

  const email = values.email.trim();
  const phone = values.phone.trim();
  if (!email && !phone) errors.contact = "Enter an email or a phone number";
  else if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.contact = "Enter a valid email address";

  if (!values.residentCompany) errors.residentCompany = "Choose the resident company being visited";
  if (!values.expectedDate) errors.expectedDate = "Choose the expected date";

  // the time is optional, but a half-picked time isn't
  const picked = [values.hour, values.minute, values.period].filter(Boolean).length;
  if (picked > 0 && picked < 3) errors.time = "Pick the hour, minutes and AM/PM, or clear them all";
  return errors;
}

const ErrorText = ({ id, children }: { id: string; children?: ReactNode }) =>
  children ? (
    <p id={id} role="alert" className="mt-1.5 text-xs text-red-500">
      {children}
    </p>
  ) : null;

/** onSave resolves to an error message to show in the form, or null when the visitor was saved */
type PreRegFormProps = { onSave: (visitor: NewPreRegistration) => Promise<string | null>; onCancel: () => void };

export function PreRegForm({ onSave, onCancel }: PreRegFormProps) {
  const [values, setValues] = useState<Values>(emptyValues);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  // resident companies come from GET /api/tenants; an admin can add a missing one from the box
  const { user } = useCurrentUser();
  const { companies, state: companiesState, add: addCompany } = useResidentCompanies();

  function change<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    // clear a message as soon as the person starts fixing it
    const errorKey: keyof Errors | undefined =
      key === "email" || key === "phone"
        ? "contact"
        : key === "hour" || key === "minute" || key === "period"
          ? "time"
          : key in emptyValues
            ? (key as keyof Errors)
            : undefined;
    setErrors((current) => {
      if (!errorKey || !(errorKey in current)) return current;
      const next = { ...current };
      delete next[errorKey];
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const { hour, minute, period, ...rest } = values;
    setSubmitting(true);
    setFormError("");
    const problem = await onSave({
      firstName: rest.firstName.trim(),
      lastName: rest.lastName.trim(),
      email: rest.email.trim(),
      // no number means no country code to store either
      phoneCode: rest.phone.trim() ? rest.phoneCode : "",
      phone: rest.phone.trim(),
      company: rest.company.trim(),
      visitorType: rest.visitorType,
      residentCompany: rest.residentCompany,
      host: rest.host.trim(),
      purpose: rest.purpose.trim(),
      expectedDate: rest.expectedDate,
      expectedTime: hour && minute && period ? `${hour}:${minute} ${period}` : "",
    });
    // on success the page closes this form; on failure keep what was typed and say why
    if (problem) {
      setFormError(problem);
      setSubmitting(false);
    }
  }

  const select = `${inputClass} px-3`;

  return (
    <section className="rounded-xl border border-line bg-surface p-5 [box-shadow:var(--shadow)] sm:p-6" aria-label="New pre-registration">
      <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold">
        <UserPlusIcon size={16} className="text-brand" />
        New Pre-Registration
      </h2>

      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Visitor's First Name" htmlFor="pr-first-name" required>
            <input
              id="pr-first-name"
              autoFocus
              value={values.firstName}
              onChange={(event) => change("firstName", event.target.value)}
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={errors.firstName ? "pr-first-name-error" : undefined}
              className={input}
            />
            <ErrorText id="pr-first-name-error">{errors.firstName}</ErrorText>
          </Field>

          <Field label="Visitor's Last Name" htmlFor="pr-last-name" required>
            <input
              id="pr-last-name"
              value={values.lastName}
              onChange={(event) => change("lastName", event.target.value)}
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={errors.lastName ? "pr-last-name-error" : undefined}
              className={input}
            />
            <ErrorText id="pr-last-name-error">{errors.lastName}</ErrorText>
          </Field>

          <Field label="Visitor's Email (optional if phone provided)" htmlFor="pr-email">
            <input
              id="pr-email"
              type="email"
              value={values.email}
              onChange={(event) => change("email", event.target.value)}
              placeholder="name@company.com"
              aria-invalid={Boolean(errors.contact)}
              aria-describedby={errors.contact ? "pr-contact-error" : undefined}
              className={input}
            />
          </Field>

          <Field label="Visitor's Phone (optional if email provided)" htmlFor="pr-phone">
            <div className="flex w-full">
              {/* the real <select> sits invisibly on top, so the flag and code are just for show */}
              <div className="relative flex shrink-0 items-center gap-2 rounded-l-lg border border-r-0 border-line-strong bg-surface-soft px-3 text-sm transition focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand/20">
                <span
                  aria-hidden="true"
                  className="h-[15px] w-[23px] rounded-[2px] shadow-[0_0_0_1px_var(--line-strong)] [background:linear-gradient(90deg,#008751_0_33.333%,#fff_33.333%_66.666%,#008751_66.666%)]"
                />
                <strong className="font-semibold">{values.phoneCode}</strong>
                <ChevronDownIcon size={13} className="text-muted" />
                <select
                  value={values.phoneCode}
                  onChange={(event) => change("phoneCode", event.target.value)}
                  aria-label="Country code"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                >
                  {phoneCodes.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
              <input
                id="pr-phone"
                type="tel"
                inputMode="tel"
                value={values.phone}
                onChange={(event) => change("phone", event.target.value)}
                placeholder="801 234 5678"
                aria-invalid={Boolean(errors.contact)}
                aria-describedby={errors.contact ? "pr-contact-error" : undefined}
                className={`${input} rounded-l-none`}
              />
            </div>
          </Field>

          {/* one message for both fields, since either one satisfies it */}
          {errors.contact && (
            <div className="-mt-3 md:col-span-2">
              <ErrorText id="pr-contact-error">{errors.contact}</ErrorText>
            </div>
          )}

          <Field label="Visitor's Company" htmlFor="pr-company">
            <input id="pr-company" value={values.company} onChange={(event) => change("company", event.target.value)} className={input} />
          </Field>

          <Field label="Visitor Type" htmlFor="pr-type">
            <select id="pr-type" value={values.visitorType} onChange={(event) => change("visitorType", event.target.value)} className={select}>
              {visitorTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Resident Company" htmlFor="pr-resident" required>
            <CompanyCombobox
              id="pr-resident"
              value={values.residentCompany}
              onChange={(name) => change("residentCompany", name)}
              companies={companies}
              state={companiesState}
              onAdd={isAdminRole(user.role) ? addCompany : undefined}
              invalid={Boolean(errors.residentCompany)}
              describedBy={errors.residentCompany ? "pr-resident-error" : undefined}
            />
            <ErrorText id="pr-resident-error">{errors.residentCompany}</ErrorText>
          </Field>

          <Field label="Person Being Visited" htmlFor="pr-host">
            <input
              id="pr-host"
              value={values.host}
              onChange={(event) => change("host", event.target.value)}
              placeholder="e.g. Babatunde Balogun (or leave empty if visiting company)"
              className={input}
            />
          </Field>

          <Field label="Expected Date" htmlFor="pr-date" required>
            <input
              id="pr-date"
              type="date"
              min={today()}
              value={values.expectedDate}
              onChange={(event) => change("expectedDate", event.target.value)}
              aria-invalid={Boolean(errors.expectedDate)}
              aria-describedby={errors.expectedDate ? "pr-date-error" : undefined}
              className={input}
            />
            <ErrorText id="pr-date-error">{errors.expectedDate}</ErrorText>
          </Field>

          <Field label="Expected Time" htmlFor="pr-hour">
            <div className="grid grid-cols-[1fr_auto_1fr_1fr] items-center gap-2" role="group" aria-label="Expected time">
              <select
                id="pr-hour"
                value={values.hour}
                onChange={(event) => change("hour", event.target.value)}
                aria-label="Hour"
                aria-invalid={Boolean(errors.time)}
                aria-describedby={errors.time ? "pr-time-error" : undefined}
                className={`${select} aria-invalid:border-red-500`}
              >
                <option value="">HH</option>
                {hours.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
              <span className="font-bold text-muted" aria-hidden="true">
                :
              </span>
              <select
                value={values.minute}
                onChange={(event) => change("minute", event.target.value)}
                aria-label="Minutes"
                aria-invalid={Boolean(errors.time)}
                className={`${select} aria-invalid:border-red-500`}
              >
                <option value="">MM</option>
                {minutes.map((minute) => (
                  <option key={minute} value={minute}>
                    {minute}
                  </option>
                ))}
              </select>
              <select
                value={values.period}
                onChange={(event) => change("period", event.target.value)}
                aria-label="AM or PM"
                aria-invalid={Boolean(errors.time)}
                className={`${select} aria-invalid:border-red-500`}
              >
                <option value="">-</option>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            <ErrorText id="pr-time-error">{errors.time}</ErrorText>
          </Field>

          <div className="md:col-span-2">
            <Field label="Purpose" htmlFor="pr-purpose">
              <input
                id="pr-purpose"
                value={values.purpose}
                onChange={(event) => change("purpose", event.target.value)}
                placeholder="Meeting, Interview, Delivery..."
                className={input}
              />
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
            <UserPlusIcon size={15} />
            {submitting ? "Registering…" : "Register"}
          </Button>
        </div>
      </form>
    </section>
  );
}
