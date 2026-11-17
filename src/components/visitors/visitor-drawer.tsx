"use client";

import { type KeyboardEvent, type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { PageLoader } from "@/src/components/ui/page-loader";
import { useVisitors } from "@/src/components/dashboard/visitors-provider";
import { VisitorAvatar } from "@/src/components/dashboard/visitor-avatar";
import { AlertCircleIcon, CloseIcon, LogoutIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { api, errorMessage, type ApiVisit, type ApiVisitDetails, type ApiVisitDetailsResponse } from "@/src/lib/api";
import { formatPhone, maskPhone, type VisitorStatus, type VisitorType } from "@/src/lib/mock-visitors";
import { StatusBadge, TypeBadge } from "./badges";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

const STATUS: Record<ApiVisit["status"], VisitorStatus> = {
  PENDING_APPROVAL: "pending_approval",
  ONSITE: "onsite",
  PENDING_CLEARANCE: "pending_clearance",
  LEFT: "left",
  DECLINED: "declined",
};

/** Nov 9, 2026, 11:47 AM */
const dateTime = (value: string) =>
  new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

/** 17m, 2h 15m */
function duration(from: string, to: string | null) {
  const minutes = Math.max(0, Math.round(((to ? new Date(to) : new Date()).getTime() - new Date(from).getTime()) / 60000));
  const h = Math.floor(minutes / 60);
  return h ? `${h}h ${minutes % 60}m` : `${minutes}m`;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line px-6 py-5">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-[13px]">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium">{children}</dd>
    </div>
  );
}

const dash = <span className="text-muted">-</span>;

type VisitorDrawerProps = {
  /** The visit to show */
  visitorId: string;
  /** Show the full phone number (the Visitor Log's "Unlock PII" switch) */
  unlocked: boolean;
  onClose: () => void;
};

/**
 * Slides in from the right with everything about one visit: photo, contact details, host, times, the documents they
 * signed, their signature and their earlier visits. GET /api/visitors/:id has the details; the photo and signature are
 * images the browser opens from /visitors/:id/photo and /signature (the login cookie goes with them).
 * The buttons are the same ones the table has, so staff can act without closing it.
 */
export function VisitorDrawer({ visitorId, unlocked, onClose }: VisitorDrawerProps) {
  const { visitors, signOut, resolveApproval, resolveClearance } = useVisitors();
  const listed = visitors.find((visitor) => visitor.id === visitorId);
  // the list decides the status shown, so it changes the moment a button here is pressed
  const status = listed?.status;

  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [entered, setEntered] = useState(false);
  const [details, setDetails] = useState<ApiVisitDetails | null>(null);
  const [error, setError] = useState("");
  const [photoFailed, setPhotoFailed] = useState(false);
  const [signatureFailed, setSignatureFailed] = useState(false);
  const [checkoutSignatureFailed, setCheckoutSignatureFailed] = useState(false);

  // lock page scroll while open, move focus in, and hand it back on close
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  const load = useCallback(() => {
    let cancelled = false;
    setError("");
    api<ApiVisitDetailsResponse>(`/visitors/${encodeURIComponent(visitorId)}`)
      .then((data) => {
        if (cancelled) return;
        setDetails(data.visit);
        setPhotoFailed(false);
        setSignatureFailed(false);
        setCheckoutSignatureFailed(false);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "Couldn't load this visitor's details."));
      });
    return () => {
      cancelled = true;
    };
    // `status` is here on purpose: when staff let someone in or sign them out, the details (who decided, when) load again
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitorId, status]);

  useEffect(() => load(), [load]);

  // Escape closes; Tab stays inside the drawer
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const items = [...(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter((item) => item.offsetParent !== null);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const name = listed?.name ?? details?.name ?? "Visitor";
  const shownStatus = status ?? (details ? STATUS[details.status] : undefined);
  const type = (listed?.type ?? details?.type) as VisitorType | undefined;
  const phone = details?.phone ?? listed?.phone ?? "";
  const phoneText = !phone ? "" : unlocked ? formatPhone(phone) : maskPhone(phone);
  const base = `/backend/visitors/${encodeURIComponent(visitorId)}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end bg-slate-950/50 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className={`flex h-full w-full max-w-[460px] flex-col overflow-y-auto border-l border-line bg-surface shadow-[-24px_0_70px_rgba(0,0,0,0.25)] transition-transform duration-200 ease-out motion-reduce:transition-none ${
          entered ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 pb-2 pt-5">
          <h2 id={titleId} className="text-base font-bold tracking-tight">
            Visitor details
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close visitor details"
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface-soft hover:text-fg"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* who it is: the photo when there is one, otherwise their initials */}
        <div className="flex items-center gap-4 px-6 pb-5 pt-3">
          {details?.hasPhoto && !photoFailed ? (
            // eslint-disable-next-line @next/next/no-img-element -- a private, login-protected image: next/image can't fetch it
            <img
              src={`${base}/photo`}
              alt={`Photo of ${name}`}
              onError={() => setPhotoFailed(true)}
              className="h-24 w-24 shrink-0 rounded-xl border border-line object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-line bg-surface-soft">
              <span className="scale-[1.9]">
                <VisitorAvatar name={name} size="md" />
              </span>
              <span className="mt-2 text-[10px] text-muted">{details && !details.hasPhoto ? "No photo taken" : "\u00a0"}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="break-words text-lg font-bold leading-tight tracking-tight">{name}</p>
            {phoneText && <p className="mt-1 text-xs text-soft">{phoneText}</p>}
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {shownStatus && <StatusBadge status={shownStatus} />}
              {type && <TypeBadge type={type} />}
            </div>
          </div>
        </div>

        {/* the same actions as the table */}
        {shownStatus === "onsite" && (
          <div className="flex gap-2 px-6 pb-5">
            <Button variant="secondary" onClick={() => signOut(visitorId)}>
              <LogoutIcon size={14} /> Sign out visitor
            </Button>
          </div>
        )}
        {shownStatus === "pending_approval" && (
          <div className="flex gap-2 px-6 pb-5">
            <Button onClick={() => void resolveApproval(visitorId, "approve")}>Let in</Button>
            <Button variant="secondary" onClick={() => void resolveApproval(visitorId, "decline")}>
              Decline
            </Button>
          </div>
        )}
        {shownStatus === "pending_clearance" && (
          <div className="flex gap-2 px-6 pb-5">
            <Button onClick={() => void resolveClearance(visitorId, "approve")}>Approve check-out</Button>
            <Button variant="secondary" onClick={() => void resolveClearance(visitorId, "decline")}>
              Decline
            </Button>
          </div>
        )}

        {error && (
          <div role="alert" className="mx-6 mb-5 flex items-start gap-2.5 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
            <AlertCircleIcon size={16} className="mt-px shrink-0" />
            <div className="min-w-0 flex-1">
              {error}
              <button type="button" onClick={() => load()} className="ml-2 font-semibold underline">
                Try again
              </button>
            </div>
          </div>
        )}

        {!details && !error && <PageLoader label="Loading details…" className="py-10" />}

        {details && (
          <>
            <Section title="Visit">
              <dl>
                <Row label="Host">{details.host || dash}</Row>
                <Row label="Resident company">
                  {details.residentCompany ? (
                    <>
                      {details.residentCompany}
                      {details.floor && <span className="ml-1 text-[11px] font-normal text-muted">({details.floor})</span>}
                    </>
                  ) : (
                    dash
                  )}
                </Row>
                <Row label="Purpose">{details.purpose || dash}</Row>
                <Row label="Checked in">{dateTime(details.checkInAt)}</Row>
                <Row label="Checked out">{details.checkOutAt ? dateTime(details.checkOutAt) : dash}</Row>
                <Row label="Time on site">{details.status === "DECLINED" || details.status === "PENDING_APPROVAL" ? dash : duration(details.checkInAt, details.checkOutAt)}</Row>
                {details.clearanceRequestedAt && details.status === "PENDING_CLEARANCE" && <Row label="Check-out requested">{dateTime(details.clearanceRequestedAt)}</Row>}
                {details.decidedBy && details.decidedAt && (
                  <Row label={details.status === "DECLINED" ? "Declined by" : "Let in by"}>
                    {details.decidedBy}
                    <span className="block text-[11px] font-normal text-muted">{dateTime(details.decidedAt)}</span>
                  </Row>
                )}
              </dl>
              {details.notes && (
                <div className="mt-3 rounded-lg bg-surface-soft p-3 text-[13px] text-soft">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Notes</p>
                  <p className="whitespace-pre-wrap break-words">{details.notes}</p>
                </div>
              )}
            </Section>

            <Section title="Contact">
              <dl>
                <Row label="Phone">{phoneText || dash}</Row>
                <Row label="Email">{details.email || dash}</Row>
                <Row label="Company">{details.company || dash}</Row>
              </dl>
            </Section>

            <Section title="Documents signed">
              {details.documentsSigned.length === 0 ? (
                <p className="text-[13px] text-muted">No documents were signed for this visit.</p>
              ) : (
                <ul className="space-y-1.5">
                  {details.documentsSigned.map((doc, index) => (
                    <li key={`${doc.title}-${index}`} className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="font-medium">{doc.title}</span>
                      <span className="shrink-0 text-[11px] text-muted">{dateTime(doc.signedAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {details.hasSignature && !signatureFailed && (
                <div className="mt-3">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Signature</p>
                  {/* the pad draws dark strokes on a transparent background, so it always sits on white */}
                  {/* eslint-disable-next-line @next/next/no-img-element -- a private, login-protected image: next/image can't fetch it */}
                  <img
                    src={`${base}/signature`}
                    alt={`Signature of ${name}`}
                    onError={() => setSignatureFailed(true)}
                    className="h-24 w-full rounded-lg border border-line bg-white object-contain"
                  />
                </div>
              )}
              {details.hasCheckoutSignature && !checkoutSignatureFailed && (
                <div className="mt-3">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Check-out signature</p>
                  {/* eslint-disable-next-line @next/next/no-img-element -- a private, login-protected image: next/image can't fetch it */}
                  <img
                    src={`${base}/checkout-signature`}
                    alt={`Check-out signature of ${name}`}
                    onError={() => setCheckoutSignatureFailed(true)}
                    className="h-24 w-full rounded-lg border border-line bg-white object-contain"
                  />
                </div>
              )}
            </Section>

            <Section title={`Earlier visits${details.earlierVisits > 0 ? ` (${details.earlierVisits})` : ""}`}>
              {details.recentVisits.length === 0 ? (
                <p className="text-[13px] text-muted">First visit to this location.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {details.recentVisits.map((visit) => (
                    <li key={visit.id} className="flex items-center justify-between gap-3 py-2 text-[13px]">
                      <div className="min-w-0">
                        <p className="font-medium">{dateTime(visit.checkInAt)}</p>
                        <p className="truncate text-[11px] text-muted">
                          {visit.type}
                          {visit.host ? ` · Host: ${visit.host}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={STATUS[visit.status]} />
                    </li>
                  ))}
                </ul>
              )}
              {details.earlierVisits > details.recentVisits.length && (
                <p className="mt-2 text-[11px] text-muted">Showing the {details.recentVisits.length} most recent.</p>
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
