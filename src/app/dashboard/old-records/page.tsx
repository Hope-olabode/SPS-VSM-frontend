import type { Metadata } from "next";
import { OldRecordsPage } from "@/src/components/old-records/old-records-page";

export const metadata: Metadata = { title: "Old Records | SPS" };

// These pages load their data in the browser, so they can't be rendered ahead of time. Opts out of instant-navigation validation.
export const instant = false;

export default function OldRecords() {
  return <OldRecordsPage />;
}
