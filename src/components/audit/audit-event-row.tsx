import { CalendarIcon, ChevronDownIcon, ClockIcon, UserIcon, ZapIcon } from "@/src/components/icons";
import type { AuditAction, AuditEvent } from "@/src/lib/audit";

const tones: Partial<Record<AuditAction, string>> = {
  KIOSK_CHECK_IN: "bg-brand-soft text-brand",
  KIOSK_APPROVAL_REQUESTED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  VISITOR_APPROVED: "bg-brand-soft text-brand",
  VISITOR_DECLINED: "bg-red-500/10 text-red-600 dark:text-red-400",
  KIOSK_CHECKOUT_REQUESTED: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  VISITOR_CLEARANCE_APPROVED: "bg-brand-soft text-brand",
  VISITOR_CLEARANCE_DECLINED: "bg-red-500/10 text-red-600 dark:text-red-400",
  VISITOR_SIGN_OUT: "bg-slate-500/10 text-soft",
  VISITOR_CHECK_OUT: "bg-slate-500/10 text-soft",
  VISITOR_AUTO_CHECK_OUT: "bg-slate-500/10 text-soft",
  VISITOR_OVERSTAY: "bg-red-500/10 text-red-600 dark:text-red-400",
  DATA_RETENTION_RUN: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  RESIDENT_COMPANY_ADDED: "bg-brand-soft text-brand",
  RESIDENT_COMPANY_UPDATED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  RESIDENT_COMPANY_REMOVED: "bg-red-500/10 text-red-600 dark:text-red-400",
  REPORTS_VIEW: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  PII_UNLOCKED: "bg-red-500/10 text-red-600 dark:text-red-400",
  EMERGENCY_ACTIVATED: "bg-red-500/10 text-red-600 dark:text-red-400",
  EMERGENCY_DEACTIVATED: "bg-slate-500/10 text-soft",
  EMERGENCY_EVACUATION: "bg-red-500/10 text-red-600 dark:text-red-400",
  USER_INVITED: "bg-brand-soft text-brand",
  USER_UPDATED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  USER_REMOVED: "bg-red-500/10 text-red-600 dark:text-red-400",
  USER_PASSWORD_RESET: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  DOCUMENT_CREATED: "bg-brand-soft text-brand",
  DOCUMENT_UPDATED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  DOCUMENT_REMOVED: "bg-red-500/10 text-red-600 dark:text-red-400",
  SETTINGS_UPDATED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  KIOSK_TOKEN_REGENERATED: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  KIOSK_CODE_REGENERATED: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  KIOSK_UNLOCK_FAILED: "bg-red-500/10 text-red-600 dark:text-red-400",
  USER_ROLE_CHANGED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  PRE_REGISTRATION_CREATED: "bg-brand-soft text-brand",
  PRE_REGISTRATION_DELETED: "bg-red-500/10 text-red-600 dark:text-red-400",
  EVENT_CREATED: "bg-brand-soft text-brand",
  EVENT_DELETED: "bg-red-500/10 text-red-600 dark:text-red-400",
  EVENT_UPDATED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  EVENT_LINK_REGENERATED: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  EVENT_REGISTRATION_ADDED: "bg-brand-soft text-brand",
  EVENT_REGISTRATION_REMOVED: "bg-red-500/10 text-red-600 dark:text-red-400",
  EVENT_REGISTRATION_SELF: "bg-brand-soft text-brand",
  EVENT_REGISTRATION_APPROVED: "bg-brand-soft text-brand",
  EVENT_REGISTRATION_DECLINED: "bg-red-500/10 text-red-600 dark:text-red-400",
  LOCATION_CREATED: "bg-brand-soft text-brand",
  LOCATION_UPDATED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  LOCATION_REMOVED: "bg-red-500/10 text-red-600 dark:text-red-400",
  PROFILE_UPDATED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  PASSWORD_CHANGED: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  SMS_CAMPAIGN_SENT: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  WATCHLIST_ADDED: "bg-brand-soft text-brand",
  WATCHLIST_REMOVED: "bg-slate-500/10 text-soft",
  WATCHLIST_MATCH: "bg-red-500/10 text-red-600 dark:text-red-400",
  USER_LOGIN: "bg-slate-500/10 text-soft",
};

type AuditEventRowProps = { event: AuditEvent; open: boolean; onToggle: () => void };

export function AuditEventRow({ event, open, onToggle }: AuditEventRowProps) {
  const detailsId = `audit-details-${event.id}`;

  return (
    <li className="rounded-xl border border-line bg-surface transition-colors hover:border-line-strong [box-shadow:var(--shadow)]">
      <div className="flex items-center justify-between gap-4 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tones[event.action] ?? "bg-slate-500/10 text-soft"}`}>
            <ZapIcon size={16} />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider">{event.action}</span>
              <span className="rounded bg-slate-500/10 px-1.5 py-0.5 text-[11px] font-medium text-soft">{event.category}</span>
              <span className="text-xs text-soft">
                {event.message.map((segment, index) =>
                  segment.strong ? (
                    <strong key={index} className="font-semibold text-fg">
                      {segment.text}
                    </strong>
                  ) : (
                    <span key={index}>{segment.text}</span>
                  ),
                )}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <UserIcon size={13} />
                <span className="font-medium text-soft">{event.actor.name}</span>
                {event.actor.role && (
                  <span className="rounded bg-slate-500/10 px-1 text-[10px] text-muted">{event.actor.role.replace(/ /g, "_")}</span>
                )}
              </span>
              <span className="flex items-center gap-1.5">
                <ClockIcon size={13} />
                {event.date} {event.time}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={detailsId}
          aria-label={open ? "Hide event details" : "Show event details"}
          className="shrink-0 cursor-pointer rounded p-1 text-muted transition hover:bg-surface-soft hover:text-fg"
        >
          <ChevronDownIcon size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <dl id={detailsId} className="grid gap-x-6 gap-y-3 border-t border-line px-4 py-3.5 text-xs sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Event ID" value={event.id} mono />
          <Detail label="Action" value={event.action} mono />
          <Detail label="Category" value={event.category} />
          <Detail label="Performed by" value={event.actor.role ? `${event.actor.name} · ${event.actor.role}` : event.actor.name} />
          <Detail label="Date & time" value={`${event.date} ${event.time}`} icon={<CalendarIcon size={13} />} />
          {event.location && <Detail label="Location" value={event.location} />}
        </dl>
      )}
    </li>
  );
}

function Detail({ label, value, mono, icon }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</dt>
      <dd className={`mt-1 flex items-center gap-1.5 break-all text-soft ${mono ? "font-mono text-[11px]" : ""}`}>
        {icon}
        {value}
      </dd>
    </div>
  );
}
