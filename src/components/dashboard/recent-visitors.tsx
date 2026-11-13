"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon, SearchIcon } from "../icons";
import type { Visitor, VisitorStatus } from "../../lib/mock-visitors";
import { VisitorAvatar } from "./visitor-avatar";
import { useVisitors } from "./visitors-provider";

type Filter = "all" | VisitorStatus;

const statusStyles: Record<VisitorStatus, { label: string; badge: string; dot: string }> = {
  pending_approval: {
    label: "Awaiting Approval",
    badge: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500 animate-pulse",
  },
  declined: {
    label: "Declined",
    badge: "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
  onsite: {
    label: "Onsite",
    badge: "border-green-600/20 bg-green-600/10 text-green-700 dark:text-green-400",
    dot: "bg-green-500",
  },
  pending_clearance: {
    label: "Pending Clearance",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500 animate-pulse",
  },
  left: {
    label: "Left",
    badge: "border-transparent bg-slate-500/10 text-soft",
    dot: "bg-slate-400",
  },
};

const filterIdle: Record<Filter, string> = {
  pending_approval: "border-blue-500/25 bg-blue-500/10 text-blue-700 hover:bg-blue-500/15 dark:text-blue-300",
  declined: "border-transparent bg-surface-soft text-soft hover:bg-line",
  all: "border-transparent bg-surface-soft text-soft hover:bg-line",
  onsite: "border-green-600/20 bg-green-600/10 text-green-700 hover:bg-green-600/15 dark:text-green-400",
  pending_clearance: "border-amber-500/25 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-300",
  left: "border-transparent bg-surface-soft text-soft hover:bg-line",
};

function matches(visitor: Visitor, query: string) {
  if (!query) return true;
  const haystack = [visitor.name, visitor.type, visitor.company, visitor.residentCompany, visitor.host].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function Stamp({ value }: { value?: { date: string; time: string } }) {
  if (!value) return <span className="text-muted">-</span>;
  return (
    <span className="leading-tight text-soft">
      {value.date}
      <br />
      <span className="text-muted">{value.time}</span>
    </span>
  );
}

const th = "px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted";

export function RecentVisitors() {
  const { visitors } = useVisitors();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const count = (status: VisitorStatus) => visitors.filter((visitor) => visitor.status === status).length;

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All Visitors" },
    ...(count("pending_approval") > 0 ? [{ key: "pending_approval" as const, label: `• Awaiting Approval (${count("pending_approval")})` }] : []),
    { key: "onsite", label: `• Onsite (${count("onsite")})` },
    { key: "pending_clearance", label: `• Pending Clearance (${count("pending_clearance")})` },
    { key: "left", label: "Checked Out" },
  ];

  const rows = visitors.filter((visitor) => (filter === "all" || visitor.status === filter) && matches(visitor, query.trim()));

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface [box-shadow:var(--shadow)]">
      <div className="border-b border-line p-5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold">Recent Visitors</h2>
          <Link href="/dashboard/visitors" className="flex items-center gap-0.5 text-xs font-medium text-brand hover:text-brand-hover">
            View All <ArrowRightIcon size={13} />
          </Link>
        </div>
        <p className="mt-0.5 text-xs text-muted">Your latest front desk activity</p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search visitor, company, host..."
              aria-label="Search visitors"
              className="w-full rounded-lg border border-line-strong bg-surface-soft py-1.5 pl-9 pr-3 text-xs text-fg transition placeholder:text-muted focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20"
            />
          </div>

          <div className="flex w-full items-center gap-1.5 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
            {filters.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
                className={`whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                  filter === key ? "border-brand bg-brand font-semibold text-white dark:text-[#04130a]" : filterIdle[key]
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-line bg-surface-soft">
              <th scope="col" className={`${th} pl-5`}>Visitor</th>
              <th scope="col" className={th}>Company</th>
              <th scope="col" className={th}>Resident Company</th>
              <th scope="col" className={th}>Host</th>
              <th scope="col" className={th}>Status</th>
              <th scope="col" className={th}>Check In</th>
              <th scope="col" className={th}>Check Out</th>
              <th scope="col" className={`${th} pr-5`}>Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((visitor) => {
              const status = statusStyles[visitor.status];
              return (
                <tr
                  key={visitor.id}
                  className={`transition-colors hover:bg-surface-soft ${visitor.status === "pending_clearance" ? "bg-amber-500/[0.06]" : ""}`}
                >
                  <td className="py-3 pl-5 pr-4">
                    <div className="flex items-center gap-3">
                      <VisitorAvatar name={visitor.name} />
                      <div>
                        <div className="whitespace-nowrap font-bold leading-none">{visitor.name}</div>
                        <div className="mt-1 text-[11px] text-muted">{visitor.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-soft">{visitor.company || <span className="text-muted">-</span>}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{visitor.residentCompany}</div>
                    {visitor.floor && <div className="text-[10px] text-muted">({visitor.floor})</div>}
                  </td>
                  <td className="px-4 py-3 font-medium">{visitor.host}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.badge}`}>
                      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Stamp value={visitor.checkIn} />
                  </td>
                  <td className="px-4 py-3">
                    <Stamp value={visitor.checkOut} />
                  </td>
                  <td className="py-3 pl-4 pr-5 font-medium text-soft">{visitor.duration}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-muted">
                  No visitors match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}