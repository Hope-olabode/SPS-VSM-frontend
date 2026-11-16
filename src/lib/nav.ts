import type { ComponentType } from "react";
import {
  ActivityIcon,
  ArchiveIcon,
  CalendarIcon,
  ClipboardIcon,
  DashboardIcon,
  DocumentIcon,
  type IconProps,
  MegaphoneIcon,
  PinIcon,
  ReportIcon,
  SettingsIcon,
  ShieldIcon,
  UserPlusIcon,
  UsersIcon,
  WarningIcon,
} from "../components/icons";
import { type Access, hasAccess } from "./mock-users";

export type NavItemData = {
  label: string;
  href: string;
  icon: ComponentType<IconProps>;
  /** Shows a live count next to the label (the sidebar knows how to work each one out) */
  badge?: "pendingClearance";
  /** Who may open this page. Leave out for "everyone signed in". */
  access?: Access;
};

/** `access` on a group applies to every item in it. */
export type NavGroup = { title: string; items: NavItemData[]; access?: Access };

export const mainNav: NavItemData[] = [
  { label: "Overview", href: "/dashboard", icon: DashboardIcon },
  { label: "Check In", href: "/dashboard/check-in", icon: UserPlusIcon },
  { label: "Visitor Log", href: "/dashboard/visitors", icon: ClipboardIcon, badge: "pendingClearance" },
  { label: "Pre-Registration", href: "/dashboard/pre-registration", icon: UsersIcon },
  { label: "Events", href: "/dashboard/events", icon: CalendarIcon },
  { label: "Marketing", href: "/dashboard/marketing", icon: MegaphoneIcon, access: "marketing" },
];

export const navGroups: NavGroup[] = [
  {
    title: "Operations",
    items: [
      { label: "Analytics", href: "/dashboard/analytics", icon: ActivityIcon },
      { label: "Reports", href: "/dashboard/reports", icon: ReportIcon },
      { label: "Audit Trail", href: "/dashboard/audit-trail", icon: ClipboardIcon, access: "admin" }, // GET /api/audit is admin-only
      { label: "Watchlist", href: "/dashboard/watchlist", icon: ShieldIcon },
      { label: "Emergency", href: "/dashboard/emergency", icon: WarningIcon },
    ],
  },
  {
    title: "Administration",
    access: "admin",
    items: [
      { label: "Control Panel", href: "/dashboard/control-panel", icon: SettingsIcon, access: "globalAdmin" }, // PUT /api/settings and the kiosk code routes are global-admin-only
      { label: "Users", href: "/dashboard/users", icon: UserPlusIcon },
      { label: "Documents", href: "/dashboard/documents", icon: DocumentIcon },
      { label: "Locations", href: "/dashboard/locations", icon: PinIcon },
      { label: "Old Records", href: "/dashboard/old-records", icon: ArchiveIcon, access: "globalAdmin" }, // GET /api/old-records is global-admin-only
    ],
  },
];

/** Every page, with the group's access rule copied onto each item. */
export const allNav: NavItemData[] = [
  ...mainNav,
  ...navGroups.flatMap((group) => group.items.map((item) => ({ ...item, access: item.access ?? group.access }))),
];

/** What the sidebar shows for this role. */
export const visibleMainNav = (role: string) => mainNav.filter((item) => hasAccess(role, item.access));
export const visibleNavGroups = (role: string) =>
  navGroups
    .filter((group) => hasAccess(role, group.access))
    .map((group) => ({ ...group, items: group.items.filter((item) => hasAccess(role, item.access)) }));

/** The access a page needs, so a pasted or bookmarked link can be blocked too, not just hidden. */
export const accessFor = (pathname: string): Access | undefined => allNav.find((item) => isActive(pathname, item.href))?.access;

/** Overview must match exactly, otherwise it would be "active" on every dashboard page. */
export function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}