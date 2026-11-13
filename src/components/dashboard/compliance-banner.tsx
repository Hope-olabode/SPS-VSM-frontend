"use client";

import { useState } from "react";
import { CloseIcon, InfoIcon } from "../../components/icons";

export function ComplianceBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <section className="mb-[23px] flex items-start gap-2.5 rounded-lg border border-green-600/20 bg-green-600/[0.06] px-[13px] py-[11px] text-xs leading-[1.55] text-soft">
      <InfoIcon size={17} className="mt-px shrink-0 text-brand" />
      <div className="flex-1">
        <strong className="block font-semibold text-fg sm:inline">
          Compliance Notice: Visitor Data Privacy (NDPA 2023)
        </strong>
        <span className="mx-[9px] hidden h-3 w-px bg-line-strong align-middle sm:inline-block" />
        <span>
          Visitor phone numbers and emails are now protected with default masking under NDPA 2023 regulations.
          Authorized admins can reveal records on demand using the Unlock button. Each access event is recorded in
          your organization&apos;s Security Audit Trail.
        </span>
      </div>
      <button type="button" onClick={() => setVisible(false)} aria-label="Dismiss notice" className="p-0.5 text-muted hover:text-fg">
        <CloseIcon size={16} />
      </button>
    </section>
  );
}