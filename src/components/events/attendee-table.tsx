"use client";

import { useState } from "react";
import type { ApiEventRegistration } from "@/src/lib/api";
import { CheckIcon, CloseIcon, TrashIcon } from "../icons";
import { RegistrationStatusBadge } from "./registration-status-badge";

const th = "px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted";

const registeredOn = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

type AttendeeTableProps = {
  rows: ApiEventRegistration[];
  /** The registration an action is running for, so its buttons can wait */
  busyId: string | null;
  onApprove: (registration: ApiEventRegistration) => void;
  onDecline: (registration: ApiEventRegistration) => void;
  onRemove: (registration: ApiEventRegistration) => void;
};

export function AttendeeTable({ rows, busyId, onApprove, onDecline, onRemove }: AttendeeTableProps) {
  // Remove asks for a second click before anything is deleted
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-line bg-surface-soft">
            <th scope="col" className={`${th} pl-6`}>Attendee</th>
            <th scope="col" className={th}>Phone</th>
            <th scope="col" className={th}>Company</th>
            <th scope="col" className={th}>Status</th>
            <th scope="col" className={th}>Registered</th>
            <th scope="col" className={`${th} pr-6 text-right`}>Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-line">
          {rows.map((row) => {
            const busy = busyId === row.id;
            return (
              <tr key={row.id} className="transition-colors hover:bg-surface-soft">
                <td className="py-3.5 pl-6 pr-4">
                  <div className="font-semibold">{row.name}</div>
                  {row.email && <div className="mt-0.5 text-[11px] text-soft">{row.email}</div>}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-soft">{row.phone}</td>
                <td className="px-4 py-3.5 text-soft">{row.company || "None given"}</td>
                <td className="px-4 py-3.5">
                  <RegistrationStatusBadge status={row.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-soft">{registeredOn(row.registeredAt)}</td>
                <td className="py-3.5 pl-4 pr-6">
                  <div className="flex items-center justify-end gap-1.5">
                    {row.status === "PENDING" ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onApprove(row)}
                          aria-label={`Approve ${row.name}`}
                          className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand transition hover:bg-brand/20 disabled:cursor-wait disabled:opacity-50"
                        >
                          <CheckIcon size={13} /> Approve
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onDecline(row)}
                          aria-label={`Decline ${row.name}`}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold text-red-600 transition hover:bg-red-500/10 disabled:cursor-wait disabled:opacity-50 dark:text-red-400"
                        >
                          <CloseIcon size={13} /> Decline
                        </button>
                      </>
                    ) : confirmingId === row.id ? (
                      <>
                        <span className="text-[11px] text-soft">Remove?</span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setConfirmingId(null);
                            onRemove(row);
                          }}
                          className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white transition hover:bg-red-700"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          className="rounded border border-line-strong px-2 py-0.5 text-[11px] font-medium text-soft transition hover:bg-surface-soft"
                        >
                          No
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        title="Remove from event"
                        aria-label={`Remove ${row.name}`}
                        disabled={busy}
                        onClick={() => setConfirmingId(row.id)}
                        className="rounded p-1.5 text-red-500 transition hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
                      >
                        <TrashIcon size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
