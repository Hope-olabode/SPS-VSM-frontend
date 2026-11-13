import type { Metadata } from "next";
import { WatchlistPage } from "@/src/components/watchlist/watchlist-page";

export const metadata: Metadata = { title: "Watchlist | SPS" };

// These pages load their data in the browser, so they can't be rendered ahead of time. Opts out of instant-navigation validation.
export const instant = false;

export default function Watchlist() {
  return <WatchlistPage />;
}
