"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type ApiKioskLink, errorMessage } from "@/src/lib/api";

export type KioskLink = {
  /** The link the kiosk tablet opens. null while loading, or when it can't be shown any more (regenerate it). */
  url: string | null;
  /** The 6-digit code the tablet must be given before the kiosk shows anything. null while loading, or when it can't be shown any more. */
  code: string | null;
  loading: boolean;
  error: string;
  /** POST /api/settings/kiosk/regenerate: turns the old link off and switches to the new one. Rejects with the server's message. */
  regenerate: () => Promise<void>;
  /** POST /api/settings/kiosk/code/regenerate: a new code; tablets unlocked with the old one ask for it again. */
  regenerateCode: () => Promise<void>;
};

/**
 * This location's kiosk link from GET /api/settings/kiosk (admins only: the API says no to everyone else).
 * Pass enabled = false to skip the request, for example when the signed-in user isn't an admin.
 */
export function useKioskLink(enabled = true): KioskLink {
  const [url, setUrl] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    api<ApiKioskLink>("/settings/kiosk")
      .then((data) => {
        if (cancelled) return;
        setUrl(data.url);
        setCode(data.code ?? null);
        setError("");
      })
      .catch((err) => !cancelled && setError(errorMessage(err, "Couldn't load the kiosk link.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const regenerate = useCallback(async () => {
    const data = await api<ApiKioskLink>("/settings/kiosk/regenerate", { method: "POST" });
    setUrl(data.url);
    setError("");
  }, []);

  const regenerateCode = useCallback(async () => {
    const data = await api<{ code: string }>("/settings/kiosk/code/regenerate", { method: "POST" });
    setCode(data.code);
    setError("");
  }, []);

  return { url, code, loading, error, regenerate, regenerateCode };
}
