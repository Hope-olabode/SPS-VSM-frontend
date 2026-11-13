"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon, CalendarIcon, PencilIcon, PinIcon, UserPlusIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { api, ApiError, type ApiEvent, type ApiEventRegistration, type ApiRegistrationList, errorMessage } from "@/src/lib/api";
import { formatEventWhen, type NewEvent } from "@/src/lib/mock-events";
import { formatExpectedDate } from "@/src/lib/mock-preregistrations";
import { AttendeeForm, type AttendeeValues } from "./attendee-form";
import { AttendeeTable } from "./attendee-table";
import { EventForm } from "./event-form";
import { RegistrationLinkCard } from "./registration-link-card";

const card = "rounded-xl border border-line bg-surface [box-shadow:var(--shadow)]";

/** Everything about one event for staff: who is registered, adding people, editing, and the public registration link */
export function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const eventPath = `/events/${encodeURIComponent(id)}`;

  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [registrations, setRegistrations] = useState<ApiEventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  // GET /api/events/:id and GET /api/events/:id/registrations
  const load = useCallback(
    () =>
      Promise.all([api<{ item: ApiEvent }>(eventPath), api<ApiRegistrationList>(`${eventPath}/registrations`)])
        .then(([detail, list]) => {
          setEvent(detail.item);
          setRegistrations(list.items);
          setLoadError("");
          setNotFound(false);
        })
        .catch((err) => {
          if (err instanceof ApiError && err.status === 404) setNotFound(true);
          else setLoadError(errorMessage(err, "Couldn't load this event."));
        })
        .finally(() => setLoading(false)),
    [eventPath],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // messages disappear by themselves
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  // Awaiting-approval people first, then newest first (the order the server sends)
  const rows = useMemo(() => [...registrations].sort((a, b) => Number(b.status === "PENDING") - Number(a.status === "PENDING")), [registrations]);
  const pending = registrations.filter((row) => row.status === "PENDING").length;

  /** PATCH /api/events/:id. Returns an error message for the form, or null when saved. */
  async function saveEvent(values: NewEvent): Promise<string | null> {
    try {
      const data = await api<{ item: ApiEvent }>(eventPath, { method: "PATCH", body: values });
      setEvent(data.item);
      setEditing(false);
      setNotice("Event updated");
      return null;
    } catch (err) {
      return errorMessage(err);
    }
  }

  /** POST /api/events/:id/registrations. Staff registrations are approved straight away. */
  async function register(values: AttendeeValues): Promise<string | null> {
    try {
      const data = await api<{ item: ApiEventRegistration }>(`${eventPath}/registrations`, { method: "POST", body: values });
      setRegistrations((current) => [data.item, ...current]);
      setNotice(`${data.item.name} was registered`);
      return null;
    } catch (err) {
      return errorMessage(err);
    }
  }

  /** Runs one action on one registration and shows the server's message when it fails */
  async function act(registration: ApiEventRegistration, run: () => Promise<void>) {
    setBusyId(registration.id);
    try {
      await run();
    } catch (err) {
      setNotice(errorMessage(err));
      // the list may be out of date (someone else may have dealt with it), so fetch it again
      void load();
    } finally {
      setBusyId(null);
    }
  }

  const approve = (registration: ApiEventRegistration) =>
    act(registration, async () => {
      const data = await api<{ item: ApiEventRegistration }>(`${eventPath}/registrations/${encodeURIComponent(registration.id)}/approve`, { method: "POST" });
      setRegistrations((current) => current.map((row) => (row.id === registration.id ? data.item : row)));
      setNotice(`${registration.name} was approved`);
    });

  const decline = (registration: ApiEventRegistration) =>
    act(registration, async () => {
      await api(`${eventPath}/registrations/${encodeURIComponent(registration.id)}/decline`, { method: "POST" });
      setRegistrations((current) => current.filter((row) => row.id !== registration.id));
      setNotice(`${registration.name} was declined`);
    });

  const remove = (registration: ApiEventRegistration) =>
    act(registration, async () => {
      await api(`${eventPath}/registrations/${encodeURIComponent(registration.id)}`, { method: "DELETE" });
      setRegistrations((current) => current.filter((row) => row.id !== registration.id));
      setNotice(`${registration.name} was removed`);
    });

  /** POST /api/events/:id/registration-link/regenerate */
  async function regenerateLink() {
    try {
      const data = await api<{ item: ApiEvent }>(`${eventPath}/registration-link/regenerate`, { method: "POST" });
      setEvent(data.item);
      setNotice("New registration link ready. The old one no longer works.");
    } catch (err) {
      setNotice(errorMessage(err));
    }
  }

  const back = (
    <Link href="/dashboard/events" className="inline-flex items-center gap-1.5 text-xs font-medium text-soft transition hover:text-fg">
      <ArrowLeftIcon size={14} /> All events
    </Link>
  );

  if (loading) {
    return (
      <p role="status" className="px-5 py-16 text-center text-xs text-muted">
        Loading event…
      </p>
    );
  }

  if (notFound || !event) {
    return (
      <div className="space-y-4">
        {back}
        {loadError ? (
          <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-5 py-4 text-center text-xs text-red-600 dark:text-red-300">
            <p className="mb-2">{loadError}</p>
            <button type="button" onClick={() => void load()} className="font-semibold text-brand hover:text-brand-hover">
              Try again
            </button>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-line-strong px-5 py-12 text-center text-xs text-muted">
            This event doesn&apos;t exist at the location you&apos;re viewing. It may have been deleted.
          </p>
        )}
      </div>
    );
  }

  const taken = registrations.length;
  const share = Math.min(100, Math.round((taken / event.capacity) * 100));
  const link = `${window.location.origin}/register/${event.registrationToken}`;
  const policies = [
    event.requireNda && "NDA or waiver signed on check-in",
    event.requirePhoto && "Photo taken on check-in",
    event.requireApproval && "Host approval needed to attend",
  ].filter((item): item is string => Boolean(item));

  return (
    <div className="space-y-6">
      {back}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="mb-2 break-words text-[21px] font-bold leading-tight tracking-[-0.035em] sm:text-[25px]">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-soft">
            <span className="flex items-center gap-1.5">
              <CalendarIcon size={13} className="text-muted" />
              {formatEventWhen(event, formatExpectedDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <PinIcon size={13} className="text-muted" />
              {event.location}
            </span>
          </div>
        </div>

        <Button variant="secondary" onClick={() => setEditing((value) => !value)} aria-expanded={editing}>
          <PencilIcon size={14} />
          {editing ? "Cancel edit" : "Edit event"}
        </Button>
      </div>

      {editing && <EventForm initial={event} onSave={saveEvent} onCancel={() => setEditing(false)} />}

      {!editing && (
        <section aria-label="Event summary" className={`${card} p-5`}>
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              <div className="mb-2 flex items-baseline justify-between gap-3 text-xs">
                <span className="font-semibold">
                  {taken} of {event.capacity} places taken
                </span>
                {pending > 0 && <span className="font-medium text-amber-700 dark:text-amber-300">{pending} awaiting approval</span>}
              </div>
              <div role="progressbar" aria-label="Places taken" aria-valuemin={0} aria-valuemax={event.capacity} aria-valuenow={taken} className="h-2 overflow-hidden rounded-full bg-surface-soft">
                <div className={`h-full rounded-full ${share >= 100 ? "bg-amber-500" : "bg-brand"}`} style={{ width: `${share}%` }} />
              </div>
            </div>
            {policies.length > 0 && (
              <ul className="flex flex-wrap gap-1.5 sm:max-w-[320px] sm:justify-end">
                {policies.map((policy) => (
                  <li key={policy} className="rounded-full border border-line-strong px-2.5 py-0.5 text-[11px] text-soft">
                    {policy}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {event.description && <p className="mt-4 whitespace-pre-line border-t border-line pt-4 text-xs leading-relaxed text-soft">{event.description}</p>}
        </section>
      )}

      <RegistrationLinkCard url={link} requireApproval={event.requireApproval} onRegenerate={regenerateLink} />

      <section aria-label="Attendees" className={`${card} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <h2 className="text-sm font-semibold">Attendees</h2>
          <Button onClick={() => setAdding((value) => !value)} aria-expanded={adding}>
            <UserPlusIcon size={15} />
            {adding ? "Cancel" : "Register someone"}
          </Button>
        </div>

        {adding && (
          <div className="border-b border-line bg-surface-soft/50 px-5 py-5 sm:px-6">
            <AttendeeForm idPrefix="staff-attendee" submitLabel="Register attendee" onSubmit={register} onCancel={() => setAdding(false)} />
          </div>
        )}

        {rows.length > 0 ? (
          <AttendeeTable rows={rows} busyId={busyId} onApprove={approve} onDecline={decline} onRemove={remove} />
        ) : (
          <p className="px-5 py-12 text-center text-xs text-muted">No one is registered yet. Register someone here, or share the registration link above.</p>
        )}
      </section>

      <p
        role="status"
        aria-live="polite"
        className={notice ? "fixed bottom-5 left-1/2 z-40 max-w-[90vw] -translate-x-1/2 rounded-lg bg-fg px-4 py-2.5 text-xs font-medium text-surface shadow-lg" : "sr-only"}
      >
        {notice}
      </p>
    </div>
  );
}
