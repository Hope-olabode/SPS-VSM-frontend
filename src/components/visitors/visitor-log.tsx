"use client";

import { useMemo, useState } from "react";
import { useAudit } from "@/src/components/dashboard/audit-provider";
import { useVisitors } from "@/src/components/dashboard/visitors-provider";
import { DownloadIcon, EyeIcon, LockIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { auditMessages } from "@/src/lib/audit";
import { useCurrentUser } from "@/src/components/dashboard/current-user-provider";
import { useSettings } from "@/src/components/dashboard/settings-provider";
import { isAdminRole } from "@/src/lib/mock-users";
import { formatPhone, maskPhone } from "@/src/lib/mock-visitors";
import { emptyFilters, type Filters, matchesFilters } from "@/src/lib/visitor-filters";
import { Pagination } from "./pagination";
import { VisitorDrawer } from "./visitor-drawer";
import { VisitorFilters } from "./visitor-filters";
import { VisitorTable } from "./visitor-table";

const PAGE_SIZE = 15;

const stampText = (stamp?: { date: string; time: string }) => (stamp ? `${stamp.date} ${stamp.time}` : "");

export function VisitorLog() {
  const { visitors, resolveClearance, resolveApproval, signOut } = useVisitors();
  const { record } = useAudit();
  const { user: currentUser } = useCurrentUser();
  const { settings } = useSettings();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [unlockRequested, setUnlockRequested] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  // Control Panel "Mask phone numbers": when it is off, everyone sees full numbers and there is nothing to unlock.
  // When it is on, only admins may reveal them (the API already masks them for everyone else).
  const canUnlock = settings.maskPhones && isAdminRole(currentUser.role);
  const unlocked = !settings.maskPhones || (canUnlock && unlockRequested);

  const filtered = useMemo(() => visitors.filter((visitor) => matchesFilters(visitor, filters)), [visitors, filters]);
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

  function exportCsv() {
    const source = selected.length > 0 ? visitors.filter((visitor) => selected.includes(visitor.id)) : filtered;
    const header = ["Visitor", "Phone", "Company", "Resident Company", "Type", "Host", "Status", "Check In", "Check Out", "Duration"];
    const lines = [
      header,
      ...source.map((visitor) => [
        visitor.name,
        unlocked ? formatPhone(visitor.phone) : maskPhone(visitor.phone),
        visitor.company,
        visitor.floor ? `${visitor.residentCompany} (${visitor.floor})` : visitor.residentCompany,
        visitor.type,
        visitor.host,
        visitor.status,
        stampText(visitor.checkIn),
        stampText(visitor.checkOut),
        visitor.duration,
      ]),
    ].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","));

    // the BOM makes Excel read the file as UTF-8 (the masked phone numbers contain "•")
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "visitor-log.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-[7px] text-[21px] font-bold leading-tight tracking-[-0.035em] sm:text-[25px]">Visitor Log</h1>
          <p className="text-xs text-soft">
            {filtered.length} total records
            {selected.length > 0 && <span className="text-brand"> · {selected.length} selected</span>}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* only admins see this button; the API masks phone numbers for everyone else and refuses the audit event from them */}
          {canUnlock && (
          <Button
            variant="secondary"
            onClick={() => {
              if (!unlocked) record({ action: "PII_UNLOCKED", category: "Security", message: auditMessages.piiUnlocked(currentUser.name) });
              setUnlockRequested((value) => !value);
            }}
            aria-pressed={unlocked}
          >
            {unlocked ? <LockIcon size={14} /> : <EyeIcon size={14} />}
            {unlocked ? "Lock PII" : "Unlock PII"}
          </Button>
          )}
          <Button variant="secondary" onClick={exportCsv}>
            <DownloadIcon size={14} /> Export CSV
          </Button>
        </div>
      </div>

      <VisitorFilters filters={filters} onChange={updateFilters} />

      <section className="overflow-hidden rounded-xl border border-line bg-surface [box-shadow:var(--shadow)]">
        <VisitorTable
          rows={pageRows}
          selected={selected}
          unlocked={unlocked}
          onToggle={toggleRow}
          onToggleAll={toggleAllOnPage}
          onApprove={(id) => resolveClearance(id, "approve")}
          onDecline={(id) => resolveClearance(id, "decline")}
          onAdmit={(id) => void resolveApproval(id, "approve")}
          onDeny={(id) => void resolveApproval(id, "decline")}
          onSignOut={signOut}
          onView={setViewingId}
        />
        <Pagination page={currentPage} pageCount={pageCount} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
      </section>

      {viewingId && <VisitorDrawer visitorId={viewingId} unlocked={unlocked} onClose={() => setViewingId(null)} />}
    </div>
  );
}