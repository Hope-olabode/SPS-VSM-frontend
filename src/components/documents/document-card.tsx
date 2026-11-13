"use client";

import { useState } from "react";
import { ClockIcon, DocumentIcon, TrashIcon } from "@/src/components/icons";
import type { VisitorDocument } from "@/src/lib/mock-documents";
import { ActiveBadge, DocumentTypeBadge } from "./document-badges";

type DocumentCardProps = {
  document: VisitorDocument;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
};

export function DocumentCard({ document, onToggleActive, onDelete }: DocumentCardProps) {
  // Remove asks for a second click before anything is deleted
  const [confirming, setConfirming] = useState(false);

  return (
    <article className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-line bg-surface p-4 transition hover:border-line-strong [box-shadow:var(--shadow)]">
      <div className="flex min-w-0 flex-1 items-start gap-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          <DocumentIcon size={18} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[13px] font-semibold">{document.title}</h3>
            <DocumentTypeBadge type={document.type} />
            <ActiveBadge active={document.active} />
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-soft">
            <span className="flex items-center gap-1">
              <ClockIcon size={12} className="text-muted" />
              Created {document.createdOn}
            </span>
            <span>{document.requireSignature ? "Signature required" : "Read only"}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-soft">{document.content}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {confirming ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-soft">Remove?</span>
            <button
              type="button"
              onClick={() => onDelete(document.id)}
              className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white transition hover:bg-red-700"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded border border-line-strong px-2 py-0.5 text-[11px] font-medium text-soft transition hover:bg-surface-soft"
            >
              No
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onToggleActive(document.id)}
              className="rounded-lg border border-line-strong px-2.5 py-1 text-[11px] font-semibold text-soft transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand"
            >
              {document.active ? "Deactivate" : "Activate"}
            </button>
            <button
              type="button"
              title="Remove document"
              aria-label={`Remove ${document.title}`}
              onClick={() => setConfirming(true)}
              className="rounded p-1.5 text-red-500 transition hover:bg-red-500/10 hover:text-red-600"
            >
              <TrashIcon size={16} />
            </button>
          </>
        )}
      </div>
    </article>
  );
}
