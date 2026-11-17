"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLock } from "@/src/hooks/useLock";
import { PageLoader } from "@/src/components/ui/page-loader";
import { CloseIcon, DownloadIcon, UserPlusIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { Pagination } from "@/src/components/visitors/pagination";
import { api, type ApiPreRegistration, type ApiPreRegistrationList, errorMessage } from "@/src/lib/api";
import {
  formatExpectedDate,
  type NewPreRegistration,
  preRegStatuses,
  type PreRegistration,
} from "@/src/lib/mock-preregistrations";
import { emptyPreRegFilters, matchesPreRegFilters, type PreRegFilters as Filters } from "@/src/lib/prereg-filters";
import { PreRegFilters } from "./prereg-filters";
import { PreRegPassModal } from "./prereg-pass-modal";
import { PreRegForm } from "./prereg-form";
import { PreRegTable } from "./prereg-table";

const PAGE_SIZE = 15;

const statusLabel = (status: PreRegistration["status"]) => preRegStatuses.find((s) => s.value === status)?.label ?? status;

export function PreRegistrationPage() {
  const [items, setItems] = useState<PreRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filters, setFilters] = useState<Filters>(emptyPreRegFilters);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [adding, setAdding] = useState(false);
  const [passId, setPassId] = useState<string | null>(null);

  // GET /api/pre-registrations
  const load = useCallback(
    () =>
      api<ApiPreRegistrationList>("/pre-registrations")
        .then((data) => {
          setItems(data.items);
          setLoadError("");
        })
        .catch((err) => setLoadError(errorMessage(err, "Couldn't load the pre-registrations.")))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // the share confirmation disappears by itself
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const passItem = passId ? items.find((item) => item.id === passId) : undefined;
  const filtered = useMemo(() => items.filter((item) => matchesPreRegFilters(item, filters)), [items, filters]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateFilters(patch: Partial<Filters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  }

  function toggleRow(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleAllOnPage() {
    const ids = pageRows.map((row) => row.id);
    const allSelected = ids.every((id) => selected.includes(id));
    setSelected((current) => (allSelected ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])]));
  }

  /** POST /api/pre-registrations. Returns an error message for the form, or null when saved. */
  async function addItem(values: NewPreRegistration): Promise<string | null> {
    try {
      const { item } = await api<{ item: ApiPreRegistration }>("/pre-registrations", { method: "POST", body: values });
      // newest first, and clear the filters so the new row is visible
      setItems((current) => [item, ...current]);
      setFilters(emptyPreRegFilters);
      setPage(1);
      setAdding(false);
      setNotice(`${item.name} was pre-registered (${item.qrCode})`);
      setPassId(item.id); // show the new pass straight away
      return null;
    } catch (err) {
      return errorMessage(err);
    }
  }

  /** DELETE /api/pre-registrations/:id */
  const { run } = useLock();

  function deleteItem(id: string) {
    return run(async () => {
      try {
        await api(`/pre-registrations/${encodeURIComponent(id)}`, { method: "DELETE" });
        setItems((current) => current.filter((item) => item.id !== id));
        setSelected((current) => current.filter((item) => item !== id));
        setPassId((current) => (current === id ? null : current));
      } catch (err) {
        setNotice(errorMessage(err));
      }
    });
  }

  async function shareItem(item: PreRegistration) {
    const text = `Visitor pre-registration for ${item.name} at ${item.residentCompany}, ${formatExpectedDate(item.expectedDate)} ${item.expectedTime}. QR code: ${item.qrCode}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Visitor pre-registration", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setNotice(`Details for ${item.name} copied to the clipboard`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return; // person closed the share sheet
      setNotice(`Couldn't share automatically. The QR code is ${item.qrCode}`);
    }
  }

  function exportCsv() {
    const source = selected.length > 0 ? items.filter((item) => selected.includes(item.id)) : filtered;
    const header = ["Visitor", "Email", "Company", "Job Title", "Expected Date", "Expected Time", "Resident Company", "Status", "QR Code"];
    const lines = [
      header,
      ...source.map((item) => [
        item.name,
        item.email,
        item.company,
        item.jobTitle ?? "",
        formatExpectedDate(item.expectedDate),
        item.expectedTime,
        item.residentCompany,
        statusLabel(item.status),
        item.qrCode,
      ]),
    ].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","));

    // the BOM makes Excel read the file as UTF-8
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pre-registrations.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-[7px] text-[21px] font-bold leading-tight tracking-[-0.035em] sm:text-[25px]">Pre-Registration</h1>
          <p className="text-xs text-soft">
            {filtered.length} {filtered.length === 1 ? "record" : "records"}
            {selected.length > 0 && <span className="text-brand"> · {selected.length} selected</span>}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" onClick={exportCsv}>
            <DownloadIcon size={14} /> Export CSV
          </Button>
          <Button onClick={() => setAdding((value) => !value)} aria-expanded={adding}>
            {adding ? <CloseIcon size={15} /> : <UserPlusIcon size={15} />}
            {adding ? "Cancel" : "Pre-Register Visitor"}
          </Button>
        </div>
      </div>

      {adding && <PreRegForm onSave={addItem} onCancel={() => setAdding(false)} />}

      <PreRegFilters filters={filters} onChange={updateFilters} />

      {loadError && (
        <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-5 py-4 text-center text-xs text-red-600 dark:text-red-300">
          <p className="mb-2">{loadError}</p>
          <button type="button" onClick={() => void load()} className="font-semibold text-brand hover:text-brand-hover">
            Try again
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-line bg-surface [box-shadow:var(--shadow)]">
        {loading ? (
          <PageLoader label="Loading pre-registrations…" />
        ) : (
          <>
            <PreRegTable
              rows={pageRows}
              selected={selected}
              onToggle={toggleRow}
              onToggleAll={toggleAllOnPage}
              onShare={shareItem}
              onShowQr={(item) => setPassId(item.id)}
              onDelete={deleteItem}
            />
            <Pagination page={currentPage} pageCount={pageCount} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
          </>
        )}
      </section>

      {passItem && <PreRegPassModal item={passItem} onClose={() => setPassId(null)} />}

      <p role="status" aria-live="polite" className={notice ? "fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-fg px-4 py-2.5 text-xs font-medium text-surface shadow-lg" : "sr-only"}>
        {notice}
      </p>
    </div>
  );
}
