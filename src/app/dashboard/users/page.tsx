import type { Metadata } from "next";
import { UsersPage } from "@/src/components/users/users-page";

export const metadata: Metadata = { title: "Users | SPS" };

// These pages load their data in the browser, so they can't be rendered ahead of time. Opts out of instant-navigation validation.
export const instant = false;

export default function Users() {
  return <UsersPage />;
}
