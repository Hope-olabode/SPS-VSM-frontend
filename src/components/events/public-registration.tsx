"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarIcon, CheckIcon, PinIcon } from "@/src/components/icons";
import { api, ApiError, type ApiPublicEvent, errorMessage } from "@/src/lib/api";
import { formatEventWhen } from "@/src/lib/mock-events";
import { formatExpectedDate } from "@/src/lib/mock-preregistrations";
import { AttendeeForm, type AttendeeValues } from "./attendee-form";

type Done = "APPROVED" | "PENDING";

const panel = "rounded-2xl border border-line bg-surface p-5 [box-shadow:var(--shadow)] sm:p-7";

/**
 * The page an attendee opens from the registration link (/register/<token>). No login: the secret in the address is the only key,
 * and the API answers with the event's public details only.
 */
export function PublicRegistration() {
  const { token } = useParams<{ token: string }>();
  const [event, setEvent] = useState<ApiPublicEvent | null>(null);
  const [problem, setProblem] = useState("");
  const [done, setDone] = useState<Done | null>(null);

  // GET /api/public/events/:token
  useEffect(() => {
    let current = true;
    api<{ event: ApiPublicEvent }>(`/public/events/${encodeURIComponent(token)}`, { redirectOn401: false })
      .then((data) => current && setEvent(data.event))
      .catch((err) => current && setProblem(err instanceof ApiError && err.status === 404 ? err.message : errorMessage(err, "Couldn't load this event. Check your connection and try again.")));
    return () => {
      current = false;
    };
  }, [token]);

  /** POST /api/public/events/:token/registrations. Returns an error message for the form, or null when registered. */
  async function register(values: AttendeeValues): Promise<string | null> {
    try {
      const data = await api<{ status: Done }>(`/public/events/${encodeURIComponent(token)}/registrations`, { method: "POST", body: values, redirectOn401: false });
      setDone(data.status);
      return null;
    } catch (err) {
      return errorMessage(err);
    }
  }

  let body;
  if (problem) {
    body = (
      <div role="alert" className={panel}>
        <h1 className="mb-2 text-lg font-bold">We can&apos;t open this event</h1>
        <p className="text-sm text-soft">{problem}</p>
      </div>
    );
  } else if (!event) {
    body = (
      <p role="status" className="py-16 text-center text-sm text-muted">
        Loading event…
      </p>
    );
  } else if (done) {
    body = (
      <div role="status" className={panel}>
        <span className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand">
          <CheckIcon size={22} />
        </span>
        <h1 className="mb-2 text-lg font-bold">{done === "PENDING" ? "Request received" : "You're registered"}</h1>
        <p className="text-sm text-soft">
          {done === "PENDING"
            ? `The organiser needs to approve your place at ${event.title} before it is confirmed.`
            : `Your place at ${event.title} is confirmed.`}
        </p>
      </div>
    );
  } else {
    const closed = event.ended ? "This event has already ended, so registration is closed." : event.full ? "This event is full, so registration is closed." : "";
    body = (
      <div className="space-y-5">
        <header>
          <h1 className="mb-3 break-words text-2xl font-bold leading-tight tracking-[-0.03em] sm:text-[28px]">{event.title}</h1>
          <div className="space-y-1.5 text-sm text-soft">
            <p className="flex items-center gap-2">
              <CalendarIcon size={15} className="shrink-0 text-muted" />
              {formatEventWhen(event, formatExpectedDate)}
            </p>
            <p className="flex items-center gap-2">
              <PinIcon size={15} className="shrink-0 text-muted" />
              {event.location}
            </p>
          </div>
          {event.description && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-soft">{event.description}</p>}
        </header>

        <section aria-label="Register" className={panel}>
          {closed ? (
            <p role="status" className="text-sm text-soft">
              {closed}
            </p>
          ) : (
            <>
              <h2 className="mb-1 text-sm font-semibold">Register to attend</h2>
              {event.requireApproval && <p className="mb-5 text-xs text-soft">The organiser approves each place, so you will see a request received message rather than a confirmation.</p>}
              {!event.requireApproval && <div className="mb-5" />}
              <AttendeeForm idPrefix="public-attendee" submitLabel="Register" onSubmit={register} />
            </>
          )}
        </section>
      </div>
    );
  }

  return <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:py-14">{body}</main>;
}
