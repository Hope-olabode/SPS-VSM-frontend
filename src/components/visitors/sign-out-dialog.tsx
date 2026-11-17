"use client";

import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { SignaturePad } from "@/src/components/check-in/signature-pad";
import { CloseIcon, LogoutIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

type SignOutDialogProps = {
  /** Who is leaving, shown under the title */
  visitorName: string;
  onClose: () => void;
  /** Sends the check-out. Resolves with an error message to show, or null when it worked (the dialog is closed by the caller). */
  onConfirm: (signature: string) => Promise<string | null>;
};

/** "Visitor Sign-Out": the visitor signs on the pad to confirm they are leaving, then staff confirm the check-out. */
export function SignOutDialog({ visitorName, onClose, onConfirm }: SignOutDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  /** only show "Signature is required" after they tried to confirm without signing */
  const [triedEmpty, setTriedEmpty] = useState(false);

  // keep Tab inside the dialog, move focus into it, and give it back on close
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && !submitting) {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const items = [...(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
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

  async function confirm() {
    if (submitting) return;
    if (!signature) {
      setTriedEmpty(true);
      return;
    }
    setSubmitting(true);
    setError("");
    const problem = await onConfirm(signature);
    // on success the caller closes (unmounts) this dialog
    if (problem) {
      setError(problem);
      setSubmitting(false);
    }
  }

  return (
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
      className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/65 p-5 backdrop-blur-[6px]"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className="my-auto w-full max-w-[600px] overflow-hidden rounded-[20px] border border-line bg-surface shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-5">
          <h2 id={titleId} className="flex items-center gap-2.5 text-lg font-bold tracking-[-0.02em]">
            <LogoutIcon size={20} />
            Visitor Sign-Out
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="grid h-[34px] w-[34px] place-items-center rounded-lg text-soft hover:bg-surface-soft hover:text-fg disabled:opacity-45"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="mb-3 text-[13px] text-soft">
            <span className="font-semibold text-fg">{visitorName}</span>: please sign below to confirm departure.
          </p>
          <SignaturePad
            value={signature}
            onChange={(next) => {
              setSignature(next);
              if (next) setTriedEmpty(false);
            }}
          />
          {triedEmpty && !signature && (
            <p role="alert" className="mt-3 text-[13px] text-red-600 dark:text-red-400">
              Signature is required to complete check-out
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-600 dark:text-red-300">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-line px-6 py-4">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void confirm()} loading={submitting} disabled={!signature}>
            {!submitting && <LogoutIcon size={16} />}
            Confirm Check-Out
          </Button>
        </div>
      </div>
    </div>
  );
}
