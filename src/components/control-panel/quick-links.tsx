import Link from "next/link";
import type { ComponentType } from "react";
import { ArrowRightIcon, ClipboardIcon, DocumentIcon, type IconProps, PinIcon, ShieldIcon, UserPlusIcon, WarningIcon } from "@/src/components/icons";

const links: { label: string; description: string; href: string; icon: ComponentType<IconProps> }[] = [
  { label: "Users", description: "Team members and roles", href: "/dashboard/users", icon: UserPlusIcon },
  { label: "Locations", description: "Sites and their data", href: "/dashboard/locations", icon: PinIcon },
  { label: "Documents", description: "NDAs and visitor policies", href: "/dashboard/documents", icon: DocumentIcon },
  { label: "Watchlist", description: "Security screening entries", href: "/dashboard/watchlist", icon: ShieldIcon },
  { label: "Audit Trail", description: "Every action, recorded", href: "/dashboard/audit-trail", icon: ClipboardIcon },
  { label: "Emergency", description: "Roll-call and evacuation", href: "/dashboard/emergency", icon: WarningIcon },
];

export function QuickLinks() {
  return (
    <nav aria-label="Admin shortcuts" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {links.map(({ label, description, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group flex items-center gap-3 rounded-xl border border-line bg-surface p-3.5 transition [box-shadow:var(--shadow)] hover:-translate-y-0.5 hover:border-line-strong"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
            <Icon size={17} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold">{label}</span>
            <span className="block truncate text-[11px] text-muted">{description}</span>
          </span>
          <ArrowRightIcon size={15} className="shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand" />
        </Link>
      ))}
    </nav>
  );
}
