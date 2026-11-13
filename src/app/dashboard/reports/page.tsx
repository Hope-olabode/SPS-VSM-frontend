import type { Metadata } from "next";
import { ReportsPage } from "@/src/components/reports/reports-page";

export const metadata: Metadata = { title: "Reports | SPS" };

// These pages load their data in the browser, so they can't be rendered ahead of time. Opts out of instant-navigation validation.
export const instant = false;

export default function Reports() {
  return <ReportsPage />;
}
