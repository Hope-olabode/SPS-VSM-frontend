"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { useCurrentUser } from "@/src/components/dashboard/current-user-provider";
import { useLocations } from "@/src/components/dashboard/locations-provider";
import { useUsers } from "@/src/components/dashboard/users-provider";
import { VisitorAvatar } from "@/src/components/dashboard/visitor-avatar";
import { LockIcon, UserPlusIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { Field, inputClass } from "@/src/components/ui/field";
import { errorMessage } from "@/src/lib/api";
import { type Credentials, TempPasswordBanner } from "@/src/components/users/temp-password-banner";
import { assignableRoles, DEFAULT_ROLE, isAdminRole, type UserInput, type UserRole } from "@/src/lib/mock-users";

type Errors = Partial<Record<"name" | "email", string>>;

const input = `${inputClass} aria-invalid:border-red-500`;
const compactSelect = `${inputClass} h-9 px-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-60`;
const th = "px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted";

const ErrorText = ({ id, children }: { id: string; children?: ReactNode }) =>
  children ? (
    <p id={id} role="alert" className="mt-1.5 text-xs text-red-500">
      {children}
    </p>
  ) : null;

/**
 * Where an admin creates users and gives them a role. Everyone is a USER until an admin changes it.
 * Every change is an API call (POST and PATCH /api/users); the server checks the caller's role too.
 */
export function UsersRolesSection({ onNotice }: { onNotice: (message: string) => void }) {
  const { user: me } = useCurrentUser();
  const { locations, names } = useLocations();
  const { users, addUser, updateUser, setRole } = useUsers();
  const canManage = isAdminRole(me.role);
  const roles = assignableRoles(me.role);

  const [values, setValues] = useState<UserInput>({ name: "", email: "", role: DEFAULT_ROLE, branch: names[0] });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [tabId, setTabId] = useState(locations[0].id);

  const location = locations.find((item) => item.id === tabId) ?? locations[0];
  const rows = users.filter((user) => user.branch === location.name);

  function change<K extends keyof UserInput>(key: K, value: UserInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = values.name.trim();
    const email = values.email.trim();
    const found: Errors = {};
    if (!name) found.name = "Enter the user's name";
    if (!email) found.email = "Enter an email address";
    else if (!/^\S+@\S+\.\S+$/.test(email)) found.email = "Enter a valid email address";
    else if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) found.email = "A user with this email already exists";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    setFormError("");
    try {
      const { user, temporaryPassword } = await addUser({ ...values, name, email });
      // show the new person straight away in their location's table
      const target = locations.find((item) => item.name === values.branch);
      if (target) setTabId(target.id);
      setValues({ name: "", email: "", role: DEFAULT_ROLE, branch: values.branch });
      setCredentials({ name: user.name, email: user.email, password: temporaryPassword, kind: "created" });
      onNotice(`${name} was created as ${values.role}`);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function changeRole(id: string, name: string, role: UserRole) {
    try {
      await setRole(id, role);
      onNotice(`${name} is now ${role}`);
    } catch (err) {
      onNotice(errorMessage(err));
    }
  }

  async function moveTo(id: string, name: string, branch: string) {
    try {
      await updateUser(id, { branch });
      onNotice(`${name} moved to ${branch}`);
    } catch (err) {
      onNotice(errorMessage(err));
    }
  }

  return (
    <section className="rounded-xl border border-line bg-surface [box-shadow:var(--shadow)]" aria-label="Users and roles">
      <header className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          <UserPlusIcon size={18} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Users & roles</h2>
          <p className="text-xs text-soft">Create users and decide what each person can do. New users start as {DEFAULT_ROLE}.</p>
        </div>
      </header>

      {!canManage ? (
        <p className="flex items-center gap-2 px-5 py-8 text-xs text-soft">
          <LockIcon size={15} className="text-muted" />
          Only admins can create users or change roles.
        </p>
      ) : (
        <>
          <form onSubmit={create} noValidate className="grid grid-cols-1 gap-4 border-b border-line px-5 py-5 sm:grid-cols-2 xl:grid-cols-[1.2fr_1.4fr_1fr_1fr_auto] xl:items-start">
            <Field label="Full Name" htmlFor="cp-user-name" required>
              <input
                id="cp-user-name"
                value={values.name}
                onChange={(event) => change("name", event.target.value)}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "cp-user-name-error" : undefined}
                className={input}
              />
              <ErrorText id="cp-user-name-error">{errors.name}</ErrorText>
            </Field>

            <Field label="Email" htmlFor="cp-user-email" required>
              <input
                id="cp-user-email"
                type="email"
                value={values.email}
                onChange={(event) => change("email", event.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "cp-user-email-error" : undefined}
                className={input}
              />
              <ErrorText id="cp-user-email-error">{errors.email}</ErrorText>
            </Field>

            <Field label="Role" htmlFor="cp-user-role">
              <select id="cp-user-role" value={values.role} onChange={(event) => change("role", event.target.value as UserRole)} className={`${inputClass} px-3`}>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Location" htmlFor="cp-user-branch">
              <select id="cp-user-branch" value={values.branch} onChange={(event) => change("branch", event.target.value)} className={`${inputClass} px-3`}>
                {names.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="sm:col-span-2 xl:col-span-1 xl:pt-[29px]">
              <Button type="submit" className="w-full xl:w-auto" disabled={saving}>
                <UserPlusIcon size={15} />
                {saving ? "Creating…" : "Create User"}
              </Button>
            </div>
          </form>

          {formError && (
            <p role="alert" className="border-b border-line px-5 py-3 text-xs text-red-500">
              {formError}
            </p>
          )}

          {credentials && (
            <div className="border-b border-line p-4 sm:p-5">
              <TempPasswordBanner credentials={credentials} onDismiss={() => setCredentials(null)} />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 pt-3">
            <div role="tablist" aria-label="Users by location" className="flex flex-wrap gap-5">
              {locations.map((item) => {
                const count = users.filter((user) => user.branch === item.name).length;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={item.id === location.id}
                    onClick={() => setTabId(item.id)}
                    className={`-mb-px flex items-center gap-2 border-b-2 pb-3 text-[13px] transition ${
                      item.id === location.id ? "border-brand font-semibold text-brand" : "border-transparent font-medium text-soft hover:text-fg"
                    }`}
                  >
                    {item.name}
                    <span className="rounded-full bg-slate-500/10 px-1.5 text-[10px] font-semibold text-soft">{count}</span>
                  </button>
                );
              })}
            </div>
            <p className="mb-3 text-[11px] text-muted">Each location has its own list.</p>
          </div>

          <div className="max-h-[420px] overflow-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-line bg-surface-soft">
                  <th scope="col" className={`${th} pl-5`}>User</th>
                  <th scope="col" className={th}>Role</th>
                  <th scope="col" className={`${th} pr-5`}>Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((user) => {
                  const isMe = user.email.toLowerCase() === me.email.toLowerCase();
                  // a location admin can't change a global admin, and nobody changes their own role
                  const locked = isMe || !roles.includes(user.role);
                  const roleOptions = roles.includes(user.role) ? roles : [user.role, ...roles];
                  return (
                    <tr key={user.id} className="transition-colors hover:bg-surface-soft">
                      <td className="py-3 pl-5 pr-4">
                        <div className="flex items-center gap-3">
                          <VisitorAvatar name={user.name} size="md" />
                          <div className="min-w-0">
                            <div className="font-semibold">
                              {user.name} {isMe && <span className="ml-1 text-[10px] font-medium text-muted">(you)</span>}
                            </div>
                            <div className="max-w-[300px] truncate text-[11px] text-muted" title={user.email}>
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          aria-label={`Role for ${user.name}`}
                          title={isMe ? "You can't change your own role" : locked ? "Only a global admin can change this role" : undefined}
                          value={user.role}
                          disabled={locked}
                          onChange={(event) => changeRole(user.id, user.name, event.target.value as UserRole)}
                          className={`${compactSelect} w-[170px]`}
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 pl-4 pr-5">
                        <select
                          aria-label={`Location for ${user.name}`}
                          value={user.branch}
                          disabled={locked}
                          onChange={(event) => moveTo(user.id, user.name, event.target.value)}
                          className={`${compactSelect} w-[170px]`}
                        >
                          {(names.includes(user.branch) ? names : [user.branch, ...names]).map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-12 text-center text-muted">
                      No users are assigned to {location.name} yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
