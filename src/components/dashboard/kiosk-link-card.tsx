"use client";

import { hasAccess } from "@/src/lib/mock-users";
import { useCurrentUser } from "./current-user-provider";
import { KioskUrlCard } from "./kiosk-url-card";
import { type KioskLink, useKioskLink } from "./use-kiosk-link";

const message = "mb-5 rounded-xl border border-line bg-surface px-4 py-3 text-xs text-soft [box-shadow:var(--shadow)]";

/**
 * The branch kiosk link and its QR code, for admins only (anyone with the link can use the kiosk, so staff and managers don't see it).
 * The 6-digit kiosk code is shown to global admins only; a location admin sees the link without it.
 * Pass `link` to share one useKioskLink() with the page (the Control Panel does, so Regenerate updates this card);
 * without it the card loads the link itself.
 */
export function KioskLinkCard({ link }: { link?: KioskLink }) {
  const { user } = useCurrentUser();
  const admin = hasAccess(user.role, "admin");
  const globalAdmin = hasAccess(user.role, "globalAdmin");
  const own = useKioskLink(admin && !link);
  const { url, code, loading, error } = link ?? own;

  if (!admin) return null;
  if (loading) return <p className={message}>Loading the kiosk link…</p>;
  if (error) return <p role="alert" className={`${message} text-red-600 dark:text-red-300`}>{error}</p>;
  if (!url) return <p className={message}>The kiosk link can&apos;t be shown any more. {globalAdmin ? "Regenerate it in the Control Panel to get a new one." : "Ask a global admin to regenerate it."}</p>;
  return <KioskUrlCard url={url} code={globalAdmin ? code : null} />;
}