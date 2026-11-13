import Link from "next/link";
import type { ComponentType } from "react";
import { ArrowRightIcon, type IconProps } from "../icons";

const tones = {
  green: "bg-green-500/10 text-green-600 dark:text-green-400",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  slate: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export type Tone = keyof typeof tones;

type StatCardProps = {
  label: string;
  value: number;
  href: string;
  icon: ComponentType<IconProps>;
  tone: Tone;
};

export function StatCard({ label, value, href, icon: Icon, tone }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group relative min-h-[127px] rounded-[11px] border border-line bg-surface p-4 transition [box-shadow:var(--shadow)] hover:-translate-y-0.5 hover:border-line-strong sm:min-h-[142px] sm:p-[19px]"
    >
      <span className={`mb-[17px] grid h-[38px] w-[38px] place-items-center rounded-[9px] ${tones[tone]}`}>
        <Icon size={21} />
      </span>
      <ArrowRightIcon
        size={17}
        className="absolute right-[15px] top-5 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand sm:right-[19px] sm:top-6"
      />
      <strong className="mb-[5px] block text-[23px] leading-none tracking-[-0.03em]">{value}</strong>
      <span className="text-xs text-soft">{label}</span>
    </Link>
  );
}