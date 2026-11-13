import type { Metadata } from "next";
import { VisitorLog } from "../../../components/visitors/visitor-log";

export const metadata: Metadata = { title: "Visitor Log | SPS" };

// These pages load their data in the browser, so they can't be rendered ahead of time. Opts out of instant-navigation validation.
export const instant = false;

export default function VisitorsPage() {
  return <VisitorLog />;
}