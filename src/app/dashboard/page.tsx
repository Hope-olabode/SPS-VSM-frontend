import Link from "next/link";
import { ComplianceBanner } from "@/src/components/dashboard/compliance-banner";
import { KioskLinkCard } from "@/src/components/dashboard/kiosk-link-card";
import { OverviewGreeting, OverviewStats } from "@/src/components/dashboard/overview-stats";
import { RecentVisitors } from "@/src/components/dashboard/recent-visitors";
import { UserPlusIcon } from "@/src/components/icons";

// These pages load their data in the browser, so they can't be rendered ahead of time. Opts out of instant-navigation validation.
export const instant = false;

export default function OverviewPage() {
  return (
    <>
      <ComplianceBanner />

      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <OverviewGreeting />
          <p className="text-[13px] text-soft">Here&apos;s what&apos;s happening at your front desk today.</p>
        </div>
        <Link
          href="/dashboard/check-in"
          className="inline-flex min-h-[41px] items-center justify-center gap-2 rounded-lg bg-brand px-[17px] text-sm font-semibold text-white shadow-[0_3px_8px_rgba(22,163,74,0.22)] transition hover:-translate-y-px hover:bg-brand-hover dark:text-[#04130a] sm:text-[13px]"
        >
          <UserPlusIcon />
          New Check-In
        </Link>
      </section>

      <OverviewStats />

      <KioskLinkCard />
      <RecentVisitors />
    </>
  );
}
