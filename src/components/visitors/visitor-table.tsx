import { EyeIcon, LogoutIcon } from "@/src/components/icons";
import { VisitorAvatar } from "@/src/components/dashboard/visitor-avatar";
import { formatPhone, maskPhone, type Visitor } from "@/src/lib/mock-visitors";
import { StatusBadge, TypeBadge } from "./badges";

type VisitorTableProps = {
  rows: Visitor[];
  selected: string[];
  unlocked: boolean;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
  /** host approval: let a waiting kiosk visitor in, or turn them away */
  onAdmit: (id: string) => void;
  onDeny: (id: string) => void;
  onSignOut: (id: string) => void;
  /** open the visitor details drawer */
  onView: (id: string) => void;
};

const th = "px-3 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted";
const iconAction = "rounded p-1 text-muted transition hover:bg-surface-soft hover:text-fg";

function Stamp({ value }: { value?: Visitor["checkIn"] }) {
  if (!value) return <span className="text-muted">-</span>;
  return (
    <span className="whitespace-nowrap text-soft">
      {value.date}
      <span className="block text-[11px] text-muted">{value.time}</span>
    </span>
  );
}

export function VisitorTable({ rows, selected, unlocked, onToggle, onToggleAll, onApprove, onDecline, onAdmit, onDeny, onSignOut, onView }: VisitorTableProps) {
  const allSelected = rows.length > 0 && rows.every((row) => selected.includes(row.id));
  const someSelected = rows.some((row) => selected.includes(row.id));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-line bg-surface-soft">
            <th scope="col" className="w-8 py-3.5 pl-4 pr-2">
              <input
                type="checkbox"
                aria-label="Select all visitors on this page"
                checked={allSelected}
                ref={(element) => {
                  if (element) element.indeterminate = someSelected && !allSelected;
                }}
                onChange={onToggleAll}
                className="h-3.5 w-3.5 cursor-pointer accent-green-600"
              />
            </th>
            <th scope="col" className={th}>Visitor</th>
            <th scope="col" className={th}>Company</th>
            <th scope="col" className={th}>Resident Company</th>
            <th scope="col" className={th}>Type</th>
            <th scope="col" className={th}>Host</th>
            <th scope="col" className={th}>Status</th>
            <th scope="col" className={th}>Check In</th>
            <th scope="col" className={th}>Check Out</th>
            <th scope="col" className={th}>Duration</th>
            <th scope="col" className={`${th} pr-4`}>Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-line">
          {rows.map((visitor) => (
            <tr
              key={visitor.id}
              className={`transition-colors hover:bg-surface-soft ${visitor.status === "pending_clearance" ? "bg-amber-500/[0.06]" : visitor.status === "pending_approval" ? "bg-blue-500/[0.06]" : ""}`}
            >
              <td className="py-3.5 pl-4 pr-2">
                <input
                  type="checkbox"
                  aria-label={`Select ${visitor.name}`}
                  checked={selected.includes(visitor.id)}
                  onChange={() => onToggle(visitor.id)}
                  className="h-3.5 w-3.5 cursor-pointer accent-green-600"
                />
              </td>
              <td className="px-3 py-3.5">
                <div className="flex items-center gap-3">
                  <VisitorAvatar name={visitor.name} size="md" />
                  <div>
                    <div className="whitespace-nowrap font-medium">{visitor.name}</div>
                    <div className="text-[11px] text-muted">{unlocked ? formatPhone(visitor.phone) : maskPhone(visitor.phone)}</div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3.5 text-soft">{visitor.company || <span className="text-muted">-</span>}</td>
              <td className="px-3 py-3.5">
                <span className="font-medium">{visitor.residentCompany}</span>
                {visitor.floor && <span className="ml-1 text-[11px] text-muted">({visitor.floor})</span>}
              </td>
              <td className="px-3 py-3.5">
                <TypeBadge type={visitor.type} />
              </td>
              <td className="px-3 py-3.5 text-soft">{visitor.host}</td>
              <td className="px-3 py-3.5">
                <StatusBadge status={visitor.status} />
                {visitor.overstay && (
                  <span className="ml-1.5 whitespace-nowrap rounded-full border border-red-500/25 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-600 dark:text-red-400">Overstay</span>
                )}
                {visitor.autoCheckedOut && <span className="mt-1 block text-[11px] text-muted">Checked out automatically</span>}
              </td>
              <td className="px-3 py-3.5">
                <Stamp value={visitor.checkIn} />
              </td>
              <td className="px-3 py-3.5">
                <Stamp value={visitor.checkOut} />
              </td>
              <td className="whitespace-nowrap px-3 py-3.5 text-soft">{visitor.duration}</td>
              <td className="py-3.5 pl-3 pr-4">
                <div className="flex items-center gap-1.5">
                  <button type="button" title="View details" aria-label={`View ${visitor.name}`} onClick={() => onView(visitor.id)} className={iconAction}>
                    <EyeIcon size={16} />
                  </button>

                  {visitor.status === "onsite" && (
                    <button
                      type="button"
                      title="Sign out visitor"
                      aria-label={`Sign out ${visitor.name}`}
                      onClick={() => onSignOut(visitor.id)}
                      className={iconAction}
                    >
                      <LogoutIcon size={16} />
                    </button>
                  )}

                  {visitor.status === "pending_approval" && (
                    <>
                      <button
                        type="button"
                        onClick={() => onAdmit(visitor.id)}
                        className="rounded bg-green-600 px-2 py-0.5 text-[11px] font-medium text-white transition hover:bg-green-700"
                      >
                        Let in
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeny(visitor.id)}
                        className="rounded border border-red-200 px-2 py-0.5 text-[11px] font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {visitor.status === "pending_clearance" && (
                    <>
                      <button
                        type="button"
                        onClick={() => onApprove(visitor.id)}
                        className="rounded bg-green-600 px-2 py-0.5 text-[11px] font-medium text-white transition hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => onDecline(visitor.id)}
                        className="rounded border border-red-200 px-2 py-0.5 text-[11px] font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        Decline
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={11} className="px-5 py-14 text-center text-muted">
                No visitors match these filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}