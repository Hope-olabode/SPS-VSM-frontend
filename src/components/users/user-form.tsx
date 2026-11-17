"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { UserPlusIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { Field, inputClass } from "@/src/components/ui/field";
import { useCurrentUser } from "@/src/components/dashboard/current-user-provider";
import { useLocations } from "@/src/components/dashboard/locations-provider";
import { assignableRoles, DEFAULT_ROLE, type UserInput, type UserRole } from "@/src/lib/mock-users";

type Errors = Partial<Record<"name" | "email", string>>;

const input = `${inputClass} aria-invalid:border-red-500`;

const ErrorText = ({ id, children }: { id: string; children?: ReactNode }) =>
  children ? (
    <p id={id} role="alert" className="mt-1.5 text-xs text-red-500">
      {children}
    </p>
  ) : null;

type UserFormProps = {
  /** Set when editing an existing user; the form is an invite form otherwise */
  initial?: UserInput;
  /** Emails already in use by other users */
  takenEmails: string[];
  /** Resolves to an error message to show in the form, or null when it was saved */
  onSave: (values: UserInput) => Promise<string | null>;
  onCancel: () => void;
};

export function UserForm({ initial, takenEmails, onSave, onCancel }: UserFormProps) {
  const editing = Boolean(initial);
  const { user } = useCurrentUser();
  const { names } = useLocations();
  // keep the user's current location in the list even if it has since been switched off
  const branches = initial && !names.includes(initial.branch) ? [initial.branch, ...names] : names;
  // a role the signed-in person can't hand out is still shown when editing someone who already has it
  const roles = initial && !assignableRoles(user.role).includes(initial.role) ? [initial.role, ...assignableRoles(user.role)] : assignableRoles(user.role);
  const [values, setValues] = useState<UserInput>(initial ?? { name: "", email: "", role: DEFAULT_ROLE, branch: branches[0] });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function change<K extends keyof UserInput>(key: K, value: UserInput[K]) {
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
    const email = values.email.trim();
    const found: Errors = {};
    if (!values.name.trim()) found.name = "Enter the user's name";
    if (!email) found.email = "Enter an email address";
    else if (!/^\S+@\S+\.\S+$/.test(email)) found.email = "Enter a valid email address";
    else if (takenEmails.some((taken) => taken.toLowerCase() === email.toLowerCase())) found.email = "A user with this email already exists";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setFormError("");
    const problem = await onSave({ ...values, name: values.name.trim(), email });
    // on success the page closes this form; on failure keep what was typed and say why
    if (problem) {
      setFormError(problem);
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-5 [box-shadow:var(--shadow)] sm:p-6" aria-label={editing ? "Edit user" : "Create user"}>
      <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold">
        <UserPlusIcon size={16} className="text-brand" />
        {editing ? "Edit User" : "Create User"}
      </h2>

      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Full Name" htmlFor="user-name" required>
            <input
              id="user-name"
              autoFocus
              value={values.name}
              onChange={(event) => change("name", event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "user-name-error" : undefined}
              className={input}
            />
            <ErrorText id="user-name-error">{errors.name}</ErrorText>
          </Field>

          <Field label="Email" htmlFor="user-email" required>
            <input
              id="user-email"
              type="email"
              value={values.email}
              onChange={(event) => change("email", event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "user-email-error" : undefined}
              className={input}
            />
            <ErrorText id="user-email-error">{errors.email}</ErrorText>
          </Field>

          <Field label="Role" htmlFor="user-role">
            <select id="user-role" value={values.role} onChange={(event) => change("role", event.target.value as UserRole)} className={`${inputClass} px-3`}>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Location" htmlFor="user-branch">
            <select id="user-branch" value={values.branch} onChange={(event) => change("branch", event.target.value)} className={`${inputClass} px-3`}>
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </Field>
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
            {submitting ? "Saving…" : editing ? "Save Changes" : "Create User"}
          </Button>
        </div>
      </form>
    </section>
  );
}
