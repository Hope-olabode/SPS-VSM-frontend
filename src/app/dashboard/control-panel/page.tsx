import type { Metadata } from "next";
import { ControlPanelPage } from "@/src/components/control-panel/control-panel-page";

export const metadata: Metadata = { title: "Control Panel | SPS" };

// These pages load their data in the browser, so they can't be rendered ahead of time. Opts out of instant-navigation validation.
export const instant = false;

export default function ControlPanel() {
  return <ControlPanelPage />;
}
