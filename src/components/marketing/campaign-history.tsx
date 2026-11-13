import { ClockIcon } from "@/src/components/icons";
import type { Campaign } from "./marketing-page";

export function CampaignHistory({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <section className="rounded-xl border border-line bg-surface [box-shadow:var(--shadow)]" aria-label="Recent campaigns">
      <header className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          <ClockIcon size={18} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Recent campaigns</h2>
          <p className="text-xs text-soft">Every send is also recorded in the Audit Trail.</p>
        </div>
      </header>

      {campaigns.length === 0 ? (
        <p className="px-5 py-10 text-center text-xs text-muted">Nothing sent yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {campaigns.map((campaign) => (
            <li key={campaign.id} className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <p className="min-w-0 truncate text-xs" title={campaign.message}>
                {campaign.message.replace(/\n/g, " ")}
              </p>
              <p className="shrink-0 text-[11px] text-muted">
                {campaign.recipients} {campaign.recipients === 1 ? "person" : "people"} · {campaign.segments} SMS · {campaign.sentAt}{campaign.sentBy ? ` · ${campaign.sentBy}` : ""}
                {campaign.testMode && <span className="ml-2 rounded bg-amber-500/10 px-1.5 py-0.5 font-medium text-amber-700 dark:text-amber-300">Test</span>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
