import type { Metadata } from "next";
import { CheckInFlow } from "../../../components/check-in/check-in-flow";

export const metadata: Metadata = { title: "Check In | SPS" };
export const instant = false;

export default function CheckInPage() {
  return <CheckInFlow />;
}