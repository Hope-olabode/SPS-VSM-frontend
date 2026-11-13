"use client";

import { CalendarIcon, SearchIcon } from "@/src/components/icons";
import { type Filters, getPresets } from "@/src/lib/visitor-filters";
import { visitorTypes } from "@/src/lib/mock-visitors";

const control =
  "w-full rounded-lg border border-line-strong bg-surface py-2 text-xs text-fg shadow-sm transition placeholder:text-muted focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20";

type VisitorFiltersProps = { filters: Filters; onChange: (patch: Partial<Filters>) => void };

export function VisitorFilters({ filters, onChange }: VisitorFiltersProps) {
  return (
    <section className="space-y-3" aria-label="Filters">
      {/* Quick date ranges: click again to clear */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium">
        {getPresets().map(({ key, label, range }) => {
          const active = filters.preset === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() =>
                onChange(active ? { preset: null, from: "", to: "" } : { preset: key, from: range[0], to: range[1] })
              }
              className={`flex items-center gap-1.5 transition-colors ${active ? "text-brand" : "text-soft hover:text-fg"}`}
            >
              <CalendarIcon size={14} className={active ? "text-brand" : "text-muted"} />
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-2 md:grid-cols-12">
        <div className="relative sm:col-span-2 md:col-span-4">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={filters.query}
            onChange={(event) => onChange({ query: event.target.value })}
            placeholder="Search visitors, company, host"
            aria-label="Search visitors"
            className={`${control} pl-9 pr-3`}
          />
        </div>

        <select
          value={filters.status}
          onChange={(event) => onChange({ status: event.target.value as Filters["status"] })}
          aria-label="Filter by status"
          className={`${control} px-3 md:col-span-2`}
        >
          <option value="all">All Status</option>
          <option value="pending_approval">Awaiting Approval</option>
          <option value="onsite">Onsite</option>
          <option value="pending_clearance">Pending Clearance</option>
          <option value="left">Left</option>
          <option value="declined">Declined</option>
        </select>

        <select
          value={filters.type}
          onChange={(event) => onChange({ type: event.target.value as Filters["type"] })}
          aria-label="Filter by visitor type"
          className={`${control} px-3 md:col-span-2`}
        >
          <option value="all">All Types</option>
          {visitorTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.from}
          max={filters.to || undefined}
          onChange={(event) => onChange({ from: event.target.value, preset: null })}
          aria-label="From date"
          className={`${control} px-3 md:col-span-2`}
        />
        <input
          type="date"
          value={filters.to}
          min={filters.from || undefined}
          onChange={(event) => onChange({ to: event.target.value, preset: null })}
          aria-label="To date"
          className={`${control} px-3 md:col-span-2`}
        />
      </div>
    </section>
  );
}