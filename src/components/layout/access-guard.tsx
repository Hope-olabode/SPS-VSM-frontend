"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useCurrentUser } from "@/src/components/dashboard/current-user-provider";
import { LockIcon } from "@/src/components/icons";
import { accessFor } from "@/src/lib/nav";
import { hasAccess } from "@/src/lib/mock-users";

/**
 * Blocks a page the signed-in role may not open, even when the link is typed in by hand.
 * This only hides the UI. The real checks are on the server: every route that needs a role uses
 * requireRole(...) in backend/src/routes (users, locations, documents, watchlist, sms, audit).
 * When you add a page to nav.ts with `access`, add the matching requireRole to its API route.
 */
export function AccessGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useCurrentUser();

  if (hasAccess(user.role, accessFor(pathname))) return <>{children}</>;

  return (
    <section role="alert" className="mx-auto mt-10 max-w-md rounded-xl border border-line bg-surface p-8 text-center [box-shadow:var(--shadow)]">
      <span className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full bg-surface-soft text-muted">
        <LockIcon size={20} />
      </span>
      <h1 className="mb-1.5 text-base font-bold">You don&apos;t have access to this page</h1>
      <p className="mb-5 text-xs text-soft">
        Your role ({user.role}) can&apos;t open this part of the dashboard. Ask an admin if you think that&apos;s a mistake.
      </p>
      <Link href="/dashboard" className="text-xs font-semibold text-brand hover:text-brand-hover">
        Back to Overview
      </Link>
    </section>
  );
}
