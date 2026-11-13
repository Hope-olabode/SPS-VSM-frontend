import type { Metadata } from "next";
import { AuditTrailPage } from "@/src/components/audit/audit-trail-page";

export const metadata: Metadata = { title: "Audit Trail | SPS" };

// These pages load their data in the browser, so they can't be rendered ahead of time. Opts out of instant-navigation validation.
export const instant = false;

export default function AuditTrail() {
  return <AuditTrailPage />;
}
