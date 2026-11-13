import type { ComponentType } from "react";
import { TrendingUpIcon, type IconProps } from "../icons";

const tones = {
  green: "bg-green-500/10 text-green-600 dark:text-green-400",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  slate: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  lime: "bg-lime-500/10 text-lime-600 dark:text-lime-400",
};

type StatTileProps = {
  label: string;
  value: string;
  icon: ComponentType<IconProps>;
  tone: keyof typeof tones;
  /** Percentage change, shown as a small green badge */
  change?: number;
};

export function StatTile({ label, value, icon: Icon, tone, change }: StatTileProps) {
  return (
    <div className="rounded-[11px] border border-line bg-surface p-4 [box-shadow:var(--shadow)] sm:p-[19px]">
      <div className="mb-[17px] flex items-start justify-between">
        <span className={`grid h-[38px] w-[38px] place-items-center rounded-[9px] ${tones[tone]}`}>
          <Icon size={21} />
        </span>
        {change !== undefined && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
            <TrendingUpIcon size={14} />+{change}%
          </span>
        )}
      </div>
      <strong className="mb-[5px] block text-[23px] leading-none tracking-[-0.03em]">{value}</strong>
      <span className="text-xs text-soft">{label}</span>
    </div>
  );
}
