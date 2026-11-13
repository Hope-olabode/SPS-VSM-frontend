/** Country codes the phone fields offer. Keep in step with PHONE_CODES in backend/src/utils/phone.js. */
export const phoneCountries = [
  { code: "+234", name: "Nigeria", iso: "NG" },
  { code: "+233", name: "Ghana", iso: "GH" },
  { code: "+27", name: "South Africa", iso: "ZA" },
  { code: "+254", name: "Kenya", iso: "KE" },
  { code: "+44", name: "United Kingdom", iso: "GB" },
  { code: "+1", name: "United States / Canada", iso: "US" },
  { code: "+229", name: "Benin", iso: "BJ" },
  { code: "+228", name: "Togo", iso: "TG" },
  { code: "+225", name: "Côte d'Ivoire", iso: "CI" },
  { code: "+221", name: "Senegal", iso: "SN" },
  { code: "+237", name: "Cameroon", iso: "CM" },
  { code: "+255", name: "Tanzania", iso: "TZ" },
  { code: "+256", name: "Uganda", iso: "UG" },
  { code: "+250", name: "Rwanda", iso: "RW" },
  { code: "+251", name: "Ethiopia", iso: "ET" },
  { code: "+20", name: "Egypt", iso: "EG" },
  { code: "+212", name: "Morocco", iso: "MA" },
  { code: "+971", name: "United Arab Emirates", iso: "AE" },
  { code: "+966", name: "Saudi Arabia", iso: "SA" },
  { code: "+91", name: "India", iso: "IN" },
  { code: "+86", name: "China", iso: "CN" },
  { code: "+81", name: "Japan", iso: "JP" },
  { code: "+61", name: "Australia", iso: "AU" },
  { code: "+33", name: "France", iso: "FR" },
  { code: "+49", name: "Germany", iso: "DE" },
  { code: "+39", name: "Italy", iso: "IT" },
  { code: "+34", name: "Spain", iso: "ES" },
  { code: "+31", name: "Netherlands", iso: "NL" },
  { code: "+55", name: "Brazil", iso: "BR" },
  { code: "+52", name: "Mexico", iso: "MX" },
] as const;

export const phoneCodes = phoneCountries.map((country) => country.code);
export const DEFAULT_PHONE_CODE = "+234";

/** The most digits worth typing after the country code: Nigerian numbers are 10 (a leading 0 is dropped), others fill the 15 digits an international number can have. */
export const maxPhoneDigits = (code: string) => (code === "+234" ? 10 : 15 - (code.length - 1));
/** The fewest digits that can be a real number: 10 for Nigeria, 6 for anywhere else */
export const minPhoneDigits = (code: string) => (code === "+234" ? 10 : 6);

/** "+447911123456" -> { phoneCode: "+44", phone: "7911123456" } */
export function splitPhoneNumber(full: string) {
  const code = [...phoneCodes].sort((a, b) => b.length - a.length).find((c) => full.startsWith(c));
  return code ? { phoneCode: code as string, phone: full.slice(code.length) } : { phoneCode: DEFAULT_PHONE_CODE, phone: full.replace(/\D/g, "") };
}

/** "+447911123456" -> "+44 7911123456"; Nigerian numbers are grouped like "+234 801 234 5678" */
export function formatFullPhone(full: string) {
  if (!full.startsWith("+")) return "Removed";
  const { phoneCode, phone } = splitPhoneNumber(full);
  const grouped = phoneCode === "+234" && phone.length === 10 ? `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}` : phone;
  return `${phoneCode} ${grouped}`;
}
