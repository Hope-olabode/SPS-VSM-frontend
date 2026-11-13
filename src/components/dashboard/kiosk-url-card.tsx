"use client";

import { useState } from "react";
import { CopyIcon, MonitorIcon } from "../icons";

export function KioskUrlCard({ url, code }: { url: string; code?: string | null }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard can be blocked (e.g. non-secure context); the URL is still selectable
    }
  }

  return (
    <section className="mb-5 flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 [box-shadow:var(--shadow)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="shrink-0 rounded-lg bg-brand-soft p-2 text-brand">
          <MonitorIcon size={20} />
        </span>
        <div className="min-w-0">
          <div className="text-xs font-bold">Your Branch Kiosk URL</div>
          <div className="mt-0.5 select-all break-all font-mono text-[11px] text-soft">{url}</div>
          {code && (
            <div className="mt-1.5 text-[11px] text-soft">
              Kiosk code: <span className="select-all font-mono text-xs font-bold tracking-[0.2em] text-fg">{code}</span>
              <span className="text-muted"> · enter it on the tablet to unlock the kiosk</span>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={copy}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-xs font-medium text-soft transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand"
      >
        <CopyIcon size={14} />
        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
      </button>
    </section>
  );
}