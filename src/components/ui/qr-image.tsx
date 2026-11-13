import { useMemo } from "react";
import { qrToSvg } from "@/src/lib/qr";

type QrImageProps = {
  /** The text the QR code holds, e.g. a pass code like PR-605309 */
  value: string;
  /** Width and height in pixels */
  size?: number;
  /** Read out by screen readers. Defaults to "QR code for <value>". */
  label?: string;
  className?: string;
};

/** A scannable QR code, drawn here in the browser (no image is fetched). It always sits on white so it scans in dark mode too. */
export function QrImage({ value, size = 200, label, className = "" }: QrImageProps) {
  const text = label ?? `QR code for ${value}`;
  const src = useMemo(() => {
    try {
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrToSvg(value, text))}`;
    } catch {
      return null; // text too long for a QR code
    }
  }, [value, text]);

  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element -- an inline SVG data URL: nothing to optimise
  return <img src={src} width={size} height={size} alt={text} className={`rounded-lg border border-line bg-white ${className}`} />;
}
