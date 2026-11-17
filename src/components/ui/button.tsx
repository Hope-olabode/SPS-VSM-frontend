import type { ButtonHTMLAttributes } from "react";
import { Spinner } from "./spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const base =
  "inline-flex min-h-[41px] cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-45";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-[0_3px_8px_rgba(22,163,74,0.22)] hover:-translate-y-px hover:bg-brand-hover disabled:hover:translate-y-0 disabled:hover:bg-brand dark:text-[#04130a]",
  secondary:
    "border border-line-strong bg-surface text-soft hover:border-brand/40 hover:bg-brand-soft hover:text-brand",
  ghost: "text-soft hover:bg-surface-soft hover:text-fg",
  danger: "bg-red-600 text-white shadow-[0_3px_8px_rgba(220,38,38,0.22)] hover:-translate-y-px hover:bg-red-700 disabled:hover:translate-y-0 disabled:hover:bg-red-600",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  /** True while the action is running: shows a spinner and disables the button so it can't be pressed twice */
  loading?: boolean;
};

export function Button({ variant = "primary", type = "button", className = "", loading = false, disabled, children, ...props }: ButtonProps) {
  return (
    <button type={type} className={`${base} ${variants[variant]} ${className}`} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <Spinner size={14} />}
      {children}
    </button>
  );
}
