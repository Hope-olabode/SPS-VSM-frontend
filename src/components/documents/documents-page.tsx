"use client";

import { useCallback, useEffect, useState } from "react";
import { useLock } from "@/src/hooks/useLock";
import { DocumentIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { api, type ApiDocument, type ApiDocumentList, errorMessage } from "@/src/lib/api";
import type { NewDocument, VisitorDocument } from "@/src/lib/mock-documents";
import { DocumentCard } from "./document-card";
import { DocumentForm } from "./document-form";

const toDocument = ({ createdAt, ...rest }: ApiDocument): VisitorDocument => ({
  ...rest,
  createdOn: new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
});

export function DocumentsPage() {
  const [documents, setDocuments] = useState<VisitorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");

  // GET /api/documents
  const load = useCallback(
    () =>
      api<ApiDocumentList>("/documents")
        .then((data) => {
          setDocuments(data.items.map(toDocument));
          setLoadError("");
        })
        .catch((err) => setLoadError(errorMessage(err, "Couldn't load the documents.")))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // the toast disappears by itself
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  /** POST /api/documents. Returns an error message for the form, or null when saved. */
  async function createDocument(values: NewDocument): Promise<string | null> {
    try {
      const { item } = await api<{ item: ApiDocument }>("/documents", { method: "POST", body: values });
      // newest first, so the new document is the first thing the person sees
      setDocuments((current) => [toDocument(item), ...current]);
      setCreating(false);
      setNotice(`"${item.title}" was created`);
      return null;
    } catch (err) {
      return errorMessage(err);
    }
  }

  /** PATCH /api/documents/:id */
  const { run } = useLock();

  function toggleActive(id: string) {
    const target = documents.find((item) => item.id === id);
    if (!target) return Promise.resolve();
    return run(async () => {
      try {
        const { item } = await api<{ item: ApiDocument }>(`/documents/${encodeURIComponent(id)}`, { method: "PATCH", body: { active: !target.active } });
        setDocuments((current) => current.map((doc) => (doc.id === id ? toDocument(item) : doc)));
      } catch (err) {
        setNotice(errorMessage(err));
      }
    });
  }

  /** DELETE /api/documents/:id */
  function remove(id: string) {
    const target = documents.find((item) => item.id === id);
    if (!target) return Promise.resolve();
    return run(async () => {
      try {
        await api(`/documents/${encodeURIComponent(id)}`, { method: "DELETE" });
        setDocuments((current) => current.filter((item) => item.id !== id));
        setNotice(`"${target.title}" was removed`);
      } catch (err) {
        setNotice(errorMessage(err));
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-[7px] text-[21px] font-bold leading-tight tracking-[-0.035em] sm:text-[25px]">Documents &amp; NDAs</h1>
          <p className="text-xs text-soft">Manage documents that visitors must review and sign during check-in</p>
        </div>

        <Button onClick={() => setCreating((value) => !value)} aria-expanded={creating}>
          <DocumentIcon size={15} />
          {creating ? "Cancel" : "Create Document"}
        </Button>
      </div>

      {creating && <DocumentForm onSave={createDocument} onCancel={() => setCreating(false)} />}

      <section className="space-y-2.5" aria-label="Documents">
        {loadError && (
          <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-5 py-4 text-center text-xs text-red-600 dark:text-red-300">
            <p className="mb-2">{loadError}</p>
            <button type="button" onClick={() => void load()} className="font-semibold text-brand hover:text-brand-hover">
              Try again
            </button>
          </div>
        )}

        {loading && (
          <p role="status" className="px-5 py-12 text-center text-xs text-muted">
            Loading documents…
          </p>
        )}

        {documents.map((document) => (
          <DocumentCard key={document.id} document={document} onToggleActive={toggleActive} onDelete={remove} />
        ))}

        {!loading && !loadError && documents.length === 0 && !creating && (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <DocumentIcon size={60} strokeWidth={1.2} className="mb-4 text-line-strong" />
            <h2 className="text-lg font-bold tracking-tight">No documents yet</h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-soft">
              Create NDA templates, safety briefings, or Wi-Fi policies that visitors must sign during check-in.
            </p>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="mt-8 flex h-[92px] w-full max-w-[360px] cursor-pointer items-center justify-center gap-4 rounded-2xl bg-brand px-6 text-white shadow-[0_10px_24px_rgba(22,163,74,0.25)] transition hover:-translate-y-px hover:bg-brand-hover dark:text-[#04130a]"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15">
                <DocumentIcon size={24} />
              </span>
              <span className="text-[15px] font-semibold">Create Your First Document</span>
            </button>
          </div>
        )}
      </section>

      <p
        role="status"
        aria-live="polite"
        className={notice ? "fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-fg px-4 py-2.5 text-xs font-medium text-surface shadow-lg" : "sr-only"}
      >
        {notice}
      </p>
    </div>
  );
}
