"use client";

import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { api, type ApiTenant, type ApiTenantList, errorMessage } from "@/src/lib/api";
import { ChevronDownIcon } from "../icons";
import { inputClass } from "./field";

/**
 * Loads the resident companies (GET /api/tenants) and lets an admin add one (POST /api/tenants).
 * Pass `companies` in to skip loading (the kiosk does: it has no login).
 */
export function useResidentCompanies(given?: ApiTenant[]) {
  const [loaded, setLoaded] = useState<ApiTenant[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (given) return;
    api<ApiTenantList>("/tenants")
      .then((data) => {
        setLoaded(data.items);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [given]);

  /** Returns an error message, or null when the company was added */
  async function add(name: string): Promise<string | null> {
    try {
      const data = await api<{ ok: true; item: ApiTenant }>("/tenants", { method: "POST", body: { name } });
      setLoaded((current) => [...current, data.item].sort((a, b) => a.name.localeCompare(b.name)));
      return null;
    } catch (err) {
      return errorMessage(err, "Couldn't add the company.");
    }
  }

  return { companies: given ?? loaded, state: given ? ("ready" as const) : state, add };
}

type CompanyComboboxProps = {
  id: string;
  /** Submitted with a form under this name (the chosen company's name) */
  name?: string;
  /** The chosen company's name, or "" while nothing valid is chosen */
  value: string;
  onChange: (name: string) => void;
  companies: ApiTenant[];
  state?: "loading" | "ready" | "error";
  /** Admins only: shows an "Add" choice for a name that isn't in the list yet */
  onAdd?: (name: string) => Promise<string | null>;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
};

/**
 * A text box you can type in to narrow the list, and a list you can pick from. Only a company that exists can be chosen;
 * an admin can add a missing one from the same box. Keyboard: arrows move, Enter chooses, Escape closes.
 */
export function CompanyCombobox({ id, name, value, onChange, companies, state = "ready", onAdd, required, invalid, describedBy }: CompanyComboboxProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const emitted = useRef(value); // the last value this box reported, to tell a change from outside apart
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");

  // the value was changed from outside (a scanned pass filled the form, for example)
  useEffect(() => {
    if (value !== emitted.current) {
      emitted.current = value;
      setText(value);
    }
  }, [value]);

  const needle = text.trim().toLowerCase();
  const exact = companies.find((company) => company.name.toLowerCase() === needle);
  const matches = companies.filter((company) => !needle || company.name.toLowerCase().includes(needle) || (company.floor ?? "").toLowerCase().includes(needle));
  const canAdd = Boolean(onAdd) && needle.length > 0 && !exact;
  const optionCount = matches.length + (canAdd ? 1 : 0);

  // a typed name that isn't in the list is not a valid answer: say so in the browser's own form validation
  useEffect(() => {
    inputRef.current?.setCustomValidity(text.trim() && !value ? "Choose a company from the list." : "");
  }, [text, value]);

  function emit(next: string) {
    emitted.current = next;
    onChange(next);
  }

  function choose(company: ApiTenant) {
    setText(company.name);
    emit(company.name);
    setOpen(false);
    setMessage("");
  }

  function type(next: string) {
    setText(next);
    setOpen(true);
    setActive(0);
    setMessage("");
    const found = companies.find((company) => company.name.toLowerCase() === next.trim().toLowerCase());
    emit(found ? found.name : "");
  }

  async function addTyped() {
    if (!onAdd || adding) return;
    const wanted = text.trim();
    setAdding(true);
    const problem = await onAdd(wanted);
    setAdding(false);
    if (problem) return setMessage(problem);
    setText(wanted);
    emit(wanted);
    setOpen(false);
  }

  function pick(index: number) {
    if (index < matches.length) choose(matches[index]);
    else if (canAdd) void addTyped();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return setOpen(true);
      if (optionCount > 0) setActive((current) => (current + (event.key === "ArrowDown" ? 1 : optionCount - 1)) % optionCount);
    } else if (event.key === "Enter" && open && optionCount > 0) {
      event.preventDefault(); // don't submit the form while choosing
      pick(Math.min(active, optionCount - 1));
    } else if (event.key === "Escape" && open) {
      event.stopPropagation(); // don't close a dialog this box sits in
      setOpen(false);
    }
  }

  const disabled = state !== "ready";
  const option = "flex w-full cursor-pointer items-center justify-between gap-3 px-3.5 py-2 text-left text-sm";

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-activedescendant={open && optionCount > 0 ? `${listId}-${Math.min(active, optionCount - 1)}` : undefined}
        autoComplete="off"
        required={required}
        disabled={disabled}
        value={disabled ? "" : text}
        placeholder={state === "loading" ? "Loading companies…" : state === "error" ? "Couldn't load companies" : "Type or choose a company"}
        onChange={(event) => type(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className={`${inputClass} pr-10 aria-invalid:border-red-500`}
      />
      {/* sent with the form: the chosen company's name (the typed text alone might not be a real company) */}
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Show all companies"
        disabled={disabled}
        // mouse down (not click) so the box doesn't lose focus and close the list first
        onMouseDown={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
          setOpen((current) => !current);
        }}
        className="absolute right-0 top-0 grid h-11 w-10 place-items-center text-muted"
      >
        <ChevronDownIcon size={16} />
      </button>

      {open && !disabled && (
        <ul
          id={listId}
          role="listbox"
          // mouse down on the list must not blur the input, or the click would never land
          onMouseDown={(event) => event.preventDefault()}
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-line-strong bg-surface py-1 [box-shadow:var(--shadow)]"
        >
          {matches.map((company, index) => (
            <li
              key={company.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={company.name === value}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(company)}
              className={`${option} ${index === active ? "bg-surface-soft" : ""} ${company.name === value ? "font-semibold text-brand" : "text-fg"}`}
            >
              <span>{company.name}</span>
              {company.floor && <span className="text-[11px] text-muted">{company.floor}</span>}
            </li>
          ))}
          {canAdd && (
            <li
              id={`${listId}-${matches.length}`}
              role="option"
              aria-selected={false}
              onMouseEnter={() => setActive(matches.length)}
              onClick={() => void addTyped()}
              className={`${option} font-medium text-brand ${active === matches.length ? "bg-surface-soft" : ""}`}
            >
              {adding ? "Adding…" : `Add “${text.trim()}” as a new resident company`}
            </li>
          )}
          {optionCount === 0 && (
            <li role="presentation" className="px-3.5 py-2 text-xs text-muted">
              {companies.length === 0 ? "No resident companies yet. An admin can add them in the Control Panel." : "No company matches. Ask an admin to add it."}
            </li>
          )}
        </ul>
      )}
      {message && (
        <p role="alert" className="mt-1.5 text-xs text-red-500">
          {message}
        </p>
      )}
    </div>
  );
}
