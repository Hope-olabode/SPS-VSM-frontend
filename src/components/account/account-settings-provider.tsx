"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { AccountSettingsModal, type AccountTab } from "./account-settings-modal";

type AccountSettingsContextValue = { openAccountSettings: (tab?: AccountTab) => void };

const AccountSettingsContext = createContext<AccountSettingsContextValue | null>(null);

/**
 * Lives in app/dashboard/layout.tsx. Account Settings is a modal, not a page, so it opens on top of
 * whatever page the person is already on, and closing it leaves them exactly where they were.
 */
export function AccountSettingsProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<AccountTab | null>(null);
  const [notice, setNotice] = useState("");

  const openAccountSettings = useCallback((next: AccountTab = "profile") => setTab(next), []);

  // the toast disappears by itself
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  return (
    <AccountSettingsContext.Provider value={{ openAccountSettings }}>
      {children}
      {tab && <AccountSettingsModal tab={tab} onTabChange={setTab} onClose={() => setTab(null)} onNotice={setNotice} />}
      <p
        role="status"
        aria-live="polite"
        className={notice ? "fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-lg bg-fg px-4 py-2.5 text-xs font-medium text-surface shadow-lg" : "sr-only"}
      >
        {notice}
      </p>
    </AccountSettingsContext.Provider>
  );
}

export function useAccountSettings() {
  const context = useContext(AccountSettingsContext);
  if (!context) throw new Error("useAccountSettings must be used inside <AccountSettingsProvider>");
  return context;
}
