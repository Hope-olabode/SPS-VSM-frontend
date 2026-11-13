"use client";

import { useEffect, useState } from "react";
import { ClockIcon, UserCheckIcon, UsersIcon, UserXIcon } from "@/src/components/icons";
import { api } from "@/src/lib/api";
import { Greeting } from "./greeting";
import { StatCard, type Tone } from "./stat-card";
import { useCurrentUser } from "./current-user-provider";
import { isInBuilding, wasAdmitted } from "@/src/lib/mock-visitors";
import { useVisitors } from "./visitors-provider";

/** The signed-in user's name, for the overview greeting */
export function OverviewGreeting() {
  const { user } = useCurrentUser();
  return <Greeting name={user.name} />;
}

/** Counts worked out from the live visitor list (GET /api/visitors) */
export function OverviewStats() {
  const { visitors } = useVisitors();
  // how many pre-registered visitors are expected today (GET /api/pre-registrations/summary)
  const [expectedToday, setExpectedToday] = useState(0);
  useEffect(() => {
    api<{ expectedToday: number }>("/pre-registrations/summary")
      .then((data) => setExpectedToday(data.expectedToday))
      .catch(() => {});
  }, []);
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const todays = visitors.filter((visitor) => visitor.checkIn.date === today && wasAdmitted(visitor));

  const stats = [
    { label: "Visitors Today", value: todays.length, href: "/dashboard/visitors", icon: UsersIcon, tone: "green" },
    { label: "Currently Onsite", value: visitors.filter(isInBuilding).length, href: "/dashboard/visitors", icon: UserCheckIcon, tone: "teal" },
    { label: "Checked Out", value: todays.filter((v) => v.status === "left").length, href: "/dashboard/visitors", icon: UserXIcon, tone: "slate" },
    { label: "Pre-Registered", value: expectedToday, href: "/dashboard/pre-registration", icon: ClockIcon, tone: "amber" },
  ] satisfies { label: string; value: number; href: string; icon: typeof UsersIcon; tone: Tone }[];

  return (
    <section className="mb-5 grid grid-cols-2 gap-[11px] sm:gap-4 min-[1100px]:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </section>
  );
}
