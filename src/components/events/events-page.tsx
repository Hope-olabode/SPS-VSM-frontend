"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarIcon, SearchIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { api, type ApiEvent, type ApiEventList, errorMessage } from "@/src/lib/api";
import type { EventItem, NewEvent } from "@/src/lib/mock-events";
import { EventCard } from "./event-card";
import { EventForm } from "./event-form";

export function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  // GET /api/events
  const load = useCallback(
    () =>
      api<ApiEventList>("/events")
        .then((data) => {
          setEvents(data.items);
          setLoadError("");
        })
        .catch((err) => setLoadError(errorMessage(err, "Couldn't load the events.")))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // the "event created" message disappears by itself
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    return text ? events.filter((event) => event.title.toLowerCase().includes(text)) : events;
  }, [events, query]);

  /** POST /api/events. Returns an error message for the form, or null when saved. */
  async function createEvent(values: NewEvent): Promise<string | null> {
    try {
      const { item } = await api<{ item: ApiEvent }>("/events", { method: "POST", body: values });
      // newest first, so the new event is the first thing the person sees
      setEvents((current) => [item, ...current]);
      setCreating(false);
      setQuery("");
      setNotice(`"${item.title}" was created`);
      return null;
    } catch (err) {
      return errorMessage(err);
    }
  }

  /** DELETE /api/events/:id */
  async function deleteEvent(id: string) {
    try {
      await api(`/events/${encodeURIComponent(id)}`, { method: "DELETE" });
      setEvents((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setNotice(errorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-[7px] text-[21px] font-bold leading-tight tracking-[-0.035em] sm:text-[25px]">Events Directory</h1>
          <p className="text-xs text-soft">Manage upcoming and past organization events</p>
        </div>

        <Button onClick={() => setCreating((value) => !value)} aria-expanded={creating}>
          <CalendarIcon size={15} />
          {creating ? "Cancel" : "Create Event"}
        </Button>
      </div>

      {creating && <EventForm onSave={createEvent} onCancel={() => setCreating(false)} />}

      <section className="space-y-3.5" aria-label="Events">
        <div className="relative max-w-sm">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search events by title..."
            aria-label="Search events by title"
            className="w-full rounded-lg border border-line-strong bg-surface py-2 pl-9 pr-3 text-xs text-fg shadow-sm transition placeholder:text-muted focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20"
          />
        </div>

        {loadError && (
          <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-5 py-4 text-center text-xs text-red-600 dark:text-red-300">
            <p className="mb-2">{loadError}</p>
            <button type="button" onClick={() => void load()} className="font-semibold text-brand hover:text-brand-hover">
              Try again
            </button>
          </div>
        )}

        <div className="space-y-2.5">
          {loading && (
            <p role="status" className="px-5 py-12 text-center text-xs text-muted">
              Loading events…
            </p>
          )}

          {visible.map((event) => (
            <EventCard key={event.id} event={event} onDelete={deleteEvent} />
          ))}

          {!loading && !loadError && visible.length === 0 && (
            <p className="rounded-xl border border-dashed border-line-strong px-5 py-12 text-center text-xs text-muted">
              {events.length === 0 ? "No events yet. Click Create Event to add one." : "No events match that title."}
            </p>
          )}
        </div>
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