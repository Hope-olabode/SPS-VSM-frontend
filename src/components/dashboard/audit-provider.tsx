"use client";

import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from "react";
import { useCurrentUser } from "@/src/components/dashboard/current-user-provider";
import { api, ApiError, type ApiAuditEvent, type ApiAuditList } from "@/src/lib/api";
import { type AuditAction, type AuditActor, type AuditCategory, type AuditEvent, fromApiEvent, nowStamp, type Segment, stampKey } from "@/src/lib/audit";

/**
 * Actions the browser reports to the API (POST /api/audit). The API decides who did it and what the sentence says.
 * Everything else the API records itself (check-in, sign-out, watchlist, login), or is not connected yet and stays local.
 */
const SERVER_RECORDED: AuditAction[] = ["REPORTS_VIEW", "PII_UNLOCKED", "EMERGENCY_ACTIVATED", "EMERGENCY_DEACTIVATED"];

type RecordInput = {
  action: AuditAction;
  category: AuditCategory;
  /** Used for local-only events. For server-recorded actions the API writes the sentence. */
  message: Segment[];
  /** Details the API needs for the sentence: the report name */
  meta?: { type?: string };
  /** Defaults to the signed-in user */
  actor?: AuditActor;
  location?: string;
};

type AuditContextValue = {
  events: AuditEvent[];
  loading: boolean;
  error: string;
  /** GET /api/audit. The Audit Trail page calls this when it opens (admins only). */
  reload: () => Promise<void>;
  record: (input: RecordInput) => void;
};

const AuditContext = createContext<AuditContextValue | null>(null);

/**
 * Lives in app/dashboard/layout.tsx so any page can write to the audit trail and the Audit Trail page
 * always shows the same list.
 */
export function AuditProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const counter = useRef(0);
  const { user: currentUser } = useCurrentUser();

  const reload = useCallback(() => {
    setLoading(true);
    return api<ApiAuditList>("/audit")
      .then((data) => {
        // keep the browser-only events (features not connected to the API yet) under the real ones
        setEvents((current) => [...data.items.map(fromApiEvent), ...current.filter((event) => event.local)]);
        setError("");
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load the audit trail."))
      .finally(() => setLoading(false));
  }, []);

  const record = useCallback(
    ({ actor, meta, ...input }: RecordInput) => {
      if (SERVER_RECORDED.includes(input.action)) {
        api<{ event: ApiAuditEvent }>("/audit", { method: "POST", body: { action: input.action, meta } })
          .then(({ event }) => setEvents((current) => [fromApiEvent(event), ...current]))
          .catch((err) => console.error("Couldn't record audit event", err));
        return;
      }

      const { date, time } = nowStamp();
      const event: AuditEvent = {
        ...input,
        actor: actor ?? { name: currentUser.name, role: currentUser.role },
        id: `ae-local-${Date.now()}-${counter.current++}`,
        seq: Date.now(),
        date,
        time,
        at: stampKey(date, time),
        local: true,
      };
      setEvents((current) => [event, ...current]);
    },
    [currentUser.name, currentUser.role],
  );

  return <AuditContext.Provider value={{ events, loading, error, reload, record }}>{children}</AuditContext.Provider>;
}

export function useAudit() {
  const context = useContext(AuditContext);
  if (!context) throw new Error("useAudit must be used inside <AuditProvider>");
  return context;
}
