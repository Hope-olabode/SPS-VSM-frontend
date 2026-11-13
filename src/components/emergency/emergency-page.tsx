"use client";

import { useEffect, useMemo, useState } from "react";
import { useAudit } from "@/src/components/dashboard/audit-provider";
import { useVisitors } from "@/src/components/dashboard/visitors-provider";
import { LogoutIcon, PinIcon, PrinterIcon, RotateCcwIcon, ShieldCheckIcon, WarningIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { auditMessages } from "@/src/lib/audit";
import { useCurrentUser } from "@/src/components/dashboard/current-user-provider";
import { locationOf, RosterTable } from "./roster-table";

export function EmergencyPage() {
  const { visitors, evacuateAll, refresh: reloadVisitors, error } = useVisitors();
  const { record } = useAudit();
  const { user: currentUser } = useCurrentUser();
  const [active, setActive] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [evacuating, setEvacuating] = useState(false);
  const [notice, setNotice] = useState("");

  // the "evacuated" message disappears by itself
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  // everyone physically here: onsite, waiting on a checkout clearance, or waiting at the kiosk for approval
  const onsite = useMemo(() => visitors.filter((visitor) => visitor.status !== "left" && visitor.status !== "declined"), [visitors]);

  const byLocation = useMemo(() => {
    const counts = new Map<string, number>();
    onsite.forEach((visitor) => counts.set(locationOf(visitor), (counts.get(locationOf(visitor)) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [onsite]);

  function toggleEmergency() {
    record({
      action: active ? "EMERGENCY_DEACTIVATED" : "EMERGENCY_ACTIVATED",
      category: "Security",
      message: (active ? auditMessages.emergencyDeactivated : auditMessages.emergencyActivated)(currentUser.name),
    });
    setActive((value) => !value);
  }

  async function evacuate() {
    if (evacuating) return;
    setEvacuating(true);
    setConfirming(false);
    const count = await evacuateAll();
    setEvacuating(false);
    if (count === null) setNotice("Evacuation failed. Check the roster, then try again.");
    else if (count === 0) setNotice("No one was onsite, so nothing changed");
    else setNotice(`${count} ${count === 1 ? "visitor was" : "visitors were"} checked out`);
  }

  /** Reloads the roster from the API; "Updated" only shows the time of a reload that worked */
  async function refresh() {
    setRefreshing(true);
    const ok = await reloadVisitors();
    setRefreshing(false);
    if (ok) setRefreshedAt(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
  }

  return (
    <div className="space-y-6">
      {active && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-red-300/70 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        >
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500" />
          Emergency mode is active. Use the roster below for roll-call.
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-red-300/70 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 print:hidden">
          {error} The roster below may be out of date.
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-[7px] text-[21px] font-bold leading-tight tracking-[-0.035em] sm:text-[25px]">Emergency Mode</h1>
          <p className="text-xs text-soft">
            Real-time onsite personnel roster
            {refreshedAt && <span className="text-muted"> · Updated {refreshedAt}</span>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <Button variant="secondary" onClick={() => void refresh()} disabled={refreshing}>
            <RotateCcwIcon size={15} className={refreshing ? "animate-spin" : undefined} />
            {refreshing ? "Refreshing" : "Refresh"}
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <PrinterIcon size={15} />
            Print
          </Button>
          <Button variant={active ? "secondary" : "danger"} onClick={toggleEmergency} aria-pressed={active}>
            {active ? <ShieldCheckIcon size={15} /> : <WarningIcon size={15} />}
            {active ? "Deactivate Emergency" : "Activate Emergency"}
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2" aria-label="Headcount">
        <div className="rounded-xl border border-line bg-surface p-6 text-center [box-shadow:var(--shadow)]">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted">Branch Onsite</span>
          <div className="text-4xl font-bold leading-none text-brand">{onsite.length}</div>
          <span className="mt-1 block text-xs text-muted">{onsite.length === 1 ? "person" : "people"}</span>
        </div>

        {byLocation.map(([location, count]) => (
          <div key={location} className="rounded-xl border border-line bg-surface p-6 text-center [box-shadow:var(--shadow)]">
            <span className="mb-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-soft">
              <PinIcon size={13} className="text-brand" />
              {location}
            </span>
            <div className="text-4xl font-bold leading-none">{count}</div>
            <span className="mt-1 block text-xs text-muted">{count === 1 ? "person" : "people"}</span>
          </div>
        ))}
      </section>

      <section
        aria-label="Emergency evacuation"
        className="flex flex-col justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/25 dark:bg-red-500/10 sm:flex-row sm:items-center print:hidden"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
            <ShieldCheckIcon size={20} />
          </span>
          <div>
            <h2 className="text-xs font-bold">Emergency Evacuation</h2>
            <p className="mt-0.5 text-xs text-soft">
              Mass checkout all {onsite.length} onsite {onsite.length === 1 ? "visitor" : "visitors"} at this branch. This action is audit-logged.
            </p>
          </div>
        </div>

        {confirming ? (
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs font-medium text-soft">Check out everyone?</span>
            <Button variant="danger" onClick={() => void evacuate()}>
              Yes, evacuate
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setConfirming(true)} disabled={onsite.length === 0 || evacuating} className="shrink-0 self-start sm:self-auto">
            <LogoutIcon size={15} />
            {evacuating ? "Evacuating" : "Evacuate All"}
          </Button>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-surface [box-shadow:var(--shadow)]" aria-label="Onsite roster">
        <RosterTable rows={onsite} />
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
