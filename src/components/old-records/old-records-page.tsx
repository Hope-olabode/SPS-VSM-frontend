"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { SearchIcon } from "@/src/components/icons";
import { Pagination } from "@/src/components/visitors/pagination";
import { api, type ApiOldRecord, type ApiOldRecordList, errorMessage } from "@/src/lib/api";

const PAGE_SIZE = 25;

const SOURCES = [
  { id: "", label: "All" },
  { id: "visit", label: "Visits" },
  { id: "pre_registration", label: "Pre-registrations" },
  { id: "event_registration", label: "Event registrations" },
] as const;

const SOURCE_LABEL: Record<ApiOldRecord["source"], string> = { VISIT: "Visit", PRE_REGISTRATION: "Pre-registration", EVENT_REGISTRATION: "Event registration" };

const dateTime = (value: string) =>
  new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

const th = "px-3 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted";

/**
 * Records that data retention moved out of the live tables (GET /api/old-records, global admins only).
 * Read-only. Records older than the second retention stage are shown as "Deleted visitor" with no contact details or photo.
 */
export function OldRecordsPage() {
  const [source, setSource] = useState<(typeof SOURCES)[number]["id"]>("");
  const [text, setText] = useState("");
  const [search, setSearch] = useState(""); // `text` after a short pause, so every key press isn't a request
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ApiOldRecordList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(text.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [text]);

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (source) params.set("source", source);
    if (search) params.set("q", search);
    setLoading(true);
    return api<ApiOldRecordList>(`/old-records?${params}`)
      .then((result) => {
        setData(result);
        setError("");
      })
      .catch((err) => setError(errorMessage(err, "Couldn't load the old records.")))
      .finally(() => setLoading(false));
  }, [page, source, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-[7px] text-[21px] font-bold leading-tight tracking-[-0.035em] sm:text-[25px]">Old Records</h1>
        <p className="text-xs text-soft">
          Visits, pre-registrations and event registrations moved here by data retention. They no longer appear anywhere else. After a longer time their personal details are removed too.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Record type" className="flex flex-wrap gap-1.5">
          {SOURCES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={source === item.id}
              onClick={() => {
                setSource(item.id);
                setPage(1);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                source === item.id ? "border-brand bg-brand-soft text-brand" : "border-line-strong bg-surface text-soft hover:text-fg"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Search name, company, phone or host"
            aria-label="Search old records"
            className="w-full rounded-lg border border-line-strong bg-surface py-2 pl-9 pr-3 text-xs text-fg shadow-sm transition placeholder:text-muted focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20"
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-line bg-surface [box-shadow:var(--shadow)]">
        {error ? (
          <div role="alert" className="px-5 py-10 text-center text-xs text-red-600 dark:text-red-300">
            <p className="mb-2">{error}</p>
            <button type="button" onClick={() => void load()} className="font-semibold text-brand hover:text-brand-hover">
              Try again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-surface-soft">
                  <th scope="col" className={th}>Name</th>
                  <th scope="col" className={th}>Type</th>
                  <th scope="col" className={th}>Company</th>
                  <th scope="col" className={th}>Host</th>
                  <th scope="col" className={th}>Date</th>
                  <th scope="col" className={th}>Moved on</th>
                </tr>
              </thead>
              <tbody>
                {loading && !data && (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-muted" role="status">Loading…</td>
                  </tr>
                )}
                {data && data.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-muted" role="status">
                      {search || source ? "No old records match." : "Nothing has been moved yet."}
                    </td>
                  </tr>
                )}
                {data?.items.map((record) => (
                  <Fragment key={record.id}>
                    <tr
                      onClick={() => setOpenId(openId === record.id ? null : record.id)}
                      className="cursor-pointer border-b border-line transition hover:bg-surface-soft"
                    >
                      <td className="px-3 py-3.5">
                        <button
                          type="button"
                          aria-expanded={openId === record.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenId(openId === record.id ? null : record.id);
                          }}
                          className="text-left font-medium text-fg"
                        >
                          {record.name}
                        </button>
                        {record.anonymizedAt ? (
                          <div className="text-[11px] text-muted">Personal details removed</div>
                        ) : (
                          <div className="text-[11px] text-muted">{record.phone ?? record.email ?? ""}</div>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-soft">
                        {SOURCE_LABEL[record.source]}
                        {record.type && <div className="text-[11px] text-muted">{record.type}</div>}
                      </td>
                      <td className="px-3 py-3.5 text-soft">{record.company || "-"}</td>
                      <td className="px-3 py-3.5 text-soft">{record.host || "-"}</td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-soft">{dateTime(record.recordAt)}</td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-soft">{dateTime(record.archivedAt)}</td>
                    </tr>
                    {openId === record.id && (
                      <tr className="border-b border-line bg-surface-soft">
                        <td colSpan={6} className="px-5 py-4">
                          <RecordDetails record={record} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!error && <Pagination page={Math.min(page, pageCount)} pageCount={pageCount} pageSize={PAGE_SIZE} total={total} onPage={setPage} />}
      </section>
    </div>
  );
}

function RecordDetails({ record }: { record: ApiOldRecord }) {
  const base = `/backend/old-records/${encodeURIComponent(record.id)}`;
  const rows: [string, string | null | undefined][] = [
    ["Phone", record.phone],
    ["Email", record.email],
    ["Job title", record.jobTitle],
    ["Resident company", record.residentCompany ? `${record.residentCompany}${record.floor ? ` (${record.floor})` : ""}` : null],
    ["Event", record.eventTitle],
    ["Purpose", record.purpose],
    ["Status", record.status.replace(/_/g, " ").toLowerCase()],
    ["Checked out", record.checkOutAt ? `${dateTime(record.checkOutAt)}${record.autoCheckedOut ? " (automatically)" : ""}` : null],
    ["Notes", record.notes],
    ["Documents signed", record.documentsSigned.length ? record.documentsSigned.map((d) => `${d.title} (${dateTime(d.signedAt)})`).join(", ") : null],
  ];
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {(record.hasPhoto || record.hasSignature) && (
        <div className="flex shrink-0 gap-3">
          {/* eslint-disable @next/next/no-img-element -- private, login-protected images: next/image can't fetch them */}
          {record.hasPhoto && <img src={`${base}/photo`} alt={`Photo of ${record.name}`} className="h-24 w-24 rounded-xl border border-line object-cover" />}
          {record.hasSignature && <img src={`${base}/signature`} alt={`Signature of ${record.name}`} className="h-24 w-40 rounded-xl border border-line bg-white object-contain" />}
          {/* eslint-enable @next/next/no-img-element */}
        </div>
      )}
      <dl className="grid flex-1 gap-x-8 gap-y-2 sm:grid-cols-2">
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</dt>
              <dd className="text-soft">{value}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}
