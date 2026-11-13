"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { api, ApiError } from "@/src/lib/api";
import { defaultSettings, type Settings } from "@/src/lib/settings";

type SettingsContextValue = {
  /** This location's settings (the defaults until they have loaded) */
  settings: Settings;
  loaded: boolean;
  error: string;
  /** PUT /api/settings (admins only). Rejects with the server's message. */
  save: (next: Settings) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * Lives in app/dashboard/layout.tsx so the Control Panel, check-in and the Visitor Log all read the same settings.
 * The server enforces them too (photo, signature, watchlist, phone masking); the screens follow them so staff see the same rules.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ settings: Settings }>("/settings")
      .then((data) => {
        setSettings(data.settings);
        setLoaded(true);
        setError("");
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load the settings."));
  }, []);

  const save = useCallback(async (next: Settings) => {
    const data = await api<{ settings: Settings }>("/settings", { method: "PUT", body: next });
    setSettings(data.settings);
  }, []);

  return <SettingsContext.Provider value={{ settings, loaded, error, save }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used inside <SettingsProvider>");
  return context;
}
