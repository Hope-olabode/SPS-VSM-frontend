import type { ComponentType, ReactNode } from "react";
import type { IconProps } from "@/src/components/icons";

type SettingsSectionProps = { title: string; description: string; icon: ComponentType<IconProps>; children: ReactNode };

export function SettingsSection({ title, description, icon: Icon, children }: SettingsSectionProps) {
  return (
    <section className="rounded-xl border border-line bg-surface [box-shadow:var(--shadow)]" aria-label={title}>
      <header className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          <Icon size={18} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-soft">{description}</p>
        </div>
      </header>
      <div className="divide-y divide-line px-5">{children}</div>
    </section>
  );
}
