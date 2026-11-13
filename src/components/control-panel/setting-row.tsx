import type { ReactNode } from "react";
import { inputClass } from "@/src/components/ui/field";
import { Toggle } from "@/src/components/ui/toggle";
import type { Option } from "@/src/lib/settings";

type RowProps = { title: string; description: string; htmlFor?: string; children: ReactNode };

/** One setting: text on the left, its control on the right. */
export function SettingRow({ title, description, htmlFor, children }: RowProps) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="text-[13px] font-semibold">
          {title}
        </label>
        <p className="mt-0.5 text-xs leading-relaxed text-soft">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

type ToggleRowProps = { title: string; description: string; checked: boolean; onChange: (value: boolean) => void };

export function ToggleRow({ title, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="min-w-0">
        <div className="text-[13px] font-semibold">{title}</div>
        <p className="mt-0.5 text-xs leading-relaxed text-soft">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

type SelectRowProps = { id: string; title: string; description: string; value: string; options: Option[]; onChange: (value: string) => void };

export function SelectRow({ id, title, description, value, options, onChange }: SelectRowProps) {
  return (
    <SettingRow title={title} description={description} htmlFor={id}>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} h-10 w-full px-3 text-xs sm:w-[200px]`}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </SettingRow>
  );
}
