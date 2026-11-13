"use client";

import { InfoIcon, MessageIcon, SendIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { inputClass } from "@/src/components/ui/field";
import { Toggle } from "@/src/components/ui/toggle";
import { MAX_RECIPIENTS, MAX_SEGMENTS, messageTemplates, OPT_OUT_LINE, type SmsInfo } from "@/src/lib/sms";

type MessageComposerProps = {
  body: string;
  onBodyChange: (text: string) => void;
  optOut: boolean;
  onOptOutChange: (value: boolean) => void;
  consent: boolean;
  onConsentChange: (value: boolean) => void;
  /** Exactly what will be sent (message plus the opt-out line) */
  finalText: string;
  info: SmsInfo;
  recipientCount: number;
  confirming: boolean;
  onConfirmingChange: (value: boolean) => void;
  sending: boolean;
  error: string;
  onSend: () => void;
};

export function MessageComposer(props: MessageComposerProps) {
  const { body, onBodyChange, optOut, onOptOutChange, consent, onConsentChange, finalText, info, recipientCount } = props;
  const { confirming, onConfirmingChange, sending, error, onSend } = props;

  const tooLong = info.segments > MAX_SEGMENTS;
  const tooMany = recipientCount > MAX_RECIPIENTS;
  const canSend = recipientCount > 0 && finalText.length > 0 && !tooLong && !tooMany && consent && !sending;

  const hint = !recipientCount
    ? "Choose who to send to"
    : !finalText
      ? "Write a message"
      : tooLong
        ? "Shorten the message"
        : tooMany
          ? `Choose ${MAX_RECIPIENTS} people or fewer`
          : !consent
            ? "Confirm consent to send"
            : "";

  return (
    <section className="rounded-xl border border-line bg-surface [box-shadow:var(--shadow)]" aria-label="Message">
      <header className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          <MessageIcon size={18} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Message</h2>
          <p className="text-xs text-soft">Write the text message. Everyone you chose gets the same one.</p>
        </div>
      </header>

      <div className="space-y-5 px-5 py-5">
        <div>
          <label htmlFor="mk-template" className="mb-2 block text-[13px] font-semibold text-fg">
            Start from a template
          </label>
          <select
            id="mk-template"
            value=""
            onChange={(event) => {
              const template = messageTemplates.find((item) => item.label === event.target.value);
              if (template) onBodyChange(template.text);
            }}
            className={`${inputClass} px-3`}
          >
            <option value="">Choose a template (optional)</option>
            {messageTemplates.map((template) => (
              <option key={template.label} value={template.label}>
                {template.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="mk-body" className="mb-2 block text-[13px] font-semibold text-fg">
            Message
          </label>
          <textarea
            id="mk-body"
            rows={5}
            value={body}
            onChange={(event) => onBodyChange(event.target.value)}
            aria-describedby="mk-count"
            aria-invalid={tooLong}
            placeholder="Type your message here..."
            className="w-full min-w-0 resize-y rounded-lg border border-line-strong bg-surface-soft px-3.5 py-2.5 text-sm text-fg transition placeholder:text-muted hover:border-brand/40 focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20 aria-invalid:border-red-500"
          />
          <p id="mk-count" className={`mt-1.5 text-[11px] ${tooLong ? "text-red-500" : "text-muted"}`}>
            {info.units} characters · {info.segments} SMS ({info.encoding})
            {tooLong && ` · too long, the limit is ${MAX_SEGMENTS} SMS`}
            {info.encoding === "Unicode" && !tooLong && " · an emoji or curly quote makes each SMS shorter"}
          </p>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold">Add an opt-out line</p>
            <p className="mt-0.5 text-xs text-soft">Adds &ldquo;{OPT_OUT_LINE}&rdquo; to the end. Your SMS provider needs to handle STOP replies.</p>
          </div>
          <Toggle checked={optOut} onChange={onOptOutChange} label="Add an opt-out line" />
        </div>

        <div aria-label="Message preview">
          <p className="mb-2 text-[13px] font-semibold">Preview</p>
          <div className="max-w-[88%] whitespace-pre-wrap break-words rounded-2xl rounded-bl-sm bg-surface-soft px-4 py-3 text-[13px] leading-relaxed">
            {finalText || <span className="text-muted">Your message will appear here.</span>}
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line bg-surface-soft p-3.5">
          <input type="checkbox" checked={consent} onChange={(event) => onConsentChange(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand" />
          <span className="text-xs text-soft">
            <b className="font-semibold text-fg">These people agreed to receive marketing messages.</b> Under the NDPA 2023 you need their consent before sending
            promotional SMS.
          </span>
        </label>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3.5 py-2.5 text-xs text-red-600 dark:text-red-400">
            <InfoIcon size={15} className="mt-px shrink-0" />
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-soft">
            {recipientCount > 0 && info.segments > 0 ? (
              <>
                <b className="font-semibold text-fg">{recipientCount * info.segments}</b> SMS in total ({recipientCount} {recipientCount === 1 ? "person" : "people"} × {info.segments})
              </>
            ) : (
              hint
            )}
          </p>

          {confirming ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-soft">
                Send to {recipientCount} {recipientCount === 1 ? "person" : "people"}?
              </span>
              <Button onClick={onSend} disabled={!canSend}>
                {sending ? "Sending..." : "Yes, send"}
              </Button>
              <Button variant="ghost" onClick={() => onConfirmingChange(false)} disabled={sending}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button onClick={() => onConfirmingChange(true)} disabled={!canSend} title={hint || undefined}>
              <SendIcon size={15} />
              Send Message
            </Button>
          )}
        </div>
        {hint && recipientCount > 0 && finalText && <p className="-mt-3 text-right text-[11px] text-muted">{hint}</p>}
      </div>
    </section>
  );
}
