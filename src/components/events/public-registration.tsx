"use client";

import { useParams } from "next/navigation";
import { PageLoader } from "@/src/components/ui/page-loader";
import { type ReactNode, useEffect, useState } from "react";
import { CalendarIcon, CheckIcon, MoonIcon, PinIcon, ShieldCheckIcon, SunIcon } from "@/src/components/icons";
import { useTheme } from "@/src/hooks/useTheme";
import { api, ApiError, type ApiPublicEvent, errorMessage } from "@/src/lib/api";
import { formatEventWhen } from "@/src/lib/mock-events";
import { formatExpectedDate } from "@/src/lib/mock-preregistrations";
import { AttendeeForm, type AttendeeValues } from "./attendee-form";

type Done = "APPROVED" | "PENDING";

const card = "w-full overflow-hidden rounded-3xl border border-line bg-surface [box-shadow:var(--shadow)]";

/** The green banner at the top of the pass */
function Hero({ badge, title }: { badge: string; title: string }) {
  return (
    <section className="bg-linear-to-r from-green-600 via-green-600 to-emerald-600 px-7 pb-9 pt-8 text-white sm:px-8 dark:from-green-700 dark:via-green-700 dark:to-emerald-800">
      <span className="mb-3.5 inline-flex rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">{badge}</span>
      <h1 className="max-w-md break-words text-2xl font-bold leading-tight tracking-tight sm:text-[26px]">{title}</h1>
    </section>
  );
}

function Detail({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3.5">
      <span className="mt-0.5 shrink-0 text-brand">{icon}</span>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold leading-snug text-fg">{label}</h2>
        <p className="mt-0.5 text-sm text-soft">{children}</p>
      </div>
    </div>
  );
}

function ThemePill() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-xs font-medium text-soft transition hover:bg-surface-soft"
    >
      {dark ? <SunIcon size={14} /> : <MoonIcon size={14} />}
      <span>{dark ? "Light" : "Dark"}</span>
    </button>
  );
}

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
      <div role="alert" className={`${card} p-7 sm:p-8`}>
        <h1 className="mb-2 text-lg font-bold">We can&apos;t open this event</h1>
        <p className="text-sm text-soft">{problem}</p>
      </div>
    );
  } else if (!event) {
    body = (
      <PageLoader label="Loading event…" className="py-24" />
    );
  } else if (done) {
    body = (
      <div role="status" className={card}>
        <Hero badge={done === "PENDING" ? "Request received" : "Registered"} title={event.title} />
        <div className="p-7 sm:p-8">
          <span className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand">
            <CheckIcon size={22} />
          </span>
          <h2 className="mb-2 text-lg font-bold">{done === "PENDING" ? "Request received" : "You're registered"}</h2>
          <p className="text-sm text-soft">
            {done === "PENDING"
              ? `The organiser needs to approve your place at ${event.title} before it is confirmed.`
              : `Your place at ${event.title} is confirmed.`}
          </p>
        </div>
      </div>
    );
  } else {
    const closed = event.ended ? "This event has already ended, so registration is closed." : event.full ? "This event is full, so registration is closed." : "";
    body = (
      <div className={card}>
        <Hero badge={event.requireApproval ? "Approval required" : "Open registration"} title={event.title} />

        <div className="space-y-6 p-7 sm:p-8">
          <div className="space-y-4">
            <Detail icon={<CalendarIcon size={20} />} label="Date & Time">
              {formatEventWhen(event, formatExpectedDate)}
            </Detail>
            <Detail icon={<PinIcon size={20} />} label="Venue">
              {event.location}
            </Detail>
            {event.description && <p className="whitespace-pre-line text-sm leading-relaxed text-soft">{event.description}</p>}
          </div>

          <hr className="border-line" />

          {closed ? (
            <p role="status" className="text-sm text-soft">
              {closed}
            </p>
          ) : (
            <section aria-label="Register">
              {event.requireApproval && <p className="mb-5 text-xs text-soft">The organiser approves each place, so you will see a request received message rather than a confirmation.</p>}
              <AttendeeForm idPrefix="public-attendee" submitLabel="Register now" onSubmit={register} />
            </section>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[540px] flex-1 flex-col items-center px-4 py-8 sm:py-10">
      <header className="mb-4 flex w-full items-center justify-between px-1">
        <div className="flex items-center gap-2 text-sm font-medium text-soft">
          <ShieldCheckIcon size={16} className="text-brand" />
          <span>SPS Event Pass</span>
        </div>
        <ThemePill />
      </header>

      {body}

    </main>
  );
}