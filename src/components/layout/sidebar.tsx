"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Brand } from "../brands";
import { useCurrentUser } from "../dashboard/current-user-provider";
import { useVisitors } from "../dashboard/visitors-provider";
import { ChevronDownIcon, CloseIcon } from "../icons";
import { isActive, type NavItemData, visibleMainNav, visibleNavGroups } from "../../lib/nav";

// Compact (icon-only) mode only applies on desktop, so these are CSS-driven via data-compact.
const hideWhenCompact = "min-[1100px]:group-data-[compact=true]/sidebar:hidden";
const compactItem =
  "min-[1100px]:group-data-[compact=true]/sidebar:min-h-[42px] min-[1100px]:group-data-[compact=true]/sidebar:justify-center min-[1100px]:group-data-[compact=true]/sidebar:px-0";

function NavLink({ item, onNavigate }: { item: NavItemData; onNavigate: () => void }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  const { visitors } = useVisitors();
  // the Visitor Log badge counts everything that is waiting on staff: checkout clearances and entry approvals
  const pendingCount =
    item.badge === "pendingClearance"
      ? visitors.filter((visitor) => visitor.status === "pending_clearance" || visitor.status === "pending_approval").length
      : 0;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={item.label}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-[39px] items-center gap-[11px] rounded-lg px-[11px] text-[13px] transition-colors ${compactItem} ${
        active
          ? "bg-brand-soft font-semibold text-brand"
          : "text-soft hover:bg-surface-soft hover:text-fg"
      }`}
    >
      <Icon className="shrink-0" />
      <span className={`flex-1 whitespace-nowrap ${hideWhenCompact}`}>{item.label}</span>
      {pendingCount > 0 && (
        <span
          aria-label={`${pendingCount} pending`}
          className={`grid h-5 min-w-5 place-items-center rounded-full bg-amber-500 px-1 text-[11px] font-semibold text-white ${hideWhenCompact}`}
        >
          {pendingCount}
        </span>
      )}
    </Link>
  );
}

type SidebarProps = { compact: boolean; mobileOpen: boolean; onClose: () => void };

export function Sidebar({ compact, mobileOpen, onClose }: SidebarProps) {
  const { user } = useCurrentUser();
  // what each role is allowed to see is decided in lib/nav.ts
  const mainNav = visibleMainNav(user.role);
  const navGroups = visibleNavGroups(user.role);
  const [openGroups, setOpenGroups] = useState(() => visibleNavGroups(user.role).map((group) => group.title));

  const toggleGroup = (title: string) =>
    setOpenGroups((current) =>
      current.includes(title) ? current.filter((t) => t !== title) : [...current, title],
    );

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-[29] bg-black/40 backdrop-blur-[2px] transition-opacity min-[1100px]:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        data-compact={compact}
        className={`group/sidebar print:hidden fixed inset-y-0 left-0 z-30 flex w-[252px] flex-col border-r border-line bg-surface transition-[width,transform] duration-200 ease-out min-[1100px]:translate-x-0 min-[1100px]:shadow-none ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        } ${compact ? "min-[1100px]:w-[76px]" : ""}`}
      >
        <div className="flex h-[69px] shrink-0 items-center px-[22px] min-[1100px]:group-data-[compact=true]/sidebar:justify-center min-[1100px]:group-data-[compact=true]/sidebar:px-0">
          <Brand labelClassName={hideWhenCompact} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg text-soft hover:bg-surface-soft hover:text-fg min-[1100px]:hidden"
          >
            <CloseIcon />
          </button>
        </div>

        <nav aria-label="Main" className="flex-1 overflow-y-auto px-[11px] pb-[18px] pt-3 [scrollbar-width:thin]">
          <p className={`px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[0.09em] text-muted ${hideWhenCompact}`}>
            Main
          </p>
          <div className="grid gap-[3px]">
            {mainNav.map((item) => (
              <NavLink key={item.href} item={item} onNavigate={onClose} />
            ))}
          </div>

          {navGroups.map((group) => {
            const open = openGroups.includes(group.title);
            return (
              <div key={group.title} className="mt-[9px]">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  aria-expanded={open}
                  className={`flex w-full items-center justify-between px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[0.09em] text-muted ${hideWhenCompact}`}
                >
                  {group.title}
                  <ChevronDownIcon size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {(compact || open) && (
                  <div className="grid gap-[3px]">
                    {group.items.map((item) => (
                      <NavLink key={item.href} item={item} onNavigate={onClose} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}