"use client";

import { useSyncExternalStore } from "react";

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const subscribe = () => () => {};
const getSnapshot = () => greetingFor(new Date().getHours());
const getServerSnapshot = () => "Welcome back"; // neutral text until the browser knows the local time

export function Greeting({ name }: { name: string }) {
  const greeting = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return (
    <h1 className="mb-[7px] text-[21px] font-bold leading-tight tracking-[-0.035em] sm:text-[25px]">
      {greeting}, {name}
    </h1>
  );
}