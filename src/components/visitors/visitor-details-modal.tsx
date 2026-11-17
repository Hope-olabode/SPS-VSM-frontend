"use client";

import { type FormEvent, type KeyboardEvent, type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { useAudit } from "@/src/components/dashboard/audit-provider";
import { useCurrentUser } from "@/src/components/dashboard/current-user-provider";
import { useSettings } from "@/src/components/dashboard/settings-provider";
import { VisitorAvatar } from "@/src/components/dashboard/visitor-avatar";
import { useVisitors } from "@/src/components/dashboard/visitors-provider";
import {
  AlertCircleIcon,
  BuildingIcon,
  ClockIcon,
  CloseIcon,
  EyeIcon,
  LockIcon,
  LogoutIcon,
  MailIcon,
  PrinterIcon,
  ShieldAlertIcon,
  UserIcon,
} from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { inputClass } from "@/src/components/ui/field";
import { PageLoader } from "@/src/components/ui/page-loader";
import { api, errorMessage, type ApiVisit, type ApiVisitDetails, type ApiVisitDetailsResponse } from "@/src/lib/api";
import { auditMessages } from "@/src/lib/audit";
import { formatPhone, maskPhone, type VisitorStatus, type VisitorType } from "@/src/lib/mock-visitors";
import { isAdminRole } from "@/src/lib/mock-users";
import { type Severity, severities } from "@/src/lib/mock-watchlist";
import { StatusBadge, TypeBadge } from "./badges";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

const STATUS: Record<ApiVisit["status"], VisitorStatus> = {
  PENDING_APPROVAL: "pending_approval",
  ONSITE: "onsite",
  PENDING_CLEARANCE: "pending_clearance",
  LEFT: "left",
  DECLINED: "declined",
};

/** Nov 9, 2026 11:47 AM */
const dateTime = (value: string) =>
  new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

/** 17m, 2h 15m */
function duration(from: string, to: string | null) {
  const minutes = Math.max(0, Math.round(((to ? new Date(to) : new Date()).getTime() - new Date(from).getTime()) / 60000));
  const h = Math.floor(minutes / 60);
  return h ? `${h}h ${minutes % 60}m` : `${minutes}m`;
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] as string);

const dash = <span className="text-muted">-</span>;

const textarea =
  "min-h-[76px] w-full resize-y rounded-lg border border-line-strong bg-surface px-3 py-2 text-[13px] text-fg transition placeholder:text-muted focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20";

function Item({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex items-center gap-1.5 text-muted">
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <div className="break-words text-[13px] font-medium">{children}</div>
    </div>
  );
}

type VisitorDetailsModalProps = {
  /** The visit to show */
  visitorId: string;
  /** Show the Add to Watchlist button (the Visitor Log does, the Overview does not) */
  showWatchlist?: boolean;
  /** The Visitor Log's page-wide "Unlock PII" switch, so the numbers there and in this window agree */
  unlocked?: boolean;
  onClose: () => void;
};

/**
 * The centred "Visitor details" window opened from a row in the Overview and in the Visitor Log.
 * GET /api/visitors/:id has the details; the photo and signature are images the browser opens from
 * /visitors/:id/photo and /signature (the login cookie goes with them). The buttons follow the visit's status:
 * Check Out only while the visitor is on site, so it is gone once they have left.
 */
export function VisitorDetailsModal({ visitorId, showWatchlist = false, unlocked: pageUnlocked = false, onClose }: VisitorDetailsModalProps) {
  const { visitors, signOut, resolveApproval, resolveClearance } = useVisitors();
  const { record } = useAudit();
  const { user: currentUser } = useCurrentUser();
  const { settings } = useSettings();

  const listed = visitors.find((visitor) => visitor.id === visitorId);
  // the list decides the status shown, so it changes the moment a button here is pressed
  const status = listed?.status;

  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [details, setDetails] = useState<ApiVisitDetails | null>(null);
  const [error, setError] = useState("");
  const [photoFailed, setPhotoFailed] = useState(false);
  const [signatureFailed, setSignatureFailed] = useState(false);
  const [checkoutSignatureFailed, setCheckoutSignatureFailed] = useState(false);
  const [unlockRequested, setUnlockRequested] = useState(false);

  // watchlist
  const [adding, setAdding] = useState(false);
  const [severity, setSeverity] = useState<Severity>("Medium");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [watchlistError, setWatchlistError] = useState("");
  const [onWatchlist, setOnWatchlist] = useState(false);

  // Control Panel "Mask phone numbers": when it is off everyone sees full numbers; when it is on only admins may reveal them
  const canUnlock = settings.maskPhones && isAdminRole(currentUser.role);
  const unlocked = !settings.maskPhones || pageUnlocked || (canUnlock && unlockRequested);
  // the same roles the API lets add to the watchlist
  const canWatchlist = isAdminRole(currentUser.role) || currentUser.role === "MANAGER";

  // lock page scroll while open, move focus in, and hand it back on close
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  const load = useCallback(() => {
    let cancelled = false;
    api<ApiVisitDetailsResponse>(`/visitors/${encodeURIComponent(visitorId)}`)
      .then((data) => {
        if (cancelled) return;
        setDetails(data.visit);
        setError("");
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

  // Escape closes; Tab stays inside the window
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

  function toggleUnlock() {
    if (!unlocked) record({ action: "PII_UNLOCKED", category: "Security", message: auditMessages.piiUnlocked(currentUser.name) });
    setUnlockRequested((value) => !value);
  }

  async function addToWatchlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason.trim()) {
      setWatchlistError("Describe the reason for watchlisting");
      return;
    }
    setSaving(true);
    setWatchlistError("");
    try {
      await api(`/watchlist/from-visit/${encodeURIComponent(visitorId)}`, { method: "POST", body: { severity, reason: reason.trim() } });
      setOnWatchlist(true);
      setAdding(false);
      setReason("");
    } catch (err) {
      setWatchlistError(errorMessage(err, "Couldn't add this visitor to the watchlist."));
    } finally {
      setSaving(false);
    }
  }

  const name = listed?.name ?? details?.name ?? "Visitor";
  const shownStatus = status ?? (details ? STATUS[details.status] : undefined);
  const type = (listed?.type ?? details?.type) as VisitorType | undefined;
  const phone = details?.phone ?? listed?.phone ?? "";
  const phoneText = !phone ? "" : unlocked ? formatPhone(phone) : maskPhone(phone);
  const base = `/backend/visitors/${encodeURIComponent(visitorId)}`;
  const stillOnSite = shownStatus === "onsite" || shownStatus === "pending_clearance";
  const reference = `SIG-${visitorId.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase()}`;

  /** Opens the browser's print box with a small badge for this visitor */
  function printBadge() {
    if (!details) return;
    const popup = window.open("", "_blank", "width=420,height=560");
    if (!popup) {
      setError("Allow pop-ups for this site to print the badge.");
      return;
    }
    const photo = details.hasPhoto && !photoFailed ? `<img src="${base}/photo" alt="" />` : "";
    popup.document.write(`<!doctype html><html><head><title>Visitor badge</title><style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;padding:24px;display:flex;justify-content:center}
      .badge{width:300px;border:2px solid #111;border-radius:14px;padding:20px;text-align:center}
      .tag{background:#111;color:#fff;border-radius:999px;display:inline-block;padding:3px 14px;font-size:12px;letter-spacing:.12em;text-transform:uppercase}
      img{width:110px;height:110px;object-fit:cover;border-radius:12px;margin:16px 0 4px;border:1px solid #ddd}
      h1{font-size:24px;margin:14px 0 2px}p{margin:3px 0;font-size:13px;color:#333}.muted{color:#777;font-size:11px;margin-top:14px}
      @media print{body{padding:0}}
    </style></head><body><div class="badge"><span class="tag">${escapeHtml(details.type || "Visitor")}</span>${photo}
      <h1>${escapeHtml(name)}</h1>
      ${details.company ? `<p>${escapeHtml(details.company)}</p>` : ""}
      <p>Visiting: <strong>${escapeHtml(details.host || "-")}</strong></p>
      ${details.residentCompany ? `<p>${escapeHtml(details.residentCompany)}${details.floor ? ` (${escapeHtml(details.floor)})` : ""}</p>` : ""}
      <p class="muted">${escapeHtml(dateTime(details.checkInAt))}</p></div>
      <script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script></body></html>`);
    popup.document.close();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px] sm:p-6"
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
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_70px_rgba(0,0,0,0.3)]"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 id={titleId} className="text-base font-bold tracking-tight">
            Visitor Details
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

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {error && (
            <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              <AlertCircleIcon size={16} className="mt-px shrink-0" />
              <div className="min-w-0 flex-1">
                {error}
                {!details && (
                  <button type="button" onClick={() => load()} className="ml-2 font-semibold underline">
                    Try again
                  </button>
                )}
              </div>
            </div>
          )}

          {/* who it is: the photo when there is one, otherwise their initials */}
          <div className="flex items-start gap-4">
            {details?.hasPhoto && !photoFailed ? (
              // eslint-disable-next-line @next/next/no-img-element -- a private, login-protected image: next/image can't fetch it
              <img
                src={`${base}/photo`}
                alt={`Photo of ${name}`}
                onError={() => setPhotoFailed(true)}
                className="h-16 w-16 shrink-0 rounded-xl border border-line object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-soft">
                <span className="scale-150">
                  <VisitorAvatar name={name} size="md" />
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="break-words text-lg font-bold leading-snug">{name}</h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {shownStatus && <StatusBadge status={shownStatus} />}
                {type && <TypeBadge type={type} />}
              </div>
            </div>
          </div>

          {!details && !error && <PageLoader label="Loading details…" className="py-8" />}

          {details && (
            <>
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 border-t border-line pt-5 sm:grid-cols-2">
                <Item icon={<UserIcon size={14} />} label="Phone">
                  <span className="flex flex-wrap items-center gap-2">
                    {phoneText || dash}
                    {canUnlock && !unlocked && (
                      <button
                        type="button"
                        onClick={toggleUnlock}
                        className="inline-flex items-center gap-1 rounded border border-brand/30 bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand transition hover:bg-brand/15"
                      >
                        <EyeIcon size={11} /> Unlock (NDPA)
                      </button>
                    )}
                  </span>
                </Item>
                <Item icon={<MailIcon size={14} />} label="Email">
                  {details.email || dash}
                </Item>
                <Item icon={<BuildingIcon size={14} />} label="Company">
                  {details.company || dash}
                </Item>
                <Item icon={<BuildingIcon size={14} />} label="Resident Company">
                  {details.residentCompany ? (
                    <>
                      {details.residentCompany}
                      {details.floor && <span className="ml-1 text-xs font-normal text-muted">({details.floor})</span>}
                    </>
                  ) : (
                    dash
                  )}
                </Item>
                <Item icon={<UserIcon size={14} />} label="Host">
                  {details.host || dash}
                </Item>
                <Item icon={<ClockIcon size={14} />} label="Purpose">
                  {details.purpose || dash}
                </Item>
                <Item icon={<ClockIcon size={14} />} label="Check In">
                  {dateTime(details.checkInAt)}
                </Item>
                <Item icon={<LogoutIcon size={14} />} label="Check Out">
                  {details.checkOutAt ? (
                    dateTime(details.checkOutAt)
                  ) : details.status === "ONSITE" || details.status === "PENDING_CLEARANCE" ? (
                    <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Still on-site
                    </span>
                  ) : (
                    dash
                  )}
                </Item>
                <Item icon={<ClockIcon size={14} />} label="Duration">
                  {details.status === "DECLINED" || details.status === "PENDING_APPROVAL" ? dash : duration(details.checkInAt, details.checkOutAt)}
                </Item>
                {details.decidedBy && details.decidedAt && (
                  <Item icon={<UserIcon size={14} />} label={details.status === "DECLINED" ? "Declined by" : "Let in by"}>
                    {details.decidedBy}
                    <span className="block text-[11px] font-normal text-muted">{dateTime(details.decidedAt)}</span>
                  </Item>
                )}
              </div>

              {details.notes && (
                <div className="rounded-lg bg-surface-soft p-3 text-[13px] text-soft">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Notes</p>
                  <p className="whitespace-pre-wrap break-words">{details.notes}</p>
                </div>
              )}

              <div>
                <h4 className="mb-2.5 text-xs font-semibold">Signatures &amp; Documents</h4>
                <div className="space-y-3 rounded-xl border border-line bg-surface-soft p-3.5 text-xs">
                  <div className="flex flex-wrap items-center gap-2 font-semibold">
                    Check-in Signature
                    {details.hasSignature ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600 dark:text-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Signature on file
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-muted">No signature captured</span>
                    )}
                  </div>

                  {details.hasSignature && !signatureFailed && (
                    <>
                      {/* the pad draws dark strokes on a transparent background, so it always sits on white */}
                      {/* eslint-disable-next-line @next/next/no-img-element -- a private, login-protected image: next/image can't fetch it */}
                      <img
                        src={`${base}/signature`}
                        alt={`Signature of ${name}`}
                        onError={() => setSignatureFailed(true)}
                        className="h-20 w-full rounded-lg border border-line bg-white object-contain"
                      />
                      <div className="grid grid-cols-2 gap-2 border-t border-line pt-2.5 text-[11px]">
                        <div>
                          <span className="text-muted">Signing Method: </span>
                          <span className="font-medium">Touch Screen / Stylus</span>
                        </div>
                        <div>
                          <span className="text-muted">Reference: </span>
                          <span className="font-mono">{reference}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {details.hasCheckoutSignature && !checkoutSignatureFailed && (
                    <div className="space-y-2 border-t border-line pt-2.5">
                      <div className="flex flex-wrap items-center gap-2 font-semibold">
                        Check-out Signature
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600 dark:text-green-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          Signature on file
                        </span>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element -- a private, login-protected image: next/image can't fetch it */}
                      <img
                        src={`${base}/checkout-signature`}
                        alt={`Check-out signature of ${name}`}
                        onError={() => setCheckoutSignatureFailed(true)}
                        className="h-20 w-full rounded-lg border border-line bg-white object-contain"
                      />
                    </div>
                  )}

                  {details.documentsSigned.length > 0 && (
                    <ul className="space-y-1.5 border-t border-line pt-2.5">
                      {details.documentsSigned.map((doc, index) => (
                        <li key={`${doc.title}-${index}`} className="flex items-center justify-between gap-3 text-[12px]">
                          <span className="font-medium">{doc.title}</span>
                          <span className="shrink-0 text-[11px] text-muted">{dateTime(doc.signedAt)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {details.documentsSigned.length === 0 && <p className="text-[12px] text-muted">No documents were signed for this visit.</p>}
                </div>
              </div>

              <div>
                <h4 className="mb-2.5 text-xs font-semibold">Earlier visits{details.earlierVisits > 0 ? ` (${details.earlierVisits})` : ""}</h4>
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
              </div>
            </>
          )}
        </div>

        {/* Add to Watchlist: a short form that opens above the buttons */}
        {showWatchlist && canWatchlist && adding && (
          <form onSubmit={addToWatchlist} noValidate className="space-y-3 border-t border-line bg-surface-soft px-6 py-4">
            <p className="flex items-center gap-2 text-[13px] font-semibold">
              <ShieldAlertIcon size={15} className="text-red-600" /> Add {name} to the watchlist
            </p>
            <div className="grid gap-3 sm:grid-cols-[150px_1fr]">
              <div>
                <label htmlFor="wl-severity" className="mb-1 block text-[11px] font-medium text-muted">
                  Severity
                </label>
                <select id="wl-severity" value={severity} onChange={(event) => setSeverity(event.target.value as Severity)} className={inputClass}>
                  {severities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="wl-reason" className="mb-1 block text-[11px] font-medium text-muted">
                  Reason
                </label>
                <textarea
                  id="wl-reason"
                  autoFocus
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    setWatchlistError("");
                  }}
                  placeholder="Why should this person be flagged?"
                  className={textarea}
                />
              </div>
            </div>
            {watchlistError && (
              <p role="alert" className="text-xs text-red-500">
                {watchlistError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setAdding(false);
                  setWatchlistError("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="danger" loading={saving}>
                Add to Watchlist
              </Button>
            </div>
          </form>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-line bg-surface-soft/60 px-6 py-4">
          {shownStatus === "pending_approval" && (
            <>
              <Button onClick={() => void resolveApproval(visitorId, "approve")}>Let in</Button>
              <Button variant="secondary" onClick={() => void resolveApproval(visitorId, "decline")}>
                Decline
              </Button>
            </>
          )}
          {shownStatus === "pending_clearance" && (
            <>
              <Button onClick={() => void resolveClearance(visitorId, "approve")}>Approve check-out</Button>
              <Button variant="secondary" onClick={() => void resolveClearance(visitorId, "decline")}>
                Decline
              </Button>
            </>
          )}

          {/* only the Visitor Log has this one, and only for the roles the API allows */}
          {showWatchlist && canWatchlist && !adding && (
            <Button variant="danger" onClick={() => setAdding(true)} disabled={onWatchlist} className="mr-auto">
              <ShieldAlertIcon size={14} /> {onWatchlist ? "On Watchlist" : "Add to Watchlist"}
            </Button>
          )}

          {stillOnSite && (
            <Button variant="secondary" onClick={printBadge} disabled={!details}>
              <PrinterIcon size={14} /> Print Badge
            </Button>
          )}

          {/* Check Out is only for someone who is still on site: once they have left (or were declined) it is gone */}
          {shownStatus === "onsite" && (
            <Button onClick={() => void signOut(visitorId)}>
              <LogoutIcon size={14} /> Check Out
            </Button>
          )}

          {canUnlock && !pageUnlocked && (
            <Button variant="secondary" onClick={toggleUnlock} aria-pressed={unlocked}>
              {unlocked ? <LockIcon size={14} /> : <EyeIcon size={14} />}
              {unlocked ? "Lock PII" : "Unlock PII"}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
