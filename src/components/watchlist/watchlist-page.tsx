"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLock } from "@/src/hooks/useLock";
import { PageLoader } from "@/src/components/ui/page-loader";
import { SearchIcon, ShieldAlertIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { api, ApiError, type ApiWatchlistEntry, type ApiWatchlistList } from "@/src/lib/api";
import type { NewWatchlistEntry, WatchlistEntry } from "@/src/lib/mock-watchlist";
import { WatchlistCard } from "./watchlist-card";
import { WatchlistForm } from "./watchlist-form";

const toEntry = ({ createdAt, ...rest }: ApiWatchlistEntry): WatchlistEntry => ({
  ...rest,
  addedOn: new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
});

const messageOf = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback);

export function WatchlistPage() {
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  // GET /api/watchlist
  const load = useCallback(
    () =>
      api<ApiWatchlistList>("/watchlist")
        .then((data) => {
          setEntries(data.items.map(toEntry));
          setLoadError("");
        })
        .catch((err) => setLoadError(messageOf(err, "Couldn't load the watchlist.")))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // the "added" message disappears by itself
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return entries;
    return entries.filter((entry) =>
      [entry.firstName, entry.lastName, entry.company, entry.email].join(" ").toLowerCase().includes(text),
    );
  }, [entries, query]);

  /** POST /api/watchlist. Returns an error message for the form, or null when saved. */
  async function addEntry(values: NewWatchlistEntry): Promise<string | null> {
    try {
      const { entry } = await api<{ entry: ApiWatchlistEntry }>("/watchlist", { method: "POST", body: values });
      // newest first, so the new entry is the first thing the person sees
      setEntries((current) => [toEntry(entry), ...current]);
      setAdding(false);
      setQuery("");
      setNotice(`${values.firstName} ${values.lastName} was added to the watchlist`);
      return null;
    } catch (err) {
      return messageOf(err, "Couldn't add the entry. Please try again.");
    }
  }

  /** DELETE /api/watchlist/:id */
  const { run } = useLock();

  function removeEntry(id: string) {
    return run(async () => {
      try {
        await api(`/watchlist/${encodeURIComponent(id)}`, { method: "DELETE" });
        setEntries((current) => current.filter((item) => item.id !== id));
        setNotice("Entry removed from the watchlist");
      } catch (err) {
        setNotice(messageOf(err, "Couldn't remove the entry."));
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-[7px] text-[21px] font-bold leading-tight tracking-[-0.035em] sm:text-[25px]">Watchlist</h1>
          <p className="text-xs text-soft">Manage security screening entries</p>
        </div>

        <Button onClick={() => setAdding((value) => !value)} aria-expanded={adding}>
          <ShieldAlertIcon size={15} />
          {adding ? "Cancel" : "Add to Watchlist"}
        </Button>
      </div>

      {adding && <WatchlistForm onSave={addEntry} onCancel={() => setAdding(false)} />}

      <section className="space-y-3.5" aria-label="Watchlist entries">
        {entries.length > 0 && (
          <div className="relative max-w-sm">
            <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, company or email..."
              aria-label="Search watchlist"
              className="w-full rounded-lg border border-line-strong bg-surface py-2 pl-9 pr-3 text-xs text-fg shadow-sm transition placeholder:text-muted focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20"
            />
          </div>
        )}

        <div className="space-y-2.5">
          {visible.map((entry) => (
            <WatchlistCard
              key={entry.id}
              entry={entry}
              onDelete={removeEntry}
            />
          ))}
        </div>

        {loading && (
          <PageLoader label="Loading watchlist…" />
        )}

        {loadError && (
          <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-5 py-6 text-center text-xs text-red-600 dark:text-red-300">
            <p className="mb-2">{loadError}</p>
            <button type="button" onClick={() => void load()} className="font-semibold text-brand hover:text-brand-hover">
              Try again
            </button>
          </div>
        )}

        {!loading && !loadError && entries.length === 0 && (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <ShieldAlertIcon size={52} strokeWidth={1.3} className="mb-4 text-line-strong" />
            <h2 className="text-sm font-semibold">Watchlist is empty</h2>
            <p className="mt-1 text-xs text-muted">No security screening entries have been added yet.</p>
          </div>
        )}

        {entries.length > 0 && visible.length === 0 && (
          <p className="rounded-xl border border-dashed border-line-strong px-5 py-12 text-center text-xs text-muted">
            No entries match that search.
          </p>
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
