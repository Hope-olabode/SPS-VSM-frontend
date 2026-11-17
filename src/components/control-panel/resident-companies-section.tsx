"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useLock } from "@/src/hooks/useLock";
import { BuildingIcon, PencilIcon, TrashIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { Field, inputClass } from "@/src/components/ui/field";
import { api, type ApiTenant, type ApiTenantList, errorMessage } from "@/src/lib/api";

/**
 * Where an admin keeps the list of resident companies shown in the check-in, pre-registration and kiosk boxes.
 * GET, POST, PATCH and DELETE /api/tenants (for the location the admin is working in). A company that already has visits,
 * pre-registrations or users can be renamed but not removed.
 */
export function ResidentCompaniesSection({ onNotice }: { onNotice: (message: string) => void }) {
  const [companies, setCompanies] = useState<ApiTenant[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [name, setName] = useState("");
  const [floor, setFloor] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(
    () =>
      api<ApiTenantList>("/tenants")
        .then((data) => {
          setCompanies(data.items);
          setState("ready");
        })
        .catch(() => setState("error")),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  function reset() {
    setName("");
    setFloor("");
    setEditingId(null);
    setFormError("");
  }

  function startEdit(company: ApiTenant) {
    setEditingId(company.id);
    setName(company.name);
    setFloor(company.floor ?? "");
    setFormError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return setFormError("Enter the company's name");
    setSaving(true);
    setFormError("");
    try {
      const path = editingId ? `/tenants/${encodeURIComponent(editingId)}` : "/tenants";
      await api(path, { method: editingId ? "PATCH" : "POST", body: { name: name.trim(), floor: floor.trim() } });
      onNotice(editingId ? "Company updated" : "Company added");
      reset();
      await load();
    } catch (err) {
      setFormError(errorMessage(err, "Couldn't save the company."));
    } finally {
      setSaving(false);
    }
  }

  const { run } = useLock();

  function remove(company: ApiTenant) {
    if (!window.confirm(`Remove ${company.name} from the resident companies?`)) return Promise.resolve();
    return run(async () => {
      try {
        await api(`/tenants/${encodeURIComponent(company.id)}`, { method: "DELETE" });
        onNotice("Company removed");
        if (editingId === company.id) reset();
        await load();
      } catch (err) {
        onNotice(errorMessage(err, "Couldn't remove the company."));
      }
    });
  }

  return (
    <section className="rounded-xl border border-line bg-surface [box-shadow:var(--shadow)]" aria-label="Resident companies">
      <header className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          <BuildingIcon size={18} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Resident companies</h2>
          <p className="text-xs text-soft">The companies visitors can be visiting. They appear in the check-in, pre-registration and kiosk lists.</p>
        </div>
      </header>

      <form onSubmit={submit} noValidate className="grid gap-4 border-b border-line px-5 py-4 sm:grid-cols-[1fr_200px_auto] sm:items-end">
        <Field label={editingId ? "Company name" : "New company"} htmlFor="rc-name">
          <input id="rc-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={160} placeholder="e.g. Zenith Bank" className={inputClass} />
        </Field>
        <Field label="Floor (optional)" htmlFor="rc-floor">
          <input id="rc-floor" value={floor} onChange={(event) => setFloor(event.target.value)} maxLength={60} placeholder="e.g. 3rd Floor" className={inputClass} />
        </Field>
        <div className="flex gap-2">
          <Button type="submit" loading={saving}>
            {saving ? "Saving…" : editingId ? "Save" : "Add company"}
          </Button>
          {editingId && (
            <Button type="button" variant="secondary" onClick={reset}>
              Cancel
            </Button>
          )}
        </div>
        {formError && (
          <p role="alert" className="text-xs text-red-500 sm:col-span-3">
            {formError}
          </p>
        )}
      </form>

      {state === "loading" && <p role="status" className="px-5 py-8 text-center text-xs text-muted">Loading…</p>}
      {state === "error" && (
        <p role="alert" className="px-5 py-8 text-center text-xs text-red-600 dark:text-red-300">
          Couldn&apos;t load the companies.{" "}
          <button type="button" onClick={() => void load()} className="font-semibold text-brand hover:text-brand-hover">
            Try again
          </button>
        </p>
      )}
      {state === "ready" && companies.length === 0 && <p className="px-5 py-8 text-center text-xs text-muted">No resident companies yet. Add the first one above.</p>}
      {state === "ready" && companies.length > 0 && (
        <ul className="divide-y divide-line">
          {companies.map((company) => (
            <li key={company.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium">{company.name}</div>
                {company.floor && <div className="text-[11px] text-muted">{company.floor}</div>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => startEdit(company)} aria-label={`Edit ${company.name}`} className="rounded p-1.5 text-muted transition hover:bg-surface-soft hover:text-fg">
                  <PencilIcon size={15} />
                </button>
                <button type="button" onClick={() => void remove(company)} aria-label={`Remove ${company.name}`} className="rounded p-1.5 text-muted transition hover:bg-red-500/10 hover:text-red-600">
                  <TrashIcon size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
