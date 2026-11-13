import type { Metadata } from "next";
import type { ReactNode } from "react";

// The registration link carries a secret in its address: keep it out of search engines and out of Referer headers.
export const metadata: Metadata = {
  title: "Event registration",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen flex-1 flex-col bg-page text-fg">{children}</div>;
}
