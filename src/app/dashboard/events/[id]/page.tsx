import type { Metadata } from "next";
import { Suspense } from "react";
import { EventDetailsPage } from "@/src/components/events/event-details-page";

export const metadata: Metadata = { title: "Event details | SPS" };

// These pages load their data in the browser, so they can't be rendered ahead of time. Opts out of instant-navigation validation.
export const instant = false;

export default function EventDetails() {
  return (
    <Suspense fallback={null}>
      <EventDetailsPage />
    </Suspense>
  );
}
