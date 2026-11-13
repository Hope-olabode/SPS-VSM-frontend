"use client";

import { useState } from "react";
import { MailIcon, QrCodeIcon, ShareIcon, TrashIcon } from "@/src/components/icons";
import { formatExpectedDate, type PreRegistration } from "@/src/lib/mock-preregistrations";
import { PreRegStatusBadge } from "./prereg-status-badge";

type PreRegTableProps = {
  rows: PreRegistration[];
  selected: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onShare: (item: PreRegistration) => void;
  /** show the pass: the QR code staff scan at check-in */
  onShowQr: (item: PreRegistration) => void;
  onDelete: (id: string) => void;
};

const th = "px-3 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted";
const iconAction = "rounded p-1 text-muted transition hover:bg-surface-soft hover:text-fg";

/** Opens the visitor's email app with the pass details filled in. */
function emailLink(item: PreRegistration) {
  const firstName = item.name.split(" ")[0];
  const subject = `Your visit to ${item.residentCompany}`;
  // an email link can't carry a picture, so it holds the code; the QR image is on the pass (QR button), to download, print or share
  const body = [
    `Hi ${firstName},`,
    "",
    `You're pre-registered to visit ${item.residentCompany} on ${formatExpectedDate(item.expectedDate)} at ${item.expectedTime}.`,
    `Your QR code: ${item.qrCode}`,
    "",
    "Please show it at the front desk when you arrive.",
  ].join("\n");
  return `mailto:${item.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function PreRegTable({ rows, selected, onToggle, onToggleAll, onShare, onShowQr, onDelete }: PreRegTableProps) {
  // Delete asks for a second click on the same row before anything is removed
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const allSelected = rows.length > 0 && rows.every((row) => selected.includes(row.id));
  const someSelected = rows.some((row) => selected.includes(row.id));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-line bg-surface-soft">
            <th scope="col" className="w-8 py-3.5 pl-4 pr-2">
              <input
                type="checkbox"
                aria-label="Select all pre-registrations on this page"
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
            <th scope="col" className={th}>Expected</th>
            <th scope="col" className={th}>Resident Company</th>
            <th scope="col" className={th}>Status</th>
            <th scope="col" className={th}>QR Code</th>
            <th scope="col" className={`${th} pr-4 text-center`}>Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-line">
          {rows.map((item) => {
            const confirming = confirmingId === item.id;
            return (
              <tr key={item.id} className="transition-colors hover:bg-surface-soft">
                <td className="py-3.5 pl-4 pr-2">
                  <input
                    type="checkbox"
                    aria-label={`Select ${item.name}`}
                    checked={selected.includes(item.id)}
                    onChange={() => onToggle(item.id)}
                    className="h-3.5 w-3.5 cursor-pointer accent-green-600"
                  />
                </td>
                <td className="px-3 py-3.5">
                  <div className="whitespace-nowrap font-medium">{item.name}</div>
                  <div className="text-[11px] text-muted">{item.email || (item.phone ? `${item.phoneCode ?? ""} ${item.phone}`.trim() : "")}</div>
                </td>
                <td className="px-3 py-3.5">
                  {item.company ? (
                    <>
                      <div className="text-fg">{item.company}</div>
                      {item.jobTitle && <div className="text-[11px] font-medium text-soft">{item.jobTitle}</div>}
                    </>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-3.5">
                  <div className="font-medium">{formatExpectedDate(item.expectedDate)}</div>
                  {item.expectedTime && <div className="text-[11px] text-muted">{item.expectedTime}</div>}
                </td>
                <td className="px-3 py-3.5 text-soft">{item.residentCompany}</td>
                <td className="px-3 py-3.5">
                  <PreRegStatusBadge status={item.status} />
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 font-mono text-[11px] text-soft">{item.qrCode}</td>
                <td className="py-3.5 pl-3 pr-4">
                  {confirming ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-[11px] text-soft">Delete?</span>
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(item.id);
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
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        title="Show QR code"
                        aria-label={`Show QR code for ${item.name}`}
                        onClick={() => onShowQr(item)}
                        className={iconAction}
                      >
                        <QrCodeIcon size={16} />
                      </button>
                      <button
                        type="button"
                        title="Share"
                        aria-label={`Share pass for ${item.name}`}
                        onClick={() => onShare(item)}
                        className={iconAction}
                      >
                        <ShareIcon size={16} />
                      </button>
                      {item.email && (
                        <a
                          href={emailLink(item)}
                          title="Email QR code"
                          aria-label={`Email QR code to ${item.name}`}
                          className={iconAction}
                        >
                          <MailIcon size={16} />
                        </a>
                      )}
                      <button
                        type="button"
                        title="Delete"
                        aria-label={`Delete pre-registration for ${item.name}`}
                        onClick={() => setConfirmingId(item.id)}
                        className={`${iconAction} hover:text-red-500`}
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}

          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="px-5 py-14 text-center text-muted">
                No pre-registrations match these filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
