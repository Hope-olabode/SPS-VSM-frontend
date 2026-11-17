import { PageLoader } from "@/src/components/ui/page-loader";

/** Shown inside the dashboard (sidebar and top bar stay) while a page is loading */
export default function Loading() {
  return <PageLoader label="Loading…" className="py-32" />;
}
