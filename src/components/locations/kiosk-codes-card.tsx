"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyIcon, RotateCcwIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { api, type ApiKioskCode, errorMessage } from "@/src/lib/api";

/**
 * Global admins only: every location's kiosk code in one place. A tablet opens the kiosk link, then asks for this
 * 6-digit code before it shows anything, so give the code to whoever sets the tablet up (it is not part of the link).
 */
export function KioskCodesCard() {
  const [items, setItems] = useState<ApiKioskCode[] | null>(null);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [confirmingId, setConfirmingId] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(() => {
    api<{ items: ApiKioskCode[] }>("/locations/kiosk-codes")
      .then((data) => {
        setItems(data.items);
        setError("");
      })
      .catch((err) => setError(errorMessage(err, "Couldn't load the kiosk codes.")));
  }, []);

  useEffect(load, [load]);

  async function copy(item: ApiKioskCode) {
    if (!item.code) return;
    try {
      await navigator.clipboard.writeText(item.code);
      setCopiedId(item.locationId);
      window.setTimeout(() => setCopiedId((current) => (current === item.locationId ? "" : current)), 2000);
    } catch {
      // clipboard can be blocked; the code is still selectable
    }
  }

  async function regenerate(item: ApiKioskCode) {
    setConfirmingId("");
    setBusyId(item.locationId);
    try {
      const data = await api<{ code: string }>(`/locations/${encodeURIComponent(item.locationId)}/kiosk-code/regenerate`, { method: "POST" });
      setItems((current) => current?.map((entry) => (entry.locationId === item.locationId ? { ...entry, code: data.code } : entry)) ?? current);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Couldn't generate a new code."));
    } finally {
      setBusyId("");
    }
  }

  return (
    <section aria-label="Kiosk codes" className="overflow-hidden rounded-xl border border-line bg-surface [box-shadow:var(--shadow)]">
      <header className="flex items-start gap-3 border-b border-line px-5 py-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          <KeyIcon size={18} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Kiosk codes</h2>
          <p className="mt-0.5 text-xs text-soft">Each location&apos;s kiosk asks for its 6-digit code before it shows anything. Regenerating a code locks that location&apos;s tablets until the new one is entered.</p>
        </div>
      </header>

      {error && (
        <p role="alert" className="border-b border-line px-5 py-3 text-xs text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      {!items ? (
        !error && <p className="px-5 py-6 text-xs text-soft">Loading the kiosk codes…</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.locationId} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold">{item.name}</div>
                {!item.active && <div className="text-[11px] text-muted">Inactive</div>}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {item.code ? (
                  <span className="select-all rounded-lg border border-line-strong bg-surface-soft px-3 py-1.5 font-mono text-base font-bold tracking-[0.3em]">{item.code}</span>
                ) : (
                  <span className="text-[11px] text-muted">Can&apos;t be shown any more. Regenerate it.</span>
                )}
                <Button variant="secondary" className="!min-h-[34px] !px-3 !text-xs" disabled={!item.code} onClick={() => copy(item)}>
                  <span aria-live="polite">{copiedId === item.locationId ? "Copied" : "Copy"}</span>
                </Button>

                {confirmingId === item.locationId ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-soft">Replace it?</span>
                    <button type="button" onClick={() => regenerate(item)} className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white transition hover:bg-red-700">
                      Yes
                    </button>
                    <button type="button" onClick={() => setConfirmingId("")} className="rounded border border-line-strong px-2 py-0.5 text-[11px] font-medium text-soft transition hover:bg-surface-soft">
                      No
                    </button>
                  </div>
                ) : (
                  <Button variant="ghost" className="!min-h-[34px] !px-3 !text-xs" disabled={busyId === item.locationId} onClick={() => setConfirmingId(item.locationId)}>
                    <RotateCcwIcon size={14} />
                    Regenerate
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
