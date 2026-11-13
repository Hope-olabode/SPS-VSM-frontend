"use client";

import { useState } from "react";
import { MailIcon, ShieldAlertIcon, TrashIcon } from "@/src/components/icons";
import type { WatchlistEntry } from "@/src/lib/mock-watchlist";
import { SeverityBadge } from "./severity-badge";

type WatchlistCardProps = { entry: WatchlistEntry; onDelete: (id: string) => void };

export function WatchlistCard({ entry, onDelete }: WatchlistCardProps) {
  // Remove asks for a second click before anything is deleted
  const [confirming, setConfirming] = useState(false);
  const name = `${entry.firstName} ${entry.lastName}`;
  const phone = entry.phone ? `${entry.phoneCode} ${entry.phone}` : "";
  const details = [entry.company, phone].filter(Boolean);

  return (
    <article className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-line bg-surface p-4 transition hover:border-line-strong [box-shadow:var(--shadow)]">
      <div className="flex min-w-0 flex-1 items-start gap-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          <ShieldAlertIcon size={18} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[13px] font-semibold">{name}</h3>
            <SeverityBadge severity={entry.severity} />
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-soft">
            {entry.email && (
              <span className="flex items-center gap-1">
                <MailIcon size={12} className="text-muted" />
                {entry.email}
              </span>
            )}
            {details.map((detail) => (
              <span key={detail}>{detail}</span>
            ))}
            <span className="text-muted">Added {entry.addedOn}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-soft">{entry.reason}</p>
        </div>
      </div>

      {confirming ? (
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-soft">Remove?</span>
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white transition hover:bg-red-700"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded border border-line-strong px-2 py-0.5 text-[11px] font-medium text-soft transition hover:bg-surface-soft"
          >
            No
          </button>
        </div>
      ) : (
        <button
          type="button"
          title="Remove entry"
          aria-label={`Remove ${name} from watchlist`}
          onClick={() => setConfirming(true)}
          className="rounded p-1.5 text-red-500 transition hover:bg-red-500/10 hover:text-red-600"
        >
          <TrashIcon size={16} />
        </button>
      )}
    </article>
  );
}
