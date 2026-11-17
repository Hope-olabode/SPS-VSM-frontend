"use client";

import { useEffect, useMemo, useState } from "react";
import { useLock } from "@/src/hooks/useLock";
import { PageLoader } from "@/src/components/ui/page-loader";
import { useCurrentUser } from "@/src/components/dashboard/current-user-provider";
import { useUsers } from "@/src/components/dashboard/users-provider";
import { SearchIcon, UploadIcon, UserPlusIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { errorMessage } from "@/src/lib/api";
import { isAdminRole, type User, type UserInput } from "@/src/lib/mock-users";
import { UserForm } from "./user-form";
import { type Credentials, TempPasswordBanner } from "./temp-password-banner";
import { UserTable } from "./user-table";

export function UsersPage() {
  const { user: currentUser } = useCurrentUser();
  // The list lives in UsersProvider (GET /api/users) so the Control Panel and Locations pages show the same people.
  const { users, loading, error, reload, addUser, updateUser, removeUser, resetPassword } = useUsers();
  const canManage = isAdminRole(currentUser.role);
  /** null = form closed, "new" = inviting, otherwise the id of the user being edited */
  const [formFor, setFormFor] = useState<null | "new" | string>(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  /** The one-time password the API just made, shown until the admin clicks Done */
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  // toast messages disappear by themselves
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return users;
    return users.filter((user) => [user.name, user.email, user.role].join(" ").toLowerCase().includes(text));
  }, [users, query]);

  const editing = formFor && formFor !== "new" ? users.find((user) => user.id === formFor) : undefined;

  /** Returns an error message for the form, or null when saved */
  async function save(values: UserInput): Promise<string | null> {
    try {
      if (editing) {
        await updateUser(editing.id, values);
        setNotice(`${values.name} was updated`);
      } else {
        const { user, temporaryPassword } = await addUser(values);
        setQuery("");
        setCredentials({ name: user.name, email: user.email, password: temporaryPassword, kind: "created" });
      }
      setFormFor(null);
      return null;
    } catch (err) {
      return errorMessage(err);
    }
  }

  // no email is sent yet, so "reset" and "resend invite" both make a new one-time password for the admin to pass on
  const { run } = useLock();

  function issuePassword(user: User) {
    return run(async () => {
      try {
        const password = await resetPassword(user.id);
        setCredentials({ name: user.name, email: user.email, password, kind: "reset" });
      } catch (err) {
        setNotice(errorMessage(err));
      }
    });
  }

  function remove(user: User) {
    return run(async () => {
      try {
        await removeUser(user.id);
        setNotice(`${user.name} was removed`);
      } catch (err) {
        setNotice(errorMessage(err));
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-[7px] text-[21px] font-bold leading-tight tracking-[-0.035em] sm:text-[25px]">User Management</h1>
          <p className="text-xs text-soft">Manage team members, roles, and location assignments</p>
        </div>

        {canManage && (
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="secondary" onClick={() => setNotice("Bulk import isn't connected yet")}>
            <UploadIcon size={15} />
            Bulk Import
          </Button>
          <Button onClick={() => setFormFor(formFor === "new" ? null : "new")} aria-expanded={formFor === "new"}>
            <UserPlusIcon size={15} />
            {formFor === "new" ? "Cancel" : "Add User"}
          </Button>
        </div>
        )}
      </div>

      {credentials && <TempPasswordBanner credentials={credentials} onDismiss={() => setCredentials(null)} />}

      {canManage && formFor && (
        <UserForm
          // a new key resets the form when switching between users
          key={formFor}
          initial={editing && { name: editing.name, email: editing.email, role: editing.role, branch: editing.branch }}
          takenEmails={users.filter((user) => user.id !== editing?.id).map((user) => user.email)}
          onSave={save}
          onCancel={() => setFormFor(null)}
        />
      )}

      <section className="space-y-3.5" aria-label="Users">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-full max-w-sm">
            <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users by name, email, or role..."
              aria-label="Search users"
              className="w-full rounded-lg border border-line-strong bg-surface py-2 pl-9 pr-3 text-xs text-fg shadow-sm transition placeholder:text-muted focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20"
            />
          </div>
          <span className="text-xs font-medium text-muted">
            {visible.length} {visible.length === 1 ? "user" : "users"}
          </span>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-5 py-4 text-center text-xs text-red-600 dark:text-red-300">
            <p className="mb-2">{error}</p>
            <button type="button" onClick={() => void reload()} className="font-semibold text-brand hover:text-brand-hover">
              Try again
            </button>
          </div>
        )}

        {loading && users.length === 0 && (
          <PageLoader label="Loading users…" />
        )}

        <div className="overflow-hidden rounded-xl border border-line bg-surface [box-shadow:var(--shadow)]" hidden={loading && users.length === 0}>
          <UserTable
            rows={visible}
            totalUsers={users.length}
            readOnly={!canManage}
            selfId={users.find((user) => user.email.toLowerCase() === currentUser.email.toLowerCase())?.id}
            onEdit={(user) => setFormFor(user.id)}
            onResetPassword={issuePassword}
            onResendInvite={issuePassword}
            onDelete={remove}
          />
        </div>
      </section>

      <p
        role="status"
        aria-live="polite"
        className={notice ? "fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-fg px-4 py-2.5 text-xs font-medium text-surface shadow-lg" : "sr-only"}
      >
        {notice}
      </p>
    </div>
  );
}
