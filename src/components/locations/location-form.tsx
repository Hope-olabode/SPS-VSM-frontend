"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { BuildingIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { Field, inputClass } from "@/src/components/ui/field";
import type { LocationInput } from "@/src/lib/mock-locations";

type Errors = Partial<Record<"name" | "city", string>>;

const input = `${inputClass} aria-invalid:border-red-500`;

const ErrorText = ({ id, children }: { id: string; children?: ReactNode }) =>
  children ? (
    <p id={id} role="alert" className="mt-1.5 text-xs text-red-500">
      {children}
    </p>
  ) : null;

type LocationFormProps = {
  /** Set when editing; the form adds a new location otherwise */
  initial?: LocationInput;
  /** Names already used by other locations */
  takenNames: string[];
  /** The first location can't be switched off */
  lockStatus?: boolean;
  /** Resolves to an error message to show in the form, or null when it was saved */
  onSave: (values: LocationInput) => Promise<string | null>;
  onCancel: () => void;
};

export function LocationForm({ initial, takenNames, lockStatus = false, onSave, onCancel }: LocationFormProps) {
  const editing = Boolean(initial);
  const [values, setValues] = useState<LocationInput>(initial ?? { name: "", city: "", address: "", status: "active" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function change<K extends keyof LocationInput>(key: K, value: LocationInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = values.name.trim();
    const city = values.city.trim();
    const found: Errors = {};
    if (!name) found.name = "Enter a name for this location";
    else if (takenNames.some((taken) => taken.toLowerCase() === name.toLowerCase())) found.name = "A location with this name already exists";
    if (!city) found.city = "Enter the city and country";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setFormError("");
    const problem = await onSave({ ...values, name, city, address: values.address.trim() });
    // on success the page closes this form; on failure keep what was typed and say why
    if (problem) {
      setFormError(problem);
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-5 [box-shadow:var(--shadow)] sm:p-6" aria-label={editing ? "Edit location" : "Add location"}>
      <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold">
        <BuildingIcon size={16} className="text-brand" />
        {editing ? "Edit Location" : "Add Location"}
      </h2>

      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Name" htmlFor="location-name" required>
            <input
              id="location-name"
              autoFocus
              value={values.name}
              placeholder="e.g. Main Lobby"
              onChange={(event) => change("name", event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "location-name-error" : undefined}
              className={input}
            />
            <ErrorText id="location-name-error">{errors.name}</ErrorText>
          </Field>

          <Field label="City" htmlFor="location-city" required>
            <input
              id="location-city"
              value={values.city}
              placeholder="e.g. Lagos, Nigeria"
              onChange={(event) => change("city", event.target.value)}
              aria-invalid={Boolean(errors.city)}
              aria-describedby={errors.city ? "location-city-error" : undefined}
              className={input}
            />
            <ErrorText id="location-city-error">{errors.city}</ErrorText>
          </Field>

          <Field label="Address" htmlFor="location-address">
            <input id="location-address" value={values.address} placeholder="Street address (optional)" onChange={(event) => change("address", event.target.value)} className={input} />
          </Field>

          <Field label="Status" htmlFor="location-status">
            <select
              id="location-status"
              value={values.status}
              disabled={lockStatus}
              onChange={(event) => change("status", event.target.value as LocationInput["status"])}
              className={`${inputClass} px-3 disabled:opacity-60`}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {lockStatus && <p className="mt-1.5 text-xs text-muted">The primary location always stays active.</p>}
          </Field>
        </div>

        {formError && (
          <p role="alert" className="rounded-lg border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-600 dark:text-red-300">
            {formError}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : editing ? "Save Changes" : "Add Location"}
          </Button>
        </div>
      </form>
    </section>
  );
}
