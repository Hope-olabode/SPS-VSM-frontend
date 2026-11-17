"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { api, errorMessage, type ApiVisit, type ApiVisitList } from "@/src/lib/api";
import { useCurrentUser } from "@/src/components/dashboard/current-user-provider";
import { SignOutDialog } from "@/src/components/visitors/sign-out-dialog";
import type { Visitor, VisitorStatus, VisitorType } from "@/src/lib/mock-visitors";

type Decision = "approve" | "decline";

type VisitorsContextValue = {
  visitors: Visitor[];
  loading: boolean;
  /** Last load/save problem, shown by pages that care. Cleared on the next successful load. */
  error: string;
  /** Reloads the list from the API (e.g. after a check-in). Resolves true when the reload worked. */
  refresh: () => Promise<boolean>;
  resolveClearance: (id: string, decision: Decision) => Promise<void>;
  /** Staff let a waiting kiosk visitor in, or turn them away (POST /api/visitors/:id/approve or /decline) */
  resolveApproval: (id: string, decision: Decision) => Promise<boolean>;
  /** Opens the sign-out window: the visitor signs, and only then is POST /api/visitors/:id/check-out sent */
  signOut: (id: string) => void;
  /** Checks out everyone still in the building (POST /api/visitors/check-out-all). Resolves with how many the server checked out, or null when it failed (see `error`). */
  evacuateAll: () => Promise<number | null>;
};

const VisitorsContext = createContext<VisitorsContextValue | null>(null);

/** Enough for a busy day at one location; the API caps this at 500 */
const PAGE_SIZE = 500;

const STATUS: Record<ApiVisit["status"], VisitorStatus> = {
  PENDING_APPROVAL: "pending_approval",
  ONSITE: "onsite",
  PENDING_CLEARANCE: "pending_clearance",
  LEFT: "left",
  DECLINED: "declined",
};

function stamp(value: string | Date) {
  const d = new Date(value);
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  };
}

/** 17m, 2h 15m */
function duration(from: string, to: string | null) {
  const minutes = Math.max(0, Math.round(((to ? new Date(to) : new Date()).getTime() - new Date(from).getTime()) / 60000));
  const h = Math.floor(minutes / 60);
  return h ? `${h}h ${minutes % 60}m` : `${minutes}m`;
}

function toVisitor(v: ApiVisit, location: string): Visitor {
  const clearanceAt = v.clearanceRequestedAt ? stamp(v.clearanceRequestedAt) : null;
  return {
    id: v.id,
    name: v.name,
    phone: v.phone,
    type: v.type as VisitorType,
    company: v.company,
    residentCompany: v.residentCompany,
    floor: v.floor,
    host: v.host,
    location,
    status: STATUS[v.status],
    checkIn: stamp(v.checkInAt),
    checkOut: v.checkOutAt ? stamp(v.checkOutAt) : undefined,
    duration: duration(v.checkInAt, v.checkOutAt),
    overstay: v.overstay,
    autoCheckedOut: v.autoCheckedOut,
    clearance:
      v.status === "PENDING_CLEARANCE"
        ? { requestedAt: clearanceAt ? `${clearanceAt.date} ${clearanceAt.time}` : "", location }
        : undefined,
  };
}

/**
 * Lives in app/dashboard/layout.tsx so every dashboard page shares one visitor list.
 * The list comes from GET /api/visitors for the signed-in user's location.
 */
export function VisitorsProvider({ children }: { children: ReactNode }) {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user: currentUser } = useCurrentUser();

  const refresh = useCallback(
    () =>
      api<ApiVisitList>(`/visitors?pageSize=${PAGE_SIZE}`)
        .then((data) => {
          setVisitors(data.items.map((item) => toVisitor(item, currentUser.org)));
          setError("");
          return true;
        })
        .catch((err: Error) => {
          setError(err.message);
          return false;
        })
        .finally(() => setLoading(false)),
    [currentUser.org],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** the visit whose sign-out window is open (the visitor has not signed yet) */
  const [signingOut, setSigningOut] = useState<string | null>(null);

  const update = (id: string, change: (visitor: Visitor) => Visitor) =>
    setVisitors((current) => current.map((visitor) => (visitor.id === id ? change(visitor) : visitor)));

  /**
   * POST /api/visitors/:id/check-out with the visitor's signature, then show it as left.
   * Resolves with an error message when it failed (the sign-out window shows it), or null when it worked.
   * On failure the list is reloaded so the screen matches the server.
   */
  async function checkOut(id: string, signature: string) {
    try {
      await api(`/visitors/${encodeURIComponent(id)}/check-out`, { method: "POST", body: { signature } });
      const now = new Date();
      update(id, (visitor) => ({ ...visitor, status: "left", clearance: undefined, checkOut: stamp(now) }));
      return null;
    } catch (err) {
      const message = errorMessage(err, "Couldn't sign the visitor out. Please try again.");
      await refresh();
      return message;
    }
  }

  /**
   * Answer a kiosk check-out that is waiting for clearance (POST /api/visitors/:id/approve-clearance or /decline-clearance).
   * The API writes the audit event itself. If someone else already answered, it says so (409) and we reload.
   */
  async function resolveClearance(id: string, decision: Decision) {
    try {
      await api(`/visitors/${encodeURIComponent(id)}/${decision}-clearance`, { method: "POST" });
      update(id, (visitor) =>
        decision === "approve" ? { ...visitor, status: "left", clearance: undefined, checkOut: stamp(new Date()) } : { ...visitor, status: "onsite", clearance: undefined },
      );
    } catch (err) {
      setError((err as Error).message);
      await refresh();
    }
  }

  /**
   * Let a waiting visitor in, or turn them away. The API writes the audit event itself (VISITOR_APPROVED / VISITOR_DECLINED).
   * If someone else already decided, the API says so (409) and we reload so this screen shows the real status.
   */
  async function resolveApproval(id: string, decision: Decision) {
    try {
      await api(`/visitors/${encodeURIComponent(id)}/${decision}`, { method: "POST" });
      update(id, (visitor) => ({ ...visitor, status: decision === "approve" ? "onsite" : "declined" }));
      return true;
    } catch (err) {
      setError((err as Error).message);
      await refresh();
      return false;
    }
  }

  function signOut(id: string) {
    // the API writes the VISITOR_SIGN_OUT audit event itself, once the signature is sent
    setSigningOut(id);
  }

  /**
   * One request checks out everyone at this location, and the API writes the EMERGENCY_EVACUATION audit event itself.
   * Afterwards we reload, so the screen shows what the server did (including anyone who arrived while the button was pressed).
   */
  async function evacuateAll() {
    try {
      const { count } = await api<{ ok: true; count: number }>("/visitors/check-out-all", { method: "POST" });
      await refresh();
      return count;
    } catch (err) {
      setError((err as Error).message);
      await refresh();
      return null;
    }
  }

  return (
    <VisitorsContext.Provider value={{ visitors, loading, error, refresh, resolveClearance, resolveApproval, signOut, evacuateAll }}>
      {children}
      {signingOut && (
        <SignOutDialog
          visitorName={visitors.find((visitor) => visitor.id === signingOut)?.name ?? "Visitor"}
          onClose={() => setSigningOut(null)}
          onConfirm={async (signature) => {
            const problem = await checkOut(signingOut, signature);
            if (!problem) setSigningOut(null);
            return problem;
          }}
        />
      )}
    </VisitorsContext.Provider>
  );
}

export function useVisitors() {
  const context = useContext(VisitorsContext);
  if (!context) throw new Error("useVisitors must be used inside <VisitorsProvider>");
  return context;
}
