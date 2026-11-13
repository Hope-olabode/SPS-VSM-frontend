import type { Metadata } from "next";
import { LocationsPage } from "@/src/components/locations/locations-page";

export const metadata: Metadata = { title: "Locations | SPS" };

// These pages load their data in the browser, so they can't be rendered ahead of time. Opts out of instant-navigation validation.
export const instant = false;

export default function Locations() {
  return <LocationsPage />;
}
