import type { Metadata } from "next";
import { AnalyticsPage } from "@/src/components/analytics/analytics-page";

export const metadata: Metadata = { title: "Analytics | SPS" };

// These pages load their data in the browser, so they can't be rendered ahead of time. Opts out of instant-navigation validation.
export const instant = false;

export default function Analytics() {
  return <AnalyticsPage />;
}
