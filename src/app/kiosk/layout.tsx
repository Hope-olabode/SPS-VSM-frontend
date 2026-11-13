import type { Metadata } from "next";
import type { ReactNode } from "react";

// The kiosk link carries a secret token in its address, so keep it out of search engines and out of Referer headers.
export const metadata: Metadata = {
  title: "Visitor Check-In",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function KioskLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen flex-1 flex-col bg-page text-fg">{children}</div>;
}
