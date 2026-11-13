import type { Metadata } from "next";
import { DocumentsPage } from "@/src/components/documents/documents-page";

export const metadata: Metadata = { title: "Documents & NDAs | SPS" };

// These pages load their data in the browser, so they can't be rendered ahead of time. Opts out of instant-navigation validation.
export const instant = false;

export default function Documents() {
  return <DocumentsPage />;
}
