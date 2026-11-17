"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/src/lib/api";
import { useVisitors } from "./visitors-provider";

export type AppNotification = {
  id: string;
  action: string;
  category: "Visitor" | "Report" | "Security";
  title: string;
  body: string;
  actorId?: string;
  createdAt: string;
};

type Permission = "unsupported" | "default" | "granted" | "denied";

type NotificationsValue = {
  items: AppNotification[];
  unread: number;
  /** The browser's permission for desktop notifications (the pop-ups in the corner of the screen) */
  permission: Permission;
  /** Asks the browser for permission. It has to be called from a click. */
  enableDesktop: () => Promise<void>;
  markAllRead: () => void;
};

const NotificationsContext = createContext<NotificationsValue | null>(null);

const READ_KEY = "notifications-read-until";
const MAX_ITEMS = 50;

const supported = () => typeof window !== "undefined" && "Notification" in window;
const currentPermission = (): Permission => (supported() ? (Notification.permission as Permission) : "unsupported");

async function showDesktop(notification: AppNotification) {
  if (!supported() || Notification.permission !== "granted") return;
  const options: NotificationOptions = { body: notification.body, tag: `SPS-${notification.id}`, icon: "/favicon.ico", data: { url: "/dashboard" } };
  try {
    // a service worker can show it even when the tab is in the background, and clicking it brings the dashboard forward
    const registration = await navigator.serviceWorker?.getRegistration("/");
    if (registration) return void (await registration.showNotification(notification.title, options));
    new Notification(notification.title, options);
  } catch {
    // some browsers refuse; the bell still has it
  }
}

/**
 * Lives in app/dashboard/layout.tsx. Opens one live connection to GET /api/notifications/stream (server-sent events), so every
 * action recorded in the audit trail (a check-in, a clearance approved, ...) arrives here the moment it happens. Each one is added to
 * the bell and, when the user has allowed it, shown as a desktop notification.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [readUntil, setReadUntil] = useState(0);
  const [permission, setPermission] = useState<Permission>("unsupported");
  const seen = useRef(new Set<string>());
  const { refresh } = useVisitors();
  // the latest refresh, kept in a ref so the live connection below isn't closed and reopened each time it changes
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    setPermission(currentPermission());
    try {
      setReadUntil(Number(localStorage.getItem(READ_KEY)) || 0);
    } catch {
      // storage can be blocked; everything just counts as unread
    }
    navigator.serviceWorker?.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    // what happened recently, so the bell isn't empty when the page opens (these don't pop up)
    api<{ items: AppNotification[] }>("/notifications")
      .then((data) => {
        if (cancelled) return;
        data.items.forEach((item) => seen.current.add(item.id));
        setItems((current) => [...current, ...data.items.filter((item) => !current.some((c) => c.id === item.id))].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, MAX_ITEMS));
      })
      .catch(() => {});

    // Reload the visitor list, but not more than once every moment: several events can arrive together (a check-in and its approval)
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const reloadSoon = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => void refreshRef.current(), 300);
    };

    const stream = new EventSource("/backend/notifications/stream");
    // after a dropped connection comes back, events in between were missed, so reload once to catch up
    let opened = false;
    stream.onopen = () => {
      if (opened) reloadSoon();
      opened = true;
    };
    stream.onmessage = (message) => {
      let notification: AppNotification;
      try {
        notification = JSON.parse(message.data);
      } catch {
        return;
      }
      if (seen.current.has(notification.id)) return;
      seen.current.add(notification.id);
      setItems((current) => [notification, ...current].slice(0, MAX_ITEMS));
      void showDesktop(notification);
      // a check-in, approval, checkout request... changes the visitor list, so the dashboard updates by itself
      if (notification.category === "Visitor") reloadSoon();
    };

    // Safety net: if the live connection is blocked or buffered somewhere, the list still catches up every 30 seconds while the tab is open,
    // and straight away when the person comes back to the tab.
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") void refreshRef.current();
    }, 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") reloadSoon();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearTimeout(refreshTimer);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      stream.close();
    };
  }, []);

  const enableDesktop = useCallback(async () => {
    if (!supported()) return;
    setPermission((await Notification.requestPermission()) as Permission);
  }, []);

  const markAllRead = useCallback(() => {
    const latest = items.reduce((max, item) => Math.max(max, Date.parse(item.createdAt)), 0);
    setReadUntil(latest);
    try {
      localStorage.setItem(READ_KEY, String(latest));
    } catch {
      // not remembered after a reload, that's all
    }
  }, [items]);

  const unread = useMemo(() => items.filter((item) => Date.parse(item.createdAt) > readUntil).length, [items, readUntil]);

  const value = useMemo(() => ({ items, unread, permission, enableDesktop, markAllRead }), [items, unread, permission, enableDesktop, markAllRead]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const value = useContext(NotificationsContext);
  if (!value) throw new Error("useNotifications must be used inside NotificationsProvider");
  return value;
}
