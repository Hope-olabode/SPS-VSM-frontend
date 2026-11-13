import type { ReactNode } from "react";

export const inputClass =
  "h-11 w-full min-w-0 rounded-lg border border-line-strong bg-surface-soft px-3.5 text-sm text-fg transition placeholder:text-muted hover:border-brand/40 focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20";

type FieldProps = { label: string; htmlFor: string; required?: boolean; children: ReactNode };

export function Field({ label, htmlFor, required, children }: FieldProps) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="mb-2 block text-[13px] font-semibold text-fg">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}