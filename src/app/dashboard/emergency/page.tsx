import type { Metadata } from "next";
import { EmergencyPage } from "@/src/components/emergency/emergency-page";

export const metadata: Metadata = { title: "Emergency | SPS" };

// These pages load their data in the browser, so they can't be rendered ahead of time. Opts out of instant-navigation validation.
export const instant = false;

export default function Emergency() {
  return <EmergencyPage />;
}
