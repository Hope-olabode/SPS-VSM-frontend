"use client";

import { type FormEvent, type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { useCurrentUser } from "@/src/components/dashboard/current-user-provider";
import { useUsers } from "@/src/components/dashboard/users-provider";
import { CheckIcon, CloseIcon, EyeIcon, EyeOffIcon, LockIcon, UserIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { Field, inputClass } from "@/src/components/ui/field";
import { api, ApiError, errorMessage } from "@/src/lib/api";

export type AccountTab = "profile" | "password";

const input = `${inputClass} aria-invalid:border-red-500`;

const ErrorText = ({ id, children }: { id: string; children?: ReactNode }) =>
  children ? (
    <p id={id} role="alert" className="mt-1.5 text-xs text-red-500">
      {children}
    </p>
  ) : null;

type ModalProps = {
  tab: AccountTab;
  onTabChange: (tab: AccountTab) => void;
  onClose: () => void;
  /** Shows a short message on the page behind the modal */
  onNotice: (message: string) => void;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export function AccountSettingsModal({ tab, onTabChange, onClose, onNotice }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // lock page scroll while open, give focus to the first field, and hand focus back on close
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("input")?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  // Escape closes; Tab stays inside the dialog
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const items = [...(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter((item) => item.offsetParent !== null);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const tabs: { id: AccountTab; label: string }[] = [
    { id: "profile", label: "Profile Details" },
    { id: "password", label: "Change Password" },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className="max-h-full w-full max-w-[500px] overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-[0_24px_70px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserIcon size={20} className="text-brand" />
            <h2 id={titleId} className="text-base font-bold tracking-tight">
              Account Settings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface-soft hover:text-fg"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div role="tablist" aria-label="Account settings" className="mb-6 mt-5 flex gap-6 border-b border-line">
          {tabs.map(({ id, label }) => {
            const selected = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`account-tab-${id}`}
                aria-selected={selected}
                aria-controls={`account-panel-${id}`}
                onClick={() => onTabChange(id)}
                className={`-mb-px border-b-2 pb-3 text-[13px] transition ${
                  selected ? "border-brand font-semibold text-brand" : "border-transparent font-medium text-soft hover:text-fg"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* both panels stay mounted, so a half-typed form survives switching tabs */}
        <div role="tabpanel" id="account-panel-profile" aria-labelledby="account-tab-profile" hidden={tab !== "profile"}>
          <ProfileForm onClose={onClose} onNotice={onNotice} />
        </div>
        <div role="tabpanel" id="account-panel-password" aria-labelledby="account-tab-password" hidden={tab !== "password"}>
          <PasswordForm onClose={onClose} onNotice={onNotice} />
        </div>
      </div>
    </div>
  );
}

/* ───────── Profile details ───────── */

function ProfileForm({ onClose, onNotice }: Pick<ModalProps, "onClose" | "onNotice">) {
  const { user, updateProfile } = useCurrentUser();
  const { syncProfile } = useUsers();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [errors, setErrors] = useState<Partial<Record<"name" | "email", string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const found: typeof errors = {};
    if (!cleanName) found.name = "Enter your name";
    if (!cleanEmail) found.email = "Enter your email address";
    else if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) found.email = "Enter a valid email address";

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (cleanName === user.name && cleanEmail === user.email) {
      onClose();
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await updateProfile({ name: cleanName, email: cleanEmail });
      syncProfile(user.email, { name: cleanName, email: cleanEmail });
      onNotice("Profile updated");
      onClose();
    } catch (err) {
      // an email that is already taken shows under the email box; anything else shows above the buttons
      const emailIssue = err instanceof ApiError ? err.issues?.email?.[0] : undefined;
      if (emailIssue) setErrors({ email: emailIssue });
      else setFormError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Name" htmlFor="account-name" required>
        <input
          id="account-name"
          value={name}
          placeholder="Enter your name"
          autoComplete="name"
          onChange={(event) => {
            setName(event.target.value);
            setErrors((current) => ({ ...current, name: undefined }));
          }}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "account-name-error" : undefined}
          className={input}
        />
        <ErrorText id="account-name-error">{errors.name}</ErrorText>
      </Field>

      <Field label="Email" htmlFor="account-email" required>
        <input
          id="account-email"
          type="email"
          value={email}
          placeholder="Enter your email"
          autoComplete="email"
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors((current) => ({ ...current, email: undefined }));
          }}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "account-email-error" : undefined}
          className={input}
        />
        <ErrorText id="account-email-error">{errors.email}</ErrorText>
      </Field>

      {formError && (
        <p role="alert" className="text-xs text-red-500">
          {formError}
        </p>
      )}

      <div className="flex items-center justify-end gap-2.5 pt-3">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          <CheckIcon size={15} />
          {submitting ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

/* ───────── Change password ───────── */

type PasswordKey = "current" | "next" | "confirm";

function PasswordField({
  id,
  label,
  value,
  placeholder,
  autoComplete,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  autoComplete: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} htmlFor={id} required>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${input} pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted transition hover:text-fg"
        >
          {visible ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
        </button>
      </div>
      <ErrorText id={`${id}-error`}>{error}</ErrorText>
    </Field>
  );
}

function PasswordForm({ onClose, onNotice }: Pick<ModalProps, "onClose" | "onNotice">) {
  const [values, setValues] = useState<Record<PasswordKey, string>>({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Partial<Record<PasswordKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const change = (key: PasswordKey) => (value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: typeof errors = {};
    if (!values.current) found.current = "Enter your current password";
    if (values.next.length < 8 || !/[A-Za-z]/.test(values.next) || !/\d/.test(values.next)) found.next = "Use at least 8 characters, with 1 letter and 1 number";
    else if (values.next === values.current) found.next = "Choose a password you haven't used here";
    if (!values.confirm) found.confirm = "Re-enter your new password";
    else if (values.confirm !== values.next) found.confirm = "The two passwords don't match";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setFormError("");
    try {
      await api("/auth/change-password", { method: "POST", body: { currentPassword: values.current, newPassword: values.next } });
      setValues({ current: "", next: "", confirm: "" });
      onNotice("Password updated");
      onClose();
    } catch (err) {
      // a wrong current password shows under that box; anything else shows above the buttons
      const issues = err instanceof ApiError ? err.issues : undefined;
      if (issues?.current?.[0] || issues?.next?.[0]) setErrors({ current: issues.current?.[0], next: issues.next?.[0] });
      else setFormError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <PasswordField
        id="account-current-password"
        label="Current Password"
        placeholder="Enter current password"
        autoComplete="current-password"
        value={values.current}
        error={errors.current}
        onChange={change("current")}
      />
      <PasswordField
        id="account-new-password"
        label="New Password"
        placeholder="At least 8 chars, 1 letter, 1 number"
        autoComplete="new-password"
        value={values.next}
        error={errors.next}
        onChange={change("next")}
      />
      <PasswordField
        id="account-confirm-password"
        label="Confirm New Password"
        placeholder="Re-enter new password"
        autoComplete="new-password"
        value={values.confirm}
        error={errors.confirm}
        onChange={change("confirm")}
      />

      {formError && (
        <p role="alert" className="text-xs text-red-500">
          {formError}
        </p>
      )}

      <div className="flex items-center justify-end gap-2.5 pt-3">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          <LockIcon size={15} />
          {submitting ? "Updating…" : "Update Password"}
        </Button>
      </div>
    </form>
  );
}
