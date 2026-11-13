"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

type PopoverProps = {
  trigger: (state: { open: boolean; toggle: () => void }) => ReactNode;
  /** Pass a function to get `close`, e.g. to close the menu after opening a dialog */
  children: ReactNode | ((state: { close: () => void }) => ReactNode);
  /** Positioning/size classes for the panel, e.g. "right-0 w-80" */
  panelClassName?: string;
};

/** Small dropdown: closes on outside click and Escape. */
export function Popover({ trigger, children, panelClassName = "" }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((current) => !current) })}
      {open && (
        <div
          className={`absolute top-[calc(100%+12px)] z-50 rounded-xl border border-line bg-surface p-2 shadow-[0_18px_50px_rgba(0,0,0,0.15)] ${panelClassName}`}
        >
          {typeof children === "function" ? children({ close: () => setOpen(false) }) : children}
        </div>
      )}
    </div>
  );
}