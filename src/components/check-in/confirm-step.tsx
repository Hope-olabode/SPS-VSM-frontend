"use client";

import { useEffect, useState } from "react";
import { api, type ApiDocument, type ApiDocumentList } from "@/src/lib/api";
import { ArrowLeftIcon, CheckIcon } from "../icons";
import { Button } from "../ui/button";
import { SignaturePad } from "./signature-pad";
import type { VisitorForm } from "./types";

type ConfirmStepProps = {
  visitor: VisitorForm;
  signature: string | null;
  /** From the Control Panel: when false the visitor can be checked in without signing */
  signatureRequired: boolean;
  onSignatureChange: (dataUrl: string | null) => void;
  onBack: () => void;
  onFinish: () => void;
  /** True while the check-in is being saved */
  submitting?: boolean;
  /** Pass the documents in (the kiosk does) to skip loading them from GET /api/documents, which needs a signed-in user */
  documents?: Pick<ApiDocument, "id" | "title" | "content">[];
};

export function ConfirmStep({ visitor, signature, signatureRequired, onSignatureChange, onBack, onFinish, submitting = false, documents: given }: ConfirmStepProps) {
  // the documents this signature covers: the server records it against every active one that needs a signature
  const [loaded, setLoaded] = useState<Pick<ApiDocument, "id" | "title" | "content">[]>([]);
  const documents = given ?? loaded;
  useEffect(() => {
    if (given) return;
    let cancelled = false;
    api<ApiDocumentList>("/documents")
      .then((data) => {
        if (!cancelled) setLoaded(data.items.filter((doc) => doc.active && doc.requireSignature));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [given]);

  const rows = [
    ["Visitor", `${visitor.firstName} ${visitor.lastName}`],
    ["Phone", `${visitor.phoneCode} ${visitor.phone}`],
    ["Company", visitor.company],
    ["Visitor type", visitor.visitorType],
    ["Resident company", visitor.residentCompany],
    ["Visiting", visitor.host],
    ["Purpose", visitor.purpose],
  ].filter(([, value]) => value.trim());

  return (
    <div>
      <h3 className="mb-6 text-base font-semibold">Confirm Check-In</h3>

      <div className="flex items-center gap-3.5 rounded-lg border border-green-600/30 bg-green-600/[0.08] p-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-green-600 text-white">
          <CheckIcon size={24} />
        </span>
        <div>
          <strong className="font-semibold">Visitor details are ready</strong>
          <p className="mt-1 text-sm text-soft">Review the details, then ask the visitor to sign below.</p>
        </div>
      </div>

      <dl className="mt-5 divide-y divide-line rounded-lg border border-line text-[13px]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      {documents.length > 0 && (
        <div className="mt-6 space-y-2.5">
          <h4 className="text-[13px] font-semibold">Please read before signing</h4>
          {documents.map((doc) => (
            <details key={doc.id} className="rounded-lg border border-line text-[13px]">
              <summary className="cursor-pointer px-4 py-3 font-medium">{doc.title}</summary>
              <div className="max-h-48 overflow-y-auto whitespace-pre-wrap border-t border-line px-4 py-3 text-soft">{doc.content}</div>
            </details>
          ))}
        </div>
      )}

      <div className="mt-6">
        <SignaturePad value={signature} onChange={onSignatureChange} />
        <p className="mt-2 text-[11px] text-muted">By signing, the visitor confirms the details above are correct{documents.length > 0 && " and agrees to the documents listed above"}.{!signatureRequired && " Signing is optional for this location."}</p>
      </div>

      <div className="mt-6 flex justify-between gap-3">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeftIcon size={16} /> Back
        </Button>
        <Button onClick={onFinish} disabled={(signatureRequired && !signature) || submitting}>
          <CheckIcon size={16} /> {submitting ? "Checking in…" : "Complete Check-In"}
        </Button>
      </div>
    </div>
  );
}