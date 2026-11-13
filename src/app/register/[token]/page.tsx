import { Suspense } from "react";
import { PublicRegistration } from "@/src/components/events/public-registration";

// Open to everyone who has the link: src/proxy.ts only guards /dashboard, and the API checks the token in the address.
export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <PublicRegistration />
    </Suspense>
  );
}
