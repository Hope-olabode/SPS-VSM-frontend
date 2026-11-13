"use client";

import { useMemo, useState } from "react";
import { SearchIcon, UsersIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { TypeBadge } from "@/src/components/visitors/badges";
import { maskPhone, type VisitorType, visitorTypes } from "@/src/lib/mock-visitors";
import type { parseNumbers } from "@/src/lib/sms";
import type { Contact } from "./marketing-page";

type AudiencePickerProps = {
  contacts: Contact[];
  /** Visitors who have no usable phone number, so they can't be picked */
  skipped: number;
  selected: Set<string>;
  onSelectedChange: (next: Set<string>) => void;
  manualText: string;
  onManualTextChange: (text: string) => void;
  manual: ReturnType<typeof parseNumbers>;
};

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-[11px] font-medium transition ${
    active ? "border-brand bg-brand-soft text-brand" : "border-line-strong text-soft hover:border-brand/40 hover:text-fg"
  }`;

export function AudiencePicker({ contacts, skipped, selected, onSelectedChange, manualText, onManualTextChange, manual }: AudiencePickerProps) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<VisitorType | "all">("all");

  const shown = useMemo(() => {
    const text = query.trim().toLowerCase();
    return contacts.filter(
      (contact) => (type === "all" || contact.type === type) && (!text || [contact.name, contact.company].join(" ").toLowerCase().includes(text)),
    );
  }, [contacts, query, type]);

  const allShownSelected = shown.length > 0 && shown.every((contact) => selected.has(contact.phone));

  function toggle(phone: string) {
    const next = new Set(selected);
    if (next.has(phone)) next.delete(phone);
    else next.add(phone);
    onSelectedChange(next);
  }

  function toggleShown() {
    const next = new Set(selected);
    shown.forEach((contact) => (allShownSelected ? next.delete(contact.phone) : next.add(contact.phone)));
    onSelectedChange(next);
  }

  return (
    <section className="rounded-xl border border-line bg-surface [box-shadow:var(--shadow)]" aria-label="Audience">
      <header className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          <UsersIcon size={18} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Audience</h2>
          <p className="text-xs text-soft">Pick people from your visitor list. Phone numbers are masked here.</p>
        </div>
      </header>

      <div className="space-y-3 border-b border-line px-5 py-4">
        <div className="relative">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or company..."
            aria-label="Search visitors"
            className="w-full rounded-lg border border-line-strong bg-surface py-2 pl-9 pr-3 text-xs text-fg shadow-sm transition placeholder:text-muted focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by visitor type">
            <button type="button" aria-pressed={type === "all"} onClick={() => setType("all")} className={chip(type === "all")}>
              All
            </button>
            {visitorTypes.map((item) => (
              <button key={item} type="button" aria-pressed={type === item} onClick={() => setType(item)} className={chip(type === item)}>
                {item}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" className="!min-h-8 !px-2.5 !text-xs" onClick={toggleShown} disabled={shown.length === 0}>
              {allShownSelected ? "Deselect shown" : `Select shown (${shown.length})`}
            </Button>
            {selected.size > 0 && (
              <Button variant="ghost" className="!min-h-8 !px-2.5 !text-xs" onClick={() => onSelectedChange(new Set())}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      <ul className="max-h-[340px] divide-y divide-line overflow-auto" aria-label="Visitors">
        {shown.map((contact) => {
          const checked = selected.has(contact.phone);
          return (
            <li key={contact.phone}>
              <label className={`flex cursor-pointer items-center gap-3 px-5 py-2.5 transition-colors hover:bg-surface-soft ${checked ? "bg-brand-soft/50" : ""}`}>
                <input type="checkbox" checked={checked} onChange={() => toggle(contact.phone)} className="h-4 w-4 shrink-0 cursor-pointer accent-brand" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">{contact.name}</span>
                  <span className="block truncate text-[11px] text-muted">
                    {contact.company || "No company"} · {maskPhone(contact.phone)}
                  </span>
                </span>
                <TypeBadge type={contact.type} />
              </label>
            </li>
          );
        })}
        {shown.length === 0 && <li className="px-5 py-10 text-center text-xs text-muted">No visitors match.</li>}
      </ul>
      {skipped > 0 && (
        <p className="border-t border-line px-5 py-2.5 text-[11px] text-muted">
          {skipped} {skipped === 1 ? "visitor has" : "visitors have"} no valid Nigerian mobile number and can&apos;t be messaged.
        </p>
      )}

      <div className="border-t border-line px-5 py-4">
        <label htmlFor="mk-manual" className="mb-2 block text-[13px] font-semibold text-fg">
          Add other numbers
        </label>
        <textarea
          id="mk-manual"
          rows={3}
          value={manualText}
          onChange={(event) => onManualTextChange(event.target.value)}
          placeholder="0801 234 5678, +234 902 345 6789"
          aria-describedby="mk-manual-help"
          className="w-full min-w-0 resize-y rounded-lg border border-line-strong bg-surface-soft px-3.5 py-2.5 text-sm text-fg transition placeholder:text-muted hover:border-brand/40 focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20"
        />
        <p id="mk-manual-help" className="mt-1.5 text-[11px] text-muted">
          Separate numbers with a comma or a new line. Nigerian mobile numbers only.
          {manual.valid.length > 0 && <span className="font-medium text-brand"> {manual.valid.length} valid.</span>}
        </p>
        {manual.invalid.length > 0 && (
          <p role="alert" className="mt-1 text-[11px] text-red-500">
            Not a valid number, so it will be skipped: {manual.invalid.slice(0, 5).join(", ")}
            {manual.invalid.length > 5 && ` and ${manual.invalid.length - 5} more`}
          </p>
        )}
      </div>
    </section>
  );
}
