"use client";

import { useEffect, useMemo, useState } from "react";
import { useCurrentUser } from "@/src/components/dashboard/current-user-provider";
import { useLocations } from "@/src/components/dashboard/locations-provider";
import { useUsers } from "@/src/components/dashboard/users-provider";
import { useVisitors } from "@/src/components/dashboard/visitors-provider";
import { BuildingIcon, PencilIcon, PlusIcon, SearchIcon, TrashIcon, UsersIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { errorMessage } from "@/src/lib/api";
import { DEFAULT_LOCATION, type Location, type LocationInput } from "@/src/lib/mock-locations";
import { isAdminRole } from "@/src/lib/mock-users";
import { isInBuilding } from "@/src/lib/mock-visitors";
import { LocationForm } from "./location-form";
import { KioskCodesCard } from "./kiosk-codes-card";
import { TeamTable, VisitorsTable } from "./location-tables";

type Tab = "team" | "visitors";

function StatusPill({ status }: { status: Location["status"] }) {
  return status === "active" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-green-600/20 bg-green-600/10 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-400">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-semibold text-soft">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Inactive
    </span>
  );
}

export function LocationsPage() {
  const { user: currentUser } = useCurrentUser();
  const { locations, addLocation, updateLocation, removeLocation } = useLocations();
  const { users, reload: reloadUsers } = useUsers();
  const { visitors } = useVisitors();
  const canManage = isAdminRole(currentUser.role);

  const [selectedId, setSelectedId] = useState(locations[0].id);
  /** null = form closed, "new" = adding, otherwise the id being edited */
  const [formFor, setFormFor] = useState<null | "new" | string>(null);
  const [tab, setTab] = useState<Tab>("team");
  const [query, setQuery] = useState("");
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  // Each location gets its own rows: users are matched by their location, visitors by where they checked in.
  const byLocation = useMemo(
    () =>
      locations.map((location) => {
        const team = users.filter((user) => user.branch === location.name);
        const visits = visitors.filter((visitor) => (visitor.location ?? DEFAULT_LOCATION) === location.name);
        return { location, team, visits, onsite: visits.filter(isInBuilding).length };
      }),
    [locations, users, visitors],
  );

  const selected = byLocation.find((entry) => entry.location.id === selectedId) ?? byLocation[0];
  const editing = formFor && formFor !== "new" ? locations.find((location) => location.id === formFor) : undefined;

  const text = query.trim().toLowerCase();
  const teamRows = selected.team.filter((user) => !text || [user.name, user.email, user.role].join(" ").toLowerCase().includes(text));
  const visitorRows = selected.visits.filter((visitor) => !text || [visitor.name, visitor.host, visitor.type, visitor.residentCompany].join(" ").toLowerCase().includes(text));

  function select(id: string) {
    setSelectedId(id);
    setQuery("");
    setConfirmingRemove(false);
  }

  /** Returns an error message for the form, or null when saved */
  async function save(values: LocationInput): Promise<string | null> {
    try {
      if (editing) {
        await updateLocation(editing.id, values);
        // users are listed under their location's name, so pick up the new one
        if (values.name !== editing.name) await reloadUsers();
        setNotice(`${values.name} was updated`);
      } else {
        const created = await addLocation(values);
        select(created.id);
        setNotice(`${values.name} was added`);
      }
      setFormFor(null);
      return null;
    } catch (err) {
      return errorMessage(err);
    }
  }

  async function remove(location: Location) {
    try {
      await removeLocation(location.id);
      setSelectedId(locations.find((item) => item.primary)?.id ?? locations[0].id);
      setNotice(`${location.name} was removed`);
    } catch (err) {
      setNotice(errorMessage(err));
    } finally {
      setConfirmingRemove(false);
    }
  }

  const { location } = selected;
  const removeBlocked = location.primary ? "The primary location can't be removed." : selected.team.length > 0 ? `Move the ${selected.team.length} ${selected.team.length === 1 ? "user" : "users"} assigned here to another location first.` : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-[7px] text-[21px] font-bold leading-tight tracking-[-0.035em] sm:text-[25px]">Locations</h1>
          <p className="text-xs text-soft">The sites visitors check in to. Each location keeps its own team and visitor records.</p>
        </div>

        {canManage && (
          <Button onClick={() => setFormFor(formFor === "new" ? null : "new")} aria-expanded={formFor === "new"}>
            <PlusIcon size={15} />
            {formFor === "new" ? "Cancel" : "Add Location"}
          </Button>
        )}
      </div>

      {canManage && formFor && (
        <LocationForm
          // a new key resets the form when switching between locations
          key={formFor}
          initial={editing && { name: editing.name, city: editing.city, address: editing.address, status: editing.status }}
          takenNames={locations.filter((item) => item.id !== editing?.id).map((item) => item.name)}
          lockStatus={editing?.primary}
          onSave={save}
          onCancel={() => setFormFor(null)}
        />
      )}

      <section aria-label="All locations" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {byLocation.map((entry) => {
          const isSelected = entry.location.id === location.id;
          return (
            <button
              key={entry.location.id}
              type="button"
              onClick={() => select(entry.location.id)}
              aria-pressed={isSelected}
              className={`flex flex-col gap-4 rounded-xl border bg-surface p-4 text-left transition [box-shadow:var(--shadow)] ${
                isSelected ? "border-brand ring-[3px] ring-brand/15" : "border-line hover:-translate-y-0.5 hover:border-line-strong"
              }`}
            >
              <span className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                  <BuildingIcon size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <b className="truncate text-sm font-semibold">{entry.location.name}</b>
                    {entry.location.primary && <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-brand">PRIMARY</span>}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-soft">{entry.location.city}</span>
                </span>
                <StatusPill status={entry.location.status} />
              </span>

              <span className="grid grid-cols-2 gap-3 border-t border-line pt-3">
                <span>
                  <span className="block text-lg font-bold leading-none tracking-tight">{entry.team.length}</span>
                  <span className="mt-1 block text-[11px] text-muted">Team {entry.team.length === 1 ? "member" : "members"}</span>
                </span>
                <span>
                  <span className="block text-lg font-bold leading-none tracking-tight">{entry.onsite}</span>
                  <span className="mt-1 block text-[11px] text-muted">Onsite now</span>
                </span>
              </span>
            </button>
          );
        })}
      </section>

      {currentUser.role === "GLOBAL ADMIN" && <KioskCodesCard />}

      <section aria-label={`${location.name} data`} className="overflow-hidden rounded-xl border border-line bg-surface [box-shadow:var(--shadow)]">
        <header className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-sm font-semibold">{location.name}</h2>
              <StatusPill status={location.status} />
            </div>
            <p className="mt-0.5 text-xs text-soft">
              {[location.address, location.city].filter(Boolean).join(", ")} · Added {location.created}
            </p>
          </div>

          {canManage &&
            (confirmingRemove ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-soft">Remove this location?</span>
                <button type="button" onClick={() => remove(location)} className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white transition hover:bg-red-700">
                  Yes
                </button>
                <button type="button" onClick={() => setConfirmingRemove(false)} className="rounded border border-line-strong px-2 py-0.5 text-[11px] font-medium text-soft transition hover:bg-surface-soft">
                  No
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Button variant="secondary" className="!min-h-[34px] !px-3 !text-xs" onClick={() => setFormFor(location.id)}>
                  <PencilIcon size={14} />
                  Edit
                </Button>
                <button
                  type="button"
                  title={removeBlocked || "Remove location"}
                  aria-label={`Remove ${location.name}`}
                  disabled={Boolean(removeBlocked)}
                  onClick={() => setConfirmingRemove(true)}
                  className="rounded-lg p-2 text-red-500 transition hover:bg-red-500/10 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            ))}
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 pt-3">
          <div role="tablist" aria-label={`${location.name} tables`} className="flex gap-5">
            {(
              [
                { id: "team", label: "Team", count: selected.team.length },
                { id: "visitors", label: "Visitors", count: selected.visits.length },
              ] as const
            ).map(({ id, label, count }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => {
                  setTab(id);
                  setQuery("");
                }}
                className={`-mb-px flex items-center gap-2 border-b-2 pb-3 text-[13px] transition ${
                  tab === id ? "border-brand font-semibold text-brand" : "border-transparent font-medium text-soft hover:text-fg"
                }`}
              >
                {label}
                <span className="rounded-full bg-slate-500/10 px-1.5 text-[10px] font-semibold text-soft">{count}</span>
              </button>
            ))}
          </div>

          <div className="relative mb-3 w-full sm:w-64">
            <SearchIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tab === "team" ? "Search team..." : "Search visitors..."}
              aria-label={tab === "team" ? "Search team" : "Search visitors"}
              className="w-full rounded-lg border border-line-strong bg-surface py-1.5 pl-9 pr-3 text-xs text-fg shadow-sm transition placeholder:text-muted focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20"
            />
          </div>
        </div>

        {removeBlocked && canManage && <p className="border-b border-line bg-surface-soft px-5 py-2 text-[11px] text-muted">{removeBlocked}</p>}

        {tab === "team" ? (
          <TeamTable rows={teamRows} emptyText={selected.team.length === 0 ? `No users are assigned to ${location.name} yet.` : "No users match that search."} />
        ) : (
          <VisitorsTable rows={visitorRows} emptyText={selected.visits.length === 0 ? `No visitors have checked in at ${location.name} yet.` : "No visitors match that search."} />
        )}
      </section>

      <p className="flex items-center gap-2 text-xs text-muted">
        <UsersIcon size={14} />
        Assign people to a location from Users or the Control Panel.
      </p>

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
