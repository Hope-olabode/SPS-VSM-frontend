"use client";

import { type ReactNode, useState } from "react";
import { ApprovalBanner } from "@/src/components/dashboard/approval-banner";
import { ClearanceBanner } from "@/src/components/dashboard/clearance-banner";
import { AccessGuard } from "./access-guard";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

/** Holds the sidebar state shared by the sidebar and the top bar. */
export function DashboardShell({ children }: { children: ReactNode }) {
  const [compact, setCompact] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-page font-[family-name:var(--font-outfit)] text-fg antialiased">
      <Sidebar compact={compact} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div
        className={`min-h-screen transition-[margin] duration-200 print:ml-0 ${
          compact ? "min-[1100px]:ml-[76px]" : "min-[1100px]:ml-[252px]"
        }`}
      >
        <Topbar
          compact={compact}
          onToggleSidebar={() => setCompact((current) => !current)}
          onOpenMobileNav={() => setMobileOpen(true)}
        />
        <main className="mx-auto max-w-[1520px] px-4 pb-[30px] pt-[18px] sm:px-[30px] sm:pb-[42px] sm:pt-6">
          {/* Show on every dashboard page until every waiting approval and clearance is resolved */}
          <div className="print:hidden">
            <ApprovalBanner />
            <ClearanceBanner />
          </div>
          <AccessGuard>{children}</AccessGuard>
        </main>
      </div>
    </div>
  );
}