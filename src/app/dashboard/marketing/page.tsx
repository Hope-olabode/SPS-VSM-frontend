import type { Metadata } from "next";
import { MarketingPage } from "@/src/components/marketing/marketing-page";

export const metadata: Metadata = { title: "Marketing | SPS" };

// These pages load their data in the browser, so they can't be rendered ahead of time. Opts out of instant-navigation validation.
export const instant = false;

export default function Marketing() {
  return <MarketingPage />;
}
