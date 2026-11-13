import { Suspense } from "react";
import { KioskApp } from "@/src/components/kiosk/kiosk-app";

// The front-desk tablet opens /kiosk?token=... (the link from the Overview or Control Panel).
// There is no login here: src/proxy.ts only guards /dashboard, and the API checks the token on every call.
export default function KioskPage() {
  return (
    <Suspense fallback={null}>
      <KioskApp />
    </Suspense>
  );
}
