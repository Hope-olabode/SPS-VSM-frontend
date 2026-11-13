import type { ComponentType, ReactNode } from "react";
import type { IconProps } from "../icons";

type ChartCardProps = {
  title: string;
  icon?: ComponentType<IconProps>;
  className?: string;
  children: ReactNode;
};

export function ChartCard({ title, icon: Icon, className = "", children }: ChartCardProps) {
  return (
    <section className={`rounded-[11px] border border-line bg-surface p-4 [box-shadow:var(--shadow)] sm:p-5 ${className}`}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-[-0.01em]">{title}</h2>
        {Icon && <Icon size={17} className="text-muted" />}
      </header>
      {children}
    </section>
  );
}

/** Small rounded count shown next to a name in the ranking lists. */
export function CountBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand">{children}</span>
  );
}
