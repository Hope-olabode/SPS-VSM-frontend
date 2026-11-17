"use client";

import { type FormEvent, useState } from "react";
import { api, errorMessage } from "@/src/lib/api";
import { LockIcon } from "../icons";
import { Button } from "../ui/button";
import { inputClass } from "../ui/field";

/**
 * The first screen of every kiosk. Nothing about the location is loaded or shown until the tablet is given
 * the location's 6-digit kiosk code (an admin sees it on the Locations page and in the Control Panel).
 */
export function KioskCodeGate({ token, message, onUnlock }: { token: string; message?: string; onUnlock: () => void }) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(message ?? "");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (code.length !== 6 || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await api("/kiosk/unlock", { method: "POST", body: { code }, headers: { "x-kiosk-token": token }, redirectOn401: false });
      setCode("");
      onUnlock();
    } catch (err) {
      setError(errorMessage(err, "Couldn't check the code. Please try again."));
      setCode("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto my-auto w-full max-w-[420px] rounded-2xl border border-line bg-surface p-7 text-center [box-shadow:var(--shadow)]">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">
        <LockIcon size={28} />
      </span>
      <h1 className="mt-4 text-[22px] font-bold tracking-[-0.035em]">Enter the kiosk code</h1>
      <p className="mt-1.5 text-sm text-soft">This kiosk is locked. Ask an admin for the 6-digit code for this location.</p>

      <label htmlFor="kiosk-code" className="sr-only">
        Kiosk code
      </label>
      <input
        id="kiosk-code"
        name="kiosk-code"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        autoFocus
        maxLength={6}
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
        placeholder="••••••"
        className={`${inputClass} mt-6 h-14 text-center font-mono text-2xl tracking-[0.5em]`}
      />

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      <Button type="submit" disabled={code.length !== 6} loading={submitting} className="mt-6 min-h-[52px] w-full text-base">
        {submitting ? "Checking…" : "Unlock kiosk"}
      </Button>
    </form>
  );
}
