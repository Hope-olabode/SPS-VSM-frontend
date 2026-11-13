"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon, CalendarIcon, PinIcon, TrashIcon, UsersIcon } from "@/src/components/icons";
import type { EventItem } from "@/src/lib/mock-events";
import { formatExpectedDate } from "@/src/lib/mock-preregistrations";

type EventCardProps = { event: EventItem; onDelete: (id: string) => void };

export function EventCard({ event, onDelete }: EventCardProps) {
  // Delete asks for a second click before anything is removed
  const [confirming, setConfirming] = useState(false);

  return (
    <article className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 transition hover:border-line-strong [box-shadow:var(--shadow)]">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          <CalendarIcon size={18} />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-semibold">
            <Link href={`/dashboard/events/${encodeURIComponent(event.id)}`} className="hover:text-brand focus-visible:text-brand">
              {event.title}
            </Link>
          </h3>
          <div className="mt-0.5 flex items-center gap-3 text-[11px] text-soft">
            <span className="flex items-center gap-1">
              <PinIcon size={12} className="text-muted" />
              {event.location}
            </span>
            <span>{formatExpectedDate(event.startDate)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5 text-xs font-semibold">
            <UsersIcon size={14} className="text-muted" />
            <span>
              {event.registered} / {event.capacity}
            </span>
          </div>
          <div className="text-[10px] text-muted">{event.pending > 0 ? `Registered, ${event.pending} awaiting approval` : "Registered"}</div>
        </div>

        {confirming ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-soft">Delete?</span>
            <button
              type="button"
              onClick={() => onDelete(event.id)}
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
            title="Delete event"
            aria-label={`Delete ${event.title}`}
            onClick={() => setConfirming(true)}
            className="rounded p-1.5 text-red-500 transition hover:bg-red-500/10 hover:text-red-600"
          >
            <TrashIcon size={16} />
          </button>
        )}

        <Link
          href={`/dashboard/events/${encodeURIComponent(event.id)}`}
          title="View details"
          aria-label={`View ${event.title}`}
          className="rounded p-1 text-muted transition hover:bg-surface-soft hover:text-fg"
        >
          <ArrowRightIcon size={16} />
        </Link>
      </div>
    </article>
  );
}