"use client";

import { useState } from "react";
import { KeyIcon, PencilIcon, RotateCcwIcon, TrashIcon } from "@/src/components/icons";
import { VisitorAvatar } from "@/src/components/dashboard/visitor-avatar";
import type { User } from "@/src/lib/mock-users";
import { BranchBadge, RoleBadge } from "./role-badges";

type UserTableProps = {
  rows: User[];
  totalUsers: number;
  /** Hides the action buttons for people who can't manage users */
  readOnly?: boolean;
  /** The signed-in user's row: they can't remove themselves */
  selfId?: string;
  onEdit: (user: User) => void;
  onResetPassword: (user: User) => void;
  onResendInvite: (user: User) => void;
  onDelete: (user: User) => void;
};

const th = "px-4 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-muted";
const iconAction = "rounded p-1.5 text-muted transition hover:bg-surface-soft hover:text-fg";

export function UserTable({ rows, totalUsers, readOnly = false, selfId, onEdit, onResetPassword, onResendInvite, onDelete }: UserTableProps) {
  // Remove asks for a second click before anything is deleted
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-line bg-surface-soft">
            <th scope="col" className={`${th} pl-6`}>User</th>
            <th scope="col" className={th}>Role</th>
            <th scope="col" className={th}>Location</th>
            <th scope="col" className={th}>Joined</th>
            <th scope="col" className={th}>Last Active</th>
            {!readOnly && <th scope="col" className={`${th} pr-6 text-right`}>Actions</th>}
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
                    <div className="max-w-[320px] truncate text-[11px] text-muted" title={user.email}>
                      {user.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <RoleBadge role={user.role} />
              </td>
              <td className="px-4 py-3.5">
                <BranchBadge branch={user.branch} />
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-soft">{user.joined}</td>
              <td className="whitespace-nowrap px-4 py-3.5">
                {user.lastActive ? <span className="font-medium text-soft">{user.lastActive}</span> : <span className="italic text-muted">Never</span>}
              </td>
              {!readOnly && (
              <td className="py-3.5 pl-4 pr-6 text-right">
                {confirmingId === user.id ? (
                  <div className="inline-flex items-center gap-1.5">
                    <span className="text-[11px] text-soft">Remove?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(user);
                        setConfirmingId(null);
                      }}
                      className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white transition hover:bg-red-700"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      className="rounded border border-line-strong px-2 py-0.5 text-[11px] font-medium text-soft transition hover:bg-surface-soft"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1">
                    <button type="button" title="Edit user" aria-label={`Edit ${user.name}`} onClick={() => onEdit(user)} className={iconAction}>
                      <PencilIcon size={15} />
                    </button>
                    <button type="button" title="Reset password" aria-label={`Reset password for ${user.name}`} onClick={() => onResetPassword(user)} className={iconAction}>
                      <KeyIcon size={15} />
                    </button>
                    <button type="button" title="Resend invite" aria-label={`Resend invite to ${user.name}`} onClick={() => onResendInvite(user)} className={iconAction}>
                      <RotateCcwIcon size={15} />
                    </button>
                    {user.id !== selfId && (
                      <button
                        type="button"
                        title="Remove user"
                        aria-label={`Remove ${user.name}`}
                        onClick={() => setConfirmingId(user.id)}
                        className="rounded p-1.5 text-red-500 transition hover:bg-red-500/10 hover:text-red-600"
                      >
                        <TrashIcon size={15} />
                      </button>
                    )}
                  </div>
                )}
              </td>
              )}
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={readOnly ? 5 : 6} className="px-5 py-14 text-center text-muted">
                {totalUsers === 0 ? "No users yet. Click Invite User to add one." : "No users match that search."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
