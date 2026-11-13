"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BellIcon,
  BuildingIcon,
  ChevronDownIcon,
  FeedbackIcon,
  LogoutIcon,
  MenuIcon,
  MoonIcon,
  PanelIcon,
  SettingsIcon,
  SunIcon,
} from "../icons";
import { useAccountSettings } from "../account/account-settings-provider";
import { useCurrentUser } from "../dashboard/current-user-provider";
import { useLocations } from "../dashboard/locations-provider";
import { useNotifications } from "../dashboard/notifications-provider";
import { Popover } from "../ui/popover";
import { errorMessage } from "../../lib/api";
import { useTheme } from "../../hooks/useTheme";
import { allNav, isActive } from "../../lib/nav";

const iconButton =
  "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-soft transition hover:bg-surface-soft hover:text-fg";
const menuItem =
  "flex w-full items-center gap-[9px] rounded-[7px] p-[9px] text-left text-soft transition hover:bg-surface-soft hover:text-fg";

function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-700 font-semibold text-white ${
        large ? "h-10 w-10" : "h-[34px] w-[34px]"
      }`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

type TopbarProps = { compact: boolean; onToggleSidebar: () => void; onOpenMobileNav: () => void };

export function Topbar({ compact, onToggleSidebar, onOpenMobileNav }: TopbarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useCurrentUser();
  const { openAccountSettings } = useAccountSettings();
  const { locations, active, setActive } = useLocations();
  const { items: notifications, unread, permission, enableDesktop, markAllRead } = useNotifications();
  // only a global admin can work in another location, and only when there is another one to pick
  const choices = locations.filter((location) => location.status === "active");
  const canSwitch = user.role === "GLOBAL ADMIN" && locations.length > 1;
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState("");

  const switchTo = async (id: string, close: () => void) => {
    if (id === active.id) return close();
    setSwitchingTo(id);
    setSwitchError("");
    try {
      await setActive(id); // reloads the page when it works, so there is nothing to reset on success
    } catch (err) {
      setSwitchingTo(null);
      setSwitchError(errorMessage(err, "Couldn't switch location. Please try again."));
    }
  };
  const currentLabel = allNav.find((item) => isActive(pathname, item.href))?.label ?? "Overview";

  return (
    <header className="print:hidden sticky top-0 z-20 flex h-[62px] items-center justify-between border-b border-line bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] px-4 sm:h-[69px] sm:px-[30px] sm:backdrop-blur-md">
      {/* Left: navigation controls + breadcrumb */}
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onOpenMobileNav} aria-label="Open navigation" className={`${iconButton} min-[1100px]:hidden`}>
          <MenuIcon />
        </button>
        <button
          type="button"
          onClick={onToggleSidebar}
          title={compact ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
          className={`${iconButton} hidden min-[1100px]:inline-flex`}
        >
          <PanelIcon />
        </button>
        <span className="hidden h-[21px] w-px bg-line-strong min-[1100px]:block" />

        <div className="min-w-0">
          {canSwitch ? (
            <Popover
              panelClassName="left-0 w-[275px] max-sm:fixed max-sm:inset-x-4 max-sm:top-[68px] max-sm:w-auto"
              trigger={({ open, toggle }) => (
                <button
                  type="button"
                  onClick={toggle}
                  aria-expanded={open}
                  aria-haspopup="listbox"
                  aria-label={`Location: ${active.name}. Change location`}
                  className="flex max-w-full items-center gap-[7px] rounded-lg px-1 py-[7px] text-[13px] text-soft"
                >
                  <BuildingIcon size={16} className="shrink-0 text-brand" />
                  <span className="truncate max-sm:max-w-[120px]">{active.name}</span>
                  <ChevronDownIcon size={14} className="shrink-0" />
                </button>
              )}
            >
              {({ close }) => (
                <>
                  <p className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted">Active location</p>
                  <div role="listbox" aria-label="Locations">
                    {choices.map((location) => (
                      <button
                        key={location.id}
                        type="button"
                        role="option"
                        aria-selected={location.id === active.id}
                        disabled={switchingTo !== null}
                        onClick={() => void switchTo(location.id, close)}
                        className={`flex w-full items-center gap-2.5 rounded-lg p-2.5 text-left transition disabled:cursor-wait ${
                          location.id === active.id ? "bg-brand-soft" : "hover:bg-surface-soft"
                        }`}
                      >
                        <BuildingIcon className={location.id === active.id ? "text-brand" : "text-muted"} />
                        <span className="grid flex-1">
                          <b className="font-semibold">{location.name}</b>
                          <small className="mt-[3px] text-muted">{location.city}</small>
                        </span>
                        {switchingTo === location.id ? (
                          <span role="status" className="text-[11px] text-muted">
                            Switching…
                          </span>
                        ) : (
                          location.primary && <span className="text-[9px] font-bold text-brand">HQ</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {switchError && (
                    <p role="alert" className="px-2 pb-1 pt-2 text-xs text-red-500">
                      {switchError}
                    </p>
                  )}
                </>
              )}
            </Popover>
          ) : (
            <span className="flex items-center gap-[7px] px-1 py-[7px] text-[13px] text-soft">
              <BuildingIcon size={16} className="shrink-0 text-brand" />
              <span className="truncate max-sm:max-w-[140px]">{active.name}</span>
            </span>
          )}
        </div>
        <span className="hidden text-muted sm:inline">/</span>
        <span className="hidden text-[13px] font-medium sm:inline">{currentLabel}</span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-[3px]">
        <Popover
          panelClassName="right-0 w-80 max-sm:fixed max-sm:inset-x-4 max-sm:top-[68px] max-sm:w-auto"
          trigger={({ open, toggle }) => (
            <button type="button" onClick={toggle} aria-expanded={open} aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"} className={`${iconButton} relative`}>
              <BellIcon />
              {unread > 0 && (
                <span className="absolute right-0.5 top-0.5 grid min-w-[16px] place-items-center rounded-full bg-red-600 px-1 text-[9px] font-bold leading-4 text-white">{unread > 99 ? "99+" : unread}</span>
              )}
            </button>
          )}
        >
          <div className="flex justify-between border-b border-line px-[9px] pb-3 pt-2">
            <b className="font-semibold">Notifications</b>
            <button type="button" onClick={markAllRead} disabled={unread === 0} className="text-[11px] text-brand disabled:cursor-default disabled:opacity-40">
              Mark all as read
            </button>
          </div>

          {permission === "default" && (
            <div className="flex items-center justify-between gap-3 border-b border-line bg-brand-soft px-[9px] py-2.5 text-[11px]">
              <span>Get a pop-up on your screen for every new action.</span>
              <button type="button" onClick={() => void enableDesktop()} className="shrink-0 rounded bg-brand px-2 py-1 font-semibold text-white dark:text-[#04130a]">
                Turn on
              </button>
            </div>
          )}
          {permission === "denied" && (
            <p className="border-b border-line px-[9px] py-2.5 text-[11px] text-muted">Desktop notifications are blocked for this site. Allow them in the browser&apos;s site settings to get pop-ups.</p>
          )}

          {notifications.length === 0 ? (
            <div className="grid justify-items-center gap-[7px] px-2 pb-[22px] pt-7 text-soft">
              <span className="mb-1 grid h-10 w-10 place-items-center rounded-full bg-surface-soft text-muted">
                <BellIcon />
              </span>
              <b className="font-semibold">You&apos;re all caught up</b>
              <small className="text-muted">New activity will show up here.</small>
            </div>
          ) : (
            <ul className="max-h-[360px] divide-y divide-line overflow-y-auto">
              {notifications.map((item) => (
                <li key={item.id} className="px-[9px] py-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <b className="text-xs font-semibold">{item.title}</b>
                    <time dateTime={item.createdAt} className="shrink-0 text-[10px] text-muted">
                      {new Date(item.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </time>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-soft">{item.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Popover>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className={iconButton}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>

        <button type="button" aria-label="Send feedback" className={`${iconButton} mr-2 hidden sm:inline-flex`}>
          <FeedbackIcon />
        </button>

        <Popover
          panelClassName="right-0 w-[235px]"
          trigger={({ open, toggle }) => (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              className="flex items-center gap-2.5 border-l border-line pl-2 sm:pl-4"
            >
              <span className="hidden text-right leading-tight sm:grid">
                <b className="text-xs font-semibold">{user.name}</b>
                <small className="mt-0.5 text-[9px] tracking-[0.025em] text-muted">
                  {user.org} · {user.role}
                </small>
              </span>
              <Avatar name={user.name} />
            </button>
          )}
        >
          {({ close }) => (
            <>
              <div className="mb-[5px] flex items-center gap-2.5 border-b border-line px-2 pb-[13px] pt-[7px]">
                <Avatar name={user.name} large />
                <span className="grid min-w-0">
                  <b className="font-semibold">{user.name}</b>
                  <small className="mt-[3px] truncate text-muted">{user.email}</small>
                </span>
              </div>
              {/* Account settings is a modal that opens over the current page, so there is no settings page to go to */}
              <button
                type="button"
                onClick={() => {
                  close();
                  openAccountSettings("profile");
                }}
                className={menuItem}
              >
                <SettingsIcon /> Account settings
              </button>
              <button
                type="button"
                onClick={() => {
                  close();
                  void signOut();
                }}
                className={`${menuItem} !text-red-500`}
              >
                <LogoutIcon /> Sign out
              </button>
            </>
          )}
        </Popover>
      </div>
    </header>
  );
}