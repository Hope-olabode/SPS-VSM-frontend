import { PageLoader } from "@/src/components/ui/page-loader";

/** Shown while the kiosk page loads */
export default function Loading() {
  return <PageLoader fullScreen label="Getting the kiosk ready…" />;
}
