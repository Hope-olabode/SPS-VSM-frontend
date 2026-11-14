"use client";

import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "../icons";
import { inputClass } from "./field";

export type SelectOption = string | { value: string; label: string };

type SelectProps = {
  id: string;
  /** Submitted with a plain <form> under this name (the chosen value) */
  name?: string;
  options: readonly SelectOption[];
  /** Use `defaultValue` to let the select keep its own choice, or `value` + `onChange` to control it */
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
};

const normalise = (option: SelectOption) => (typeof option === "string" ? { value: option, label: option } : option);

/**
 * A dropdown that looks the same as the resident company box (same arrow, same list), in place of the browser's own <select>.
 * Keyboard: arrows move, Enter or Space chooses, Escape closes, Home and End jump to the first and last choice.
 */
export function Select({ id, name, options, defaultValue, value, onChange, disabled, invalid, describedBy, className = "" }: SelectProps) {
  const items = options.map(normalise);
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState(defaultValue ?? items[0]?.value ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const current = value ?? inner;
  const selectedIndex = Math.max(0, items.findIndex((item) => item.value === current));
  const selected = items.find((item) => item.value === current);

  // close on a click outside
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // keep the highlighted choice in view when the list is long
  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);

  function show() {
    setActive(selectedIndex);
    setOpen(true);
  }

  function choose(index: number) {
    const next = items[index]?.value;
    if (next === undefined) return;
    setInner(next);
    onChange?.(next);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return show();
      setActive((index) => (index + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length);
    } else if (event.key === "Home" || event.key === "End") {
      if (!open) return;
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : items.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) choose(active);
      else show();
    } else if (event.key === "Escape" && open) {
      event.stopPropagation(); // don't close a dialog this select sits in
      setOpen(false);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={root} className="relative">
      {name && <input type="hidden" name={name} value={current} />}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className={`${inputClass} flex cursor-pointer items-center pr-10 text-left aria-invalid:border-red-500 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        <span className="truncate">{selected?.label ?? ""}</span>
      </button>
      {/* the same arrow the resident company box has */}
      <span aria-hidden="true" className="pointer-events-none absolute right-0 top-0 grid h-11 w-10 place-items-center text-muted">
        <ChevronDownIcon size={16} />
      </span>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-line bg-surface p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.15)]"
        >
          {items.map((item, index) => {
            const isSelected = item.value === current;
            return (
              <li
                key={item.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(index)}
                className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-left text-sm ${
                  isSelected ? "bg-brand-soft font-medium text-brand" : index === active ? "bg-surface-soft text-fg" : "text-soft"
                }`}
              >
                <span>{item.label}</span>
                {isSelected && <CheckIcon size={16} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}