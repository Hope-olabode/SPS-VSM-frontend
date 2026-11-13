import { ClockIcon, PinIcon } from "@/src/components/icons";
import { VisitorAvatar } from "@/src/components/dashboard/visitor-avatar";
import { StatusBadge, TypeBadge } from "@/src/components/visitors/badges";
import { CURRENT_LOCATION } from "@/src/lib/mock-events";
import { formatPhone, type Visitor } from "@/src/lib/mock-visitors";

const th = "px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted";

export const locationOf = (visitor: Visitor) => visitor.clearance?.location ?? CURRENT_LOCATION;

/** Full phone numbers are shown on purpose: during a roll-call staff need to be able to reach people. */
export function RosterTable({ rows }: { rows: Visitor[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-line bg-surface-soft">
            <th scope="col" className={`${th} pl-6`}>Visitor</th>
            <th scope="col" className={th}>Company</th>
            <th scope="col" className={th}>Type</th>
            <th scope="col" className={th}>Host</th>
            <th scope="col" className={th}>Location</th>
            <th scope="col" className={th}>Checked In</th>
            <th scope="col" className={`${th} pr-6`}>Duration</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-line">
          {rows.map((visitor) => (
            <tr key={visitor.id} className="transition-colors hover:bg-surface-soft">
              <td className="py-3.5 pl-6 pr-4">
                <div className="flex items-center gap-3">
                  <VisitorAvatar name={visitor.name} size="md" />
                  <div>
                    <div className="whitespace-nowrap font-medium">{visitor.name}</div>
                    <div className="text-[11px] text-muted">{visitor.phone ? formatPhone(visitor.phone) : "No phone on file"}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5 text-soft">{visitor.company || <span className="text-muted">-</span>}</td>
              <td className="px-4 py-3.5">
                <TypeBadge type={visitor.type} />
              </td>
              <td className="px-4 py-3.5 text-soft">{visitor.host}</td>
              <td className="px-4 py-3.5">
                <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand">
                  <PinIcon size={12} />
                  {locationOf(visitor)}
                </span>
                {visitor.status === "pending_clearance" && (
                  <span className="ml-2 align-middle">
                    <StatusBadge status="pending_clearance" />
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-soft">
                {visitor.checkIn.date} <span className="text-muted">{visitor.checkIn.time}</span>
              </td>
              <td className="whitespace-nowrap py-3.5 pl-4 pr-6 text-soft">
                <span className="inline-flex items-center gap-1">
                  <ClockIcon size={13} className="text-muted" />
                  {visitor.duration}
                </span>
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-5 py-14 text-center text-muted">
                No one is onsite right now.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
