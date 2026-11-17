"use client";

import { type FormEvent, type KeyboardEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import { PreRegStatusBadge } from "@/src/components/pre-registration/prereg-status-badge";
import { api, type ApiPreRegistration, type ApiPreRegistrationLookup, errorMessage } from "@/src/lib/api";
import { formatExpectedDate } from "@/src/lib/mock-preregistrations";
import { CloseIcon, QrCodeIcon } from "../icons";
import { Button } from "../ui/button";
import { inputClass } from "../ui/field";

type QrModalProps = {
  open: boolean;
  onClose: () => void;
  /** Staff chose to check this pre-registered visitor in */
  onUse: (item: ApiPreRegistration) => void;
};

// BarcodeDetector is built into Chrome (Android, Mac, ChromeOS), Edge and Safari, but TypeScript doesn't know it.
// Chrome on Windows and Linux, and Firefox, don't have it (or can't read QR codes with it), so those browsers use the jsqr library instead.
type Detector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type DetectorConstructor = (new (options?: { formats: string[] }) => Detector) & { getSupportedFormats?: () => Promise<string[]> };

/** Returns a function that reads a QR code from the current video frame (or null when there is none) */
export async function createReader(): Promise<(video: HTMLVideoElement) => Promise<string | null>> {
  const Native = (window as unknown as { BarcodeDetector?: DetectorConstructor }).BarcodeDetector;
  if (Native) {
    const formats = (await Native.getSupportedFormats?.().catch(() => undefined)) ?? ["qr_code"];
    if (formats.includes("qr_code")) {
      const detector = new Native({ formats: ["qr_code"] });
      return async (video) => (await detector.detect(video))[0]?.rawValue ?? null;
    }
  }
  const { default: jsQR } = await import("jsqr");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  return async (video) => {
    if (!context || !video.videoWidth || !video.videoHeight) return null;
    const scale = Math.min(1, 640 / video.videoWidth); // a smaller picture is read much faster and is plenty for a QR code
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(frame.data, frame.width, frame.height, { inversionAttempts: "dontInvert" })?.data ?? null;
  };
}

const PASS_CODE = /PR-\d{6}/i;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

type Camera = "starting" | "live" | "denied" | "unavailable";

const cameraSupported = () => typeof window !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
type Found = { item: ApiPreRegistration; expectedToday: boolean };

export function QrModal({ open, onClose, onUse }: QrModalProps) {
  // mounted only while open, so every opening starts with a fresh camera and an empty result
  return open ? <Scanner onClose={onClose} onUse={onUse} /> : null;
}

function Scanner({ onClose, onUse }: Omit<QrModalProps, "open">) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false); // true while a code is being looked up or its result is on screen
  const lastBadRef = useRef({ value: "", at: 0 });

  const [camera, setCamera] = useState<Camera>(() => (cameraSupported() ? "starting" : "unavailable"));
  const [looking, setLooking] = useState(false);
  const [found, setFound] = useState<Found | null>(null);
  const [message, setMessage] = useState("");
  const [typed, setTyped] = useState("");

  /** GET /api/pre-registrations/lookup: the scan, or a typed code, ends up here */
  const lookup = useCallback(async (code: string) => {
    busyRef.current = true;
    setLooking(true);
    setMessage("");
    try {
      const data = await api<ApiPreRegistrationLookup>(`/pre-registrations/lookup?code=${encodeURIComponent(code)}`);
      setFound({ item: data.item, expectedToday: data.expectedToday });
    } catch (err) {
      setMessage(errorMessage(err, "Couldn't look that pass up. Please try again."));
      busyRef.current = false;
    } finally {
      setLooking(false);
    }
  }, []);

  /** What the camera read: anything that isn't one of our passes is ignored (the same one is only reported once every few seconds) */
  const onScan = useCallback(
    (raw: string) => {
      if (busyRef.current) return;
      const match = PASS_CODE.exec(raw);
      if (match) return void lookup(match[0].toUpperCase());
      const now = Date.now();
      if (lastBadRef.current.value === raw && now - lastBadRef.current.at < 3000) return;
      lastBadRef.current = { value: raw, at: now };
      setMessage("That QR code isn't a visitor pass from this system.");
    },
    [lookup],
  );
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  // lock page scroll while open, and hand focus back on close
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // with a keyboard (a desk computer) the code box is ready for a handheld scanner, which types the code and presses Enter
    if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  // the camera: opened while the modal is open, always switched off again
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) return; // needs HTTPS or localhost; the box for typing a code is shown instead
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stream: MediaStream | undefined;

    (async () => {
      try {
        const read = await createReader();
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        const video = videoRef.current;
        if (stopped || !video) return stream.getTracks().forEach((track) => track.stop());
        video.srcObject = stream;
        await video.play().catch(() => {});
        setCamera("live");

        const tick = async () => {
          if (stopped) return;
          if (!busyRef.current && video.readyState >= 2) {
            try {
              const code = await read(video);
              if (code && !stopped) onScanRef.current(code);
            } catch {
              // a frame that can't be read is just skipped
            }
          }
          timer = setTimeout(tick, 250);
        };
        void tick();
      } catch (err) {
        if (!stopped) setCamera(err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError") ? "denied" : "unavailable");
      }
    })();

    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function submitTyped(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current) return;
    const match = PASS_CODE.exec(typed);
    if (!match) return setMessage("Enter a pass code like PR-123456.");
    setTyped("");
    void lookup(match[0].toUpperCase());
  }

  function scanAnother() {
    busyRef.current = false;
    setFound(null);
    setMessage("");
    inputRef.current?.focus({ preventScroll: true });
  }

  // Escape closes; Tab stays inside the dialog
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const items = [...(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter((item) => item.offsetParent !== null);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/65 p-5 backdrop-blur-[6px]"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className="relative my-auto flex w-full max-w-[440px] flex-col items-center rounded-[20px] border border-line bg-surface p-[30px] text-center shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 grid h-[34px] w-[34px] place-items-center rounded-lg text-soft hover:bg-surface-soft hover:text-fg"
        >
          <CloseIcon />
        </button>

        <span className="grid h-[62px] w-[62px] place-items-center rounded-full bg-brand-soft text-brand">
          <QrCodeIcon size={34} />
        </span>
        <h2 id={titleId} className="mt-3.5 text-xl font-semibold">
          Scan visitor QR
        </h2>

        {found ? (
          <FoundPass found={found} onUse={() => onUse(found.item)} onScanAnother={scanAnother} />
        ) : (
          <>
            <p className="mt-[7px] max-w-[330px] text-sm leading-[1.55] text-soft">
              {camera === "unavailable" || camera === "denied"
                ? "Scan the pass with a handheld scanner, or type the code printed under the QR."
                : "Hold the visitor's QR code in front of the camera to retrieve their registration."}
            </p>

            {/* the camera picture; the green frame is only a guide, the whole picture is read */}
            {camera !== "unavailable" && camera !== "denied" && (
              <div className="relative my-5 h-[240px] w-[240px] overflow-hidden rounded-[18px] border-2 border-brand bg-black">
                <video ref={videoRef} muted playsInline aria-label="Camera view for scanning a QR code" className="h-full w-full object-cover" />
                {camera === "starting" && <p className="absolute inset-0 grid place-items-center px-4 text-xs text-white/80">Starting the camera…</p>}
                {looking && <p className="absolute inset-0 grid place-items-center bg-black/60 text-xs font-medium text-white">Looking up the pass…</p>}
              </div>
            )}
            {camera === "denied" && (
              <p role="alert" className="mt-4 text-xs text-amber-600 dark:text-amber-300">
                The camera is blocked. Allow camera access for this site in the browser, or type the code below.
              </p>
            )}
            {camera === "unavailable" && (
              <p className="mt-4 text-xs text-muted">This browser can&apos;t scan with the camera (or the page isn&apos;t secure), so use the box below.</p>
            )}

            <form onSubmit={submitTyped} className="mt-4 flex w-full items-center gap-2">
              <label htmlFor="pass-code" className="sr-only">
                Pass code
              </label>
              <input
                ref={inputRef}
                id="pass-code"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                placeholder="PR-123456"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className={`${inputClass} font-mono uppercase`}
              />
              <Button type="submit" disabled={typed.trim() === ""} loading={looking} className="shrink-0">
                {looking ? "Looking…" : "Look up"}
              </Button>
            </form>

            {message && (
              <p role="alert" className="mt-3 text-xs text-red-500">
                {message}
              </p>
            )}

            <Button variant="secondary" onClick={onClose} className="mt-5">
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: string }) {
  if (!children) return null;
  return (
    <div className="flex justify-between gap-4 py-1 text-[13px]">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium">{children}</dd>
    </div>
  );
}

/** The pass that was scanned: who is expected, and whether they can be checked in now */
function FoundPass({ found, onUse, onScanAnother }: { found: Found; onUse: () => void; onScanAnother: () => void }) {
  const { item, expectedToday } = found;
  const blocked =
    item.status === "checked_in"
      ? "This visitor has already checked in with this pass."
      : item.status === "checked_out"
        ? "This pass was already used and the visitor has left."
        : item.status === "cancelled"
          ? "This pre-registration was cancelled."
          : "";
  const when = `${formatExpectedDate(item.expectedDate)}${item.expectedTime ? `, ${item.expectedTime}` : ""}`;

  return (
    <div className="mt-4 w-full">
      <p className="break-words text-lg font-bold leading-tight">{item.name}</p>
      <div className="mt-2 flex justify-center">
        <PreRegStatusBadge status={item.status} />
      </div>

      <dl className="mt-4 divide-y divide-line rounded-lg border border-line px-3.5 py-1.5 text-left">
        <Detail label="Pass code">{item.qrCode}</Detail>
        <Detail label="Visiting">{item.residentCompany}</Detail>
        <Detail label="Host">{item.host ?? ""}</Detail>
        <Detail label="Company">{item.company}</Detail>
        <Detail label="Expected">{when}</Detail>
        <Detail label="Purpose">{item.purpose ?? ""}</Detail>
      </dl>

      {blocked && (
        <p role="alert" className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-300">
          {blocked}
        </p>
      )}
      {!blocked && !expectedToday && (
        <p role="alert" className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-300">
          This visit is for {formatExpectedDate(item.expectedDate)}, not today. Check them in only if they are here now.
        </p>
      )}

      <div className="mt-5 flex justify-center gap-2.5">
        {!blocked && <Button onClick={onUse}>{expectedToday ? "Start check-in" : "Check in anyway"}</Button>}
        <Button variant="secondary" onClick={onScanAnother}>
          Scan another
        </Button>
      </div>
    </div>
  );
}
