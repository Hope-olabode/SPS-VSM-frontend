// Used by the Marketing page. The API has its own copy of the length rules in backend/src/utils/sms.js.

export const MAX_RECIPIENTS = 500;
/** Longer messages cost more, so the page stops people at this many SMS parts. */
export const MAX_SEGMENTS = 4;
export const OPT_OUT_LINE = "Reply STOP to opt out.";

/* ───────── phone numbers ───────── */

/**
 * Turns the ways people write a Nigerian mobile number into +234XXXXXXXXXX, or returns null if it
 * can't be a mobile number.
 *   0801 234 5678 | +234 801 234 5678 | 2348012345678 | 8012345678  ->  +2348012345678
 */
export function normalizeNigerianPhone(raw: string): string | null {
  let digits = raw.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;

  if (digits.startsWith("234") && digits.length === 13) digits = digits.slice(3);
  else if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  else if (digits.length !== 10) return null;

  // Nigerian mobile numbers start 70x, 80x, 81x, 90x or 91x
  return /^[789][01]\d{8}$/.test(digits) ? `+234${digits}` : null;
}

/** Splits free text (commas, spaces, new lines) into numbers that are valid and ones that are not. */
export function parseNumbers(text: string) {
  const valid = new Set<string>();
  const invalid: string[] = [];
  // a number can contain spaces (0801 234 5678), so split on commas, semicolons and new lines only
  text
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const phone = normalizeNigerianPhone(part);
      if (phone) valid.add(phone);
      else invalid.push(part);
    });
  return { valid: [...valid], invalid };
}

/* ───────── message length ───────── */

const GSM_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_EXTENDED = "^{}\\[~]|€"; // these take two characters' room

export type SmsInfo = { units: number; segments: number; encoding: "GSM-7" | "Unicode" };

/** How many SMS parts a message will be billed as. One emoji or curly quote switches the whole message to Unicode. */
export function smsInfo(text: string): SmsInfo {
  if (!text) return { units: 0, segments: 0, encoding: "GSM-7" };

  let units = 0;
  let gsm = true;
  for (const char of text) {
    if (GSM_BASIC.includes(char)) units += 1;
    else if (GSM_EXTENDED.includes(char)) units += 2;
    else {
      gsm = false;
      break;
    }
  }

  if (gsm) return { units, segments: units <= 160 ? 1 : Math.ceil(units / 153), encoding: "GSM-7" };
  units = text.length;
  return { units, segments: units <= 70 ? 1 : Math.ceil(units / 67), encoding: "Unicode" };
}

/** The text that is actually sent. */
export const composeMessage = (body: string, optOut: boolean) => {
  const text = body.trim();
  return optOut && text ? `${text}\n${OPT_OUT_LINE}` : text;
};

export const messageTemplates = [
  { label: "Event invitation", text: "You're invited to our upcoming event at the building. Reserve your spot today." },
  { label: "Office announcement", text: "Notice: building services will be updated this week. Please check with reception for details." },
  { label: "Thank you for visiting", text: "Thank you for visiting us. We hope to see you again soon." },
] as const;

/* ───────── what POST /api/sms/send accepts and returns ───────── */

export type SmsSendRequest = { message: string; recipients: string[] };

export type SmsSendResponse = {
  ok: boolean;
  /** "dry-run" means nothing was actually delivered (no SMS provider is configured) */
  mode?: "live" | "dry-run";
  accepted?: number;
  failed?: number;
  invalid?: number;
  segments?: number;
  error?: string;
};
