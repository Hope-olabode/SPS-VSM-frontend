"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { api, ApiError, type ApiUser, LOGIN_PATH, toUiRole } from "@/src/lib/api";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  /** The name of the location they are working in now (shown where the mock used the organisation name) */
  org: string;
  /** The location they are working in now: their own, unless a global admin picked another in the top bar */
  locationId: string;
  /** The location the user belongs to */
  homeLocationId: string;
  /** UI spelling, e.g. "GLOBAL ADMIN" */
  role: string;
};
export type ProfileValues = Pick<SessionUser, "name" | "email">;

type CurrentUserContextValue = {
  user: SessionUser;
  /** PATCH /api/auth/me. Rejects with the server's message (and per-field issues) when it says no. */
  updateProfile: (values: ProfileValues) => Promise<void>;
  signOut: () => Promise<void>;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

const toSessionUser = (u: ApiUser): SessionUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  org: u.locationName,
  locationId: u.locationId,
  homeLocationId: u.homeLocationId,
  role: toUiRole(u.role),
});

/**
 * Lives in app/dashboard/layout.tsx so the top bar, the audit trail and Account Settings all see the
 * same signed-in user. Loads the user from the API (GET /api/auth/me) before showing the dashboard.
 */
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      api<{ user: ApiUser }>("/auth/me")
        .then(({ user }) => {
          setUser(toSessionUser(user));
          setError("");
        })
        .catch((err) => {
          // a 401 already sent the browser to the login page
          if (!(err instanceof ApiError && err.status === 401)) setError(err.message);
        }),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const updateProfile = useCallback(async (values: ProfileValues) => {
    const data = await api<{ user: ApiUser }>("/auth/me", { method: "PATCH", body: values });
    setUser(toSessionUser(data.user));
  }, []);

  const signOut = useCallback(async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    window.location.assign(LOGIN_PATH);
  }, []);

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center text-sm text-soft">
        {error ? (
          <div role="alert">
            <p className="mb-3">{error}</p>
            <button type="button" onClick={load} className="font-semibold text-brand hover:text-brand-hover">
              Try again
            </button>
          </div>
        ) : (
          <p role="status">Loading your dashboard…</p>
        )}
      </div>
    );
  }

  return <CurrentUserContext.Provider value={{ user, updateProfile, signOut }}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (!context) throw new Error("useCurrentUser must be used inside <CurrentUserProvider>");
  return context;
}
