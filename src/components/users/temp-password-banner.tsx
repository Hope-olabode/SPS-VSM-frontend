"use client";

import { useState } from "react";
import { KeyIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";

export type Credentials = { name: string; email: string; password: string; kind: "created" | "reset" };

/**
 * The API makes a one-time password when a user is created or reset and sends it back once.
 * No email goes out yet, so the admin copies it from here and passes it on.
 */
export function TempPasswordBanner({ credentials, onDismiss }: { credentials: Credentials; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(credentials.password);
      setCopied(true);
    } catch {
      // the password is selectable on screen, so copying by hand still works
    }
  }

  return (
    <section role="status" aria-label="Temporary password" className="rounded-xl border border-brand/30 bg-brand-soft p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-brand">
            <KeyIcon size={16} />
            {credentials.kind === "created" ? `${credentials.name} was created` : `New password for ${credentials.name}`}
          </h2>
          <p className="mt-1 text-xs text-soft">
            Give them this temporary password to sign in with <b className="font-semibold text-fg">{credentials.email}</b>. It is only shown once and no email has been sent.
          </p>
          <code className="mt-3 inline-block select-all rounded-lg border border-line-strong bg-surface px-3 py-1.5 font-mono text-sm font-semibold tracking-wide text-fg">{credentials.password}</code>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" className="!min-h-[34px] !px-3 !text-xs" onClick={copy}>
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="ghost" className="!min-h-[34px] !px-3 !text-xs" onClick={onDismiss}>
            Done
          </Button>
        </div>
      </div>
    </section>
  );
}
