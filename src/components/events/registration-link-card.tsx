"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { CopyIcon, RotateCcwIcon, ShareIcon } from "../icons";

type RegistrationLinkCardProps = {
  url: string;
  requireApproval: boolean;
  /** Makes a new link; the old one stops working. Rejects when the server says no. */
  onRegenerate: () => Promise<void>;
};

/** The public link anyone can use to register for the event without signing in */
export function RegistrationLinkCard({ url, requireApproval, onRegenerate }: RegistrationLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard can be blocked (e.g. non-secure context); the link is still selectable
    }
  }

  async function regenerate() {
    setBusy(true);
    try {
      await onRegenerate();
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <section aria-label="Registration link" className="rounded-xl border border-line bg-surface p-4 [box-shadow:var(--shadow)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="shrink-0 rounded-lg bg-brand-soft p-2 text-brand">
            <ShareIcon size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="text-xs font-bold">Registration link</h2>
            <div className="mt-0.5 select-all break-all font-mono text-[11px] text-soft">{url}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={copy}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-xs font-medium text-soft transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand"
        >
          <CopyIcon size={14} />
          <span aria-live="polite">{copied ? "Copied" : "Copy link"}</span>
        </button>
      </div>

      <p className="mt-3 text-[11px] text-soft">
        Anyone with this link can register without signing in.{" "}
        {requireApproval ? "Their sign-ups wait in the list below until you approve them." : "Their sign-ups are confirmed straight away."}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        {confirming ? (
          <>
            <span className="text-[11px] text-soft">The old link will stop working. Make a new one?</span>
            <Button variant="danger" className="!min-h-0 px-2.5 py-1 text-[11px]" onClick={regenerate} disabled={busy}>
              {busy ? "Working…" : "Yes, make a new link"}
            </Button>
            <Button variant="ghost" className="!min-h-0 px-2.5 py-1 text-[11px]" onClick={() => setConfirming(false)} disabled={busy}>
              Keep it
            </Button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-soft transition hover:text-fg">
            <RotateCcwIcon size={13} />
            Make a new link
          </button>
        )}
      </div>
    </section>
  );
}
