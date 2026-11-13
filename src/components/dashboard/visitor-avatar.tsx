const tones = [
  "bg-slate-700",
  "bg-zinc-800",
  "bg-emerald-800",
  "bg-teal-800",
  "bg-green-800",
  "bg-cyan-900",
  "bg-rose-900",
  "bg-amber-900",
];

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/** Initials avatar; the same name always gets the same color. */
export function VisitorAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const tone = tones[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % tones.length];

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-1 ring-black/5 dark:ring-white/10 ${tone} ${
        size === "md" ? "h-9 w-9 text-xs" : "h-7 w-7 text-[10px]"
      }`}
    >
      {initialsOf(name)}
    </span>
  );
}