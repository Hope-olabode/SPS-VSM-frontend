"use client";

import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { CloseIcon, DownloadIcon, PrinterIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { QrImage } from "@/src/components/ui/qr-image";
import { formatExpectedDate, type PreRegistration } from "@/src/lib/mock-preregistrations";
import { qrToPngDataUrl, qrToSvg } from "@/src/lib/qr";
import { PreRegStatusBadge } from "./prereg-status-badge";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);

/** Prints just the pass (not the dashboard) by writing it into a hidden frame. */
function printPass(item: PreRegistration) {
  const when = `${formatExpectedDate(item.expectedDate)}${item.expectedTime ? `, ${item.expectedTime}` : ""}`;
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) return frame.remove();

  doc.open();
  doc.write(`<!doctype html><html><head><title>Visitor pass ${escapeHtml(item.qrCode)}</title><style>
    body{font-family:system-ui,sans-serif;text-align:center;margin:0;padding:48px 24px;color:#111}
    h1{font-size:22px;margin:0 0 4px}p{margin:4px 0;font-size:15px;color:#444}
    .qr{width:300px;height:300px;margin:28px auto 12px}.qr svg{width:100%;height:100%}
    .code{font:600 22px ui-monospace,Menlo,monospace;letter-spacing:.08em;color:#111}.hint{margin-top:28px;font-size:13px;color:#666}
  </style></head><body>
    <h1>${escapeHtml(item.name)}</h1>
    <p>Visiting ${escapeHtml(item.residentCompany)}</p><p>${escapeHtml(when)}</p>
    <div class="qr">${qrToSvg(item.qrCode, `QR code ${item.qrCode}`)}</div>
    <div class="code">${escapeHtml(item.qrCode)}</div>
    <p class="hint">Please show this pass at the front desk when you arrive.</p>
  </body></html>`);
  doc.close();
  // give the frame a moment to lay out before the print sheet opens, and clean up afterwards
  setTimeout(() => {
    win.focus();
    win.print();
    setTimeout(() => frame.remove(), 1500);
  }, 150);
}

type PassModalProps = { item: PreRegistration; onClose: () => void };

/** The visitor's pass: a QR code staff can scan at check-in, to show on screen, download as a picture or print. */
export function PreRegPassModal({ item, onClose }: PassModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [problem, setProblem] = useState("");

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

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const items = [...(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter((node) => node.offsetParent !== null);
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

  function download() {
    try {
      const link = document.createElement("a");
      link.href = qrToPngDataUrl(item.qrCode, 720);
      link.download = `visitor-pass-${item.qrCode}.png`;
      link.click();
      setProblem("");
    } catch {
      setProblem("Couldn't save the picture. Try Print instead.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
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
        className="max-h-full w-full max-w-[400px] overflow-y-auto rounded-2xl border border-line bg-surface p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-center justify-between">
          <h2 id={titleId} className="text-base font-bold tracking-tight">
            Visitor pass
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close visitor pass"
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface-soft hover:text-fg"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="mt-5 flex justify-center">
          <QrImage value={item.qrCode} size={230} />
        </div>
        <p className="mt-3 font-mono text-lg font-semibold tracking-[0.08em]">{item.qrCode}</p>

        <p className="mt-4 break-words text-[15px] font-semibold">{item.name}</p>
        <p className="mt-1 text-xs text-soft">
          Visiting {item.residentCompany}
          <span className="block">
            {formatExpectedDate(item.expectedDate)}
            {item.expectedTime ? `, ${item.expectedTime}` : ""}
          </span>
        </p>
        <div className="mt-2.5 flex justify-center">
          <PreRegStatusBadge status={item.status} />
        </div>

        {problem && (
          <p role="alert" className="mt-3 text-xs text-red-500">
            {problem}
          </p>
        )}

        <div className="mt-5 flex justify-center gap-2.5">
          <Button variant="secondary" onClick={download}>
            <DownloadIcon size={14} /> Download
          </Button>
          <Button variant="secondary" onClick={() => printPass(item)}>
            <PrinterIcon size={14} /> Print
          </Button>
        </div>
        <p className="mt-4 text-[11px] text-muted">Staff scan this at Check-In. The code can also be typed in.</p>
      </div>
    </div>
  );
}
