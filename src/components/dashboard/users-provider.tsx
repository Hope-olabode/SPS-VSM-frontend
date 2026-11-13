"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useCurrentUser } from "@/src/components/dashboard/current-user-provider";
import { api, type ApiManagedUser, toApiRole, toUiRole } from "@/src/lib/api";
import { isAdminRole, type User, type UserInput, type UserRole } from "@/src/lib/mock-users";

type UsersContextValue = {
  users: User[];
  loading: boolean;
  error: string;
  /** GET /api/users again (for example after a location was renamed) */
  reload: () => Promise<void>;
  /** POST /api/users. Returns the new person and their one-time password, which is only shown now. */
  addUser: (values: UserInput) => Promise<{ user: User; temporaryPassword: string }>;
  /** PATCH /api/users/:id. Rejects with the server's message when it says no. */
  updateUser: (id: string, values: Partial<UserInput>) => Promise<void>;
  setRole: (id: string, role: UserRole) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  /** Gives the user a new one-time password and returns it */
  resetPassword: (id: string) => Promise<string>;
  /** Keeps the signed-in user's row in step with Account Settings (still local until the Account step) */
  syncProfile: (email: string, values: { name: string; email: string }) => void;
};

const UsersContext = createContext<UsersContextValue | null>(null);

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const toUser = (u: ApiManagedUser): User => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: toUiRole(u.role) as UserRole,
  branch: u.branch,
  joined: formatDate(u.createdAt),
  lastActive: u.lastActiveAt ? formatDate(u.lastActiveAt) : null,
});

const toBody = (values: Partial<UserInput>) => ({ ...values, role: values.role ? toApiRole(values.role) : undefined });

/**
 * Lives in app/dashboard/layout.tsx so the Users page, the Control Panel and the Locations page
 * all work on one list of users. Only admins can read the list (GET /api/users), so for everyone else it stays empty.
 */
export function UsersProvider({ children }: { children: ReactNode }) {
  const { user: me } = useCurrentUser();
  const canManage = isAdminRole(me.role);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(canManage);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!canManage) return;
    try {
      const data = await api<{ items: ApiManagedUser[] }>("/users");
      setUsers(data.items.map(toUser));
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addUser = useCallback(async (values: UserInput) => {
    const data = await api<{ user: ApiManagedUser; temporaryPassword: string }>("/users", { method: "POST", body: toBody(values) });
    const user = toUser(data.user);
    setUsers((current) => [user, ...current]);
    return { user, temporaryPassword: data.temporaryPassword };
  }, []);

  const updateUser = useCallback(async (id: string, values: Partial<UserInput>) => {
    const data = await api<{ user: ApiManagedUser }>(`/users/${encodeURIComponent(id)}`, { method: "PATCH", body: toBody(values) });
    const user = toUser(data.user);
    setUsers((current) => current.map((item) => (item.id === user.id ? user : item)));
  }, []);

  const setRole = useCallback((id: string, role: UserRole) => updateUser(id, { role }), [updateUser]);

  const removeUser = useCallback(async (id: string) => {
    await api(`/users/${encodeURIComponent(id)}`, { method: "DELETE" });
    setUsers((current) => current.filter((user) => user.id !== id));
  }, []);

  const resetPassword = useCallback(async (id: string) => {
    const data = await api<{ temporaryPassword: string }>(`/users/${encodeURIComponent(id)}/reset-password`, { method: "POST" });
    return data.temporaryPassword;
  }, []);

  const syncProfile = useCallback(
    (email: string, values: { name: string; email: string }) =>
      setUsers((current) => current.map((user) => (user.email.toLowerCase() === email.toLowerCase() ? { ...user, ...values } : user))),
    [],
  );

  return (
    <UsersContext.Provider value={{ users, loading, error, reload, addUser, updateUser, setRole, removeUser, resetPassword, syncProfile }}>
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (!context) throw new Error("useUsers must be used inside <UsersProvider>");
  return context;
}
