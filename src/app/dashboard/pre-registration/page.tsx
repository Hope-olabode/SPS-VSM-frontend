import type { Metadata } from "next";
import { PreRegistrationPage } from "@/src/components/pre-registration/pre-registration";

export const metadata: Metadata = { title: "Pre-Registration | SPS" };

// These pages load their data in the browser, so they can't be rendered ahead of time. Opts out of instant-navigation validation.
export const instant = false;

export default function PreRegistration() {
  return <PreRegistrationPage />;
}
