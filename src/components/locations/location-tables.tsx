import { VisitorAvatar } from "@/src/components/dashboard/visitor-avatar";
import { RoleBadge } from "@/src/components/users/role-badges";
import { StatusBadge, TypeBadge } from "@/src/components/visitors/badges";
import type { User } from "@/src/lib/mock-users";
import type { Visitor } from "@/src/lib/mock-visitors";

const th = "px-4 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-muted";

function Empty({ colSpan, children }: { colSpan: number; children: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-14 text-center text-muted">
        {children}
      </td>
    </tr>
  );
}

/** The people assigned to one location. */
export function TeamTable({ rows, emptyText }: { rows: User[]; emptyText: string }) {
  return (
    <div className="max-h-[440px] overflow-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-xs">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-line bg-surface-soft">
            <th scope="col" className={`${th} pl-6`}>User</th>
            <th scope="col" className={th}>Role</th>
            <th scope="col" className={th}>Joined</th>
            <th scope="col" className={`${th} pr-6`}>Last Active</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((user) => (
            <tr key={user.id} className="transition-colors hover:bg-surface-soft">
              <td className="py-3.5 pl-6 pr-4">
                <div className="flex items-center gap-3">
                  <VisitorAvatar name={user.name} size="md" />
                  <div className="min-w-0">
                    <div className="font-semibold">{user.name}</div>
                    <div className="max-w-[300px] truncate text-[11px] text-muted" title={user.email}>
                      {user.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <RoleBadge role={user.role} />
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-soft">{user.joined}</td>
              <td className="whitespace-nowrap py-3.5 pl-4 pr-6">
                {user.lastActive ? <span className="font-medium text-soft">{user.lastActive}</span> : <span className="italic text-muted">Never</span>}
              </td>
            </tr>
          ))}
          {rows.length === 0 && <Empty colSpan={4}>{emptyText}</Empty>}
        </tbody>
      </table>
    </div>
  );
}

/** The visitors who checked in at one location. */
export function VisitorsTable({ rows, emptyText }: { rows: Visitor[]; emptyText: string }) {
  return (
    <div className="max-h-[440px] overflow-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-xs">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-line bg-surface-soft">
            <th scope="col" className={`${th} pl-6`}>Visitor</th>
            <th scope="col" className={th}>Type</th>
            <th scope="col" className={th}>Host</th>
            <th scope="col" className={th}>Checked in</th>
            <th scope="col" className={`${th} pr-6`}>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((visitor) => (
            <tr key={visitor.id} className="transition-colors hover:bg-surface-soft">
              <td className="py-3.5 pl-6 pr-4">
                <div className="flex items-center gap-3">
                  <VisitorAvatar name={visitor.name} size="md" />
                  <div className="min-w-0">
                    <div className="font-semibold">{visitor.name}</div>
                    <div className="max-w-[260px] truncate text-[11px] text-muted">{visitor.residentCompany}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <TypeBadge type={visitor.type} />
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-soft">{visitor.host}</td>
              <td className="whitespace-nowrap px-4 py-3.5 text-soft">
                {visitor.checkIn.date} · {visitor.checkIn.time}
              </td>
              <td className="py-3.5 pl-4 pr-6">
                <StatusBadge status={visitor.status} />
              </td>
            </tr>
          ))}
          {rows.length === 0 && <Empty colSpan={5}>{emptyText}</Empty>}
        </tbody>
      </table>
    </div>
  );
}
