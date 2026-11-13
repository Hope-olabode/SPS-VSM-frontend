import type { Metadata } from "next";
import { EventsPage } from "@/src/components/events/events-page";

export const metadata: Metadata = { title: "Events | SPS" };

// These pages load their data in the browser, so they can't be rendered ahead of time. Opts out of instant-navigation validation.
export const instant = false;

export default function Events() {
  return <EventsPage />;
}