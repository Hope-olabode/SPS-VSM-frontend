import { PinIcon, ShieldCheckIcon } from "@/src/components/icons";
import type { UserRole } from "@/src/lib/mock-users";

const roles: Record<UserRole, string> = {
  "GLOBAL ADMIN": "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "LOCATION ADMIN": "border-purple-500/25 bg-purple-500/10 text-purple-700 dark:text-purple-300",
  MANAGER: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  "TENANT REP": "border-green-600/20 bg-green-600/10 text-green-700 dark:text-green-400",
  USER: "border-transparent bg-slate-500/10 text-soft",
};

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${roles[role]}`}>
      <ShieldCheckIcon size={11} />
      {role}
    </span>
  );
}

export function BranchBadge({ branch }: { branch: string }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
      <PinIcon size={11} />
      {branch}
    </span>
  );
}
