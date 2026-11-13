import type { DocumentType } from "@/src/lib/mock-documents";

const types: Record<DocumentType, string> = {
  NDA: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  "Safety Briefing": "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "Wi-Fi Policy": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Other: "bg-slate-500/10 text-soft",
};

export function DocumentTypeBadge({ type }: { type: DocumentType }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${types[type]}`}>{type}</span>;
}

export function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-green-600/20 bg-green-600/10 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:text-green-400">
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-transparent bg-slate-500/10 px-2 py-0.5 text-[11px] font-medium text-soft">
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-slate-400" />
      Inactive
    </span>
  );
}
