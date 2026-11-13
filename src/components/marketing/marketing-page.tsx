"use client";

import { useEffect, useMemo, useState } from "react";
import { InfoIcon } from "@/src/components/icons";
import { api, type ApiSmsCampaign, type ApiSmsContact, errorMessage } from "@/src/lib/api";
import type { VisitorType } from "@/src/lib/mock-visitors";
import { composeMessage, normalizeNigerianPhone, parseNumbers, type SmsSendRequest, type SmsSendResponse, smsInfo } from "@/src/lib/sms";
import { AudiencePicker } from "./audience-picker";
import { CampaignHistory } from "./campaign-history";
import { MessageComposer } from "./message-composer";

export type Contact = { phone: string; name: string; company: string; type: VisitorType };
export type Campaign = { id: string; sentAt: string; message: string; recipients: number; segments: number; testMode: boolean; sentBy?: string };

const toCampaign = (c: ApiSmsCampaign): Campaign => ({
  id: c.id,
  message: c.message,
  recipients: c.recipients,
  segments: c.segments,
  testMode: c.testMode,
  sentBy: c.sentBy,
  sentAt: new Date(c.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
});

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-5 py-4 [box-shadow:var(--shadow)]">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

/**
 * Send one SMS to many people. The audience is everyone who has visited (GET /api/sms/contacts) plus any numbers typed in.
 * Sending is POST /api/sms/send, which checks the role again, delivers, and records the campaign and the audit event.
 */
export function MarketingPage() {
  const [people, setPeople] = useState<ApiSmsContact[]>([]);
  const [contactsError, setContactsError] = useState("");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [manualText, setManualText] = useState("");
  const [body, setBody] = useState("");
  const [optOut, setOptOut] = useState(true);
  const [consent, setConsent] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [mode, setMode] = useState<"live" | "dry-run" | null>(null);

  // one entry per phone number, so someone who visited twice is only messaged once
  const { contacts, skipped } = useMemo(() => {
    const byPhone = new Map<string, Contact>();
    let skipped = 0;
    people.forEach((person) => {
      const phone = normalizeNigerianPhone(person.phone);
      if (!phone) skipped++;
      else if (!byPhone.has(phone)) byPhone.set(phone, { phone, name: person.name, company: person.company, type: person.type as VisitorType });
    });
    return { contacts: [...byPhone.values()], skipped };
  }, [people]);

  const manual = useMemo(() => parseNumbers(manualText), [manualText]);
  const recipients = useMemo(() => [...new Set([...selected, ...manual.valid])], [selected, manual.valid]);
  const finalText = composeMessage(body, optOut);
  const info = smsInfo(finalText);

  // is a real SMS provider connected, or will sends only be pretend? (GET /api/sms/mode)
  // The audience (GET /api/sms/contacts) and the recent campaigns (GET /api/sms/campaigns) load the same way.
  useEffect(() => {
    api<{ mode: "live" | "dry-run" }>("/sms/mode")
      .then((data) => setMode(data.mode))
      .catch(() => setMode(null));
    api<{ items: ApiSmsContact[] }>("/sms/contacts")
      .then((data) => setPeople(data.items))
      .catch((err) => setContactsError(errorMessage(err, "Couldn't load your contacts.")));
    api<{ items: ApiSmsCampaign[] }>("/sms/campaigns")
      .then((data) => setCampaigns(data.items.map(toCampaign)))
      .catch(() => {});
  }, []);

  // the toast disappears by itself
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  async function send() {
    setSending(true);
    setError("");
    try {
      const request: SmsSendRequest = { message: finalText, recipients };
      const data = await api<SmsSendResponse>("/sms/send", { method: "POST", body: request });

      const accepted = data.accepted ?? 0;
      const testMode = data.mode !== "live";
      // the API recorded the campaign and the audit event; show it at the top straight away
      setCampaigns((current) => [
        { id: `c-${Date.now()}`, sentAt: toCampaign({ id: "", message: "", recipients: 0, failed: 0, segments: 0, testMode, createdAt: new Date().toISOString() }).sentAt, message: finalText, recipients: accepted, segments: data.segments ?? info.segments, testMode },
        ...current,
      ]);
      const failed = data.failed ?? 0;
      setNotice(
        testMode
          ? `Test mode: ${accepted} messages were not really sent`
          : failed > 0
            ? `Sent to ${accepted}. ${failed} could not be sent`
            : `Message sent to ${accepted} ${accepted === 1 ? "person" : "people"}`,
      );
      setBody("");
      setSelected(new Set());
      setManualText("");
      setConsent(false);
    } catch (err) {
      setError(errorMessage(err, "The message could not be sent."));
    } finally {
      setSending(false);
      setConfirming(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-[7px] text-[21px] font-bold leading-tight tracking-[-0.035em] sm:text-[25px]">Marketing</h1>
        <p className="text-xs text-soft">Send SMS messages to your visitors and contacts</p>
      </div>

      {mode === "dry-run" && (
        <p role="status" className="flex items-start gap-2.5 rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
          <InfoIcon size={16} className="mt-px shrink-0" />
          <span>
            <b className="font-semibold">Test mode.</b> No SMS provider is connected yet, so nothing you send here will reach a phone.
          </span>
        </p>
      )}

      {contactsError && (
        <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-600 dark:text-red-300">
          {contactsError} You can still type numbers in by hand.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label="Recipients" value={recipients.length} />
        <Tile label="SMS per person" value={info.segments} />
        <Tile label="Total SMS" value={recipients.length * info.segments} />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <AudiencePicker
          contacts={contacts}
          skipped={skipped}
          selected={selected}
          onSelectedChange={setSelected}
          manualText={manualText}
          onManualTextChange={setManualText}
          manual={manual}
        />
        <MessageComposer
          body={body}
          onBodyChange={setBody}
          optOut={optOut}
          onOptOutChange={setOptOut}
          consent={consent}
          onConsentChange={setConsent}
          finalText={finalText}
          info={info}
          recipientCount={recipients.length}
          confirming={confirming}
          onConfirmingChange={setConfirming}
          sending={sending}
          error={error}
          onSend={send}
        />
      </div>

      <CampaignHistory campaigns={campaigns} />

      <p
        role="status"
        aria-live="polite"
        className={notice ? "fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-fg px-4 py-2.5 text-xs font-medium text-surface shadow-lg" : "sr-only"}
      >
        {notice}
      </p>
    </div>
  );
}
