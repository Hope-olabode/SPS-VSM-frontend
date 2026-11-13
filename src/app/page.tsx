import { redirect } from "next/navigation";

// The dashboard is the home page; src/proxy.ts sends signed-out users to the login page.
export default function Home() {
  redirect("/dashboard");
}
