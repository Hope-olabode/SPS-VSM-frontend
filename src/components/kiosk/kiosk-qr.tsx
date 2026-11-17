"use client";

import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { type ApiKioskConfig, type ApiKioskPass, errorMessage } from "@/src/lib/api";
import { createReader } from "../check-in/qr-modal";
import type { VisitorForm } from "../check-in/types";
import { visitorTypes } from "../check-in/types";
import { QrCodeIcon } from "../icons";
import { Button } from "../ui/button";
import { inputClass } from "../ui/field";
import { PhoneInput } from "../ui/phone-input";
import { minPhoneDigits } from "@/src/lib/phone-codes";
import type { Call, CheckInResult } from "./kiosk-types";
import { KioskWizard } from "./kiosk-wizard";

const PASS_CODE = /PR-\d{6}/i;
/** After a pass that can't be used, the camera waits this long before it reads again (the visitor is still holding the same code up) */
const RETRY_AFTER_MS = 3_000;

type Found = { code: string; pass: ApiKioskPass };
type Camera = "starting" | "live" | "denied" | "unavailable";

const cameraSupported = () => typeof window !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

/**
 * QR Express Check-In: scan the pass (or type the code under it), and the visitor goes straight to the photo and signature.
 * The pass already holds their name, host and company, so there is no details form.
 */
export function KioskQrCheckIn({ config, call, onCancel, onDone }: { config: ApiKioskConfig; call: Call; onCancel: () => void; onDone: (result: CheckInResult) => void }) {
  const [found, setFound] = useState<Found | null>(null);
  /** the pass has no phone number saved: ask for it before the photo */
  const [phone, setPhone] = useState<{ phoneCode: string; phone: string } | null>(null);

  if (!found) return <ScanStep call={call} onCancel={onCancel} onFound={setFound} />;

  if (found.pass.needsPhone && phone === null) {
    return <PhoneStep name={found.pass.visitor.firstName} onBack={() => setFound(null)} onCancel={onCancel} onNext={setPhone} />;
  }

  const { visitor } = found.pass;
  const initialVisitor: VisitorForm = {
    firstName: visitor.firstName,
    lastName: visitor.lastName,
    phoneCode: phone?.phoneCode ?? "+234",
    phone: phone?.phone ?? "",
    company: visitor.company,
    visitorType: visitorTypes.find((type) => type === visitor.visitorType) ?? "Guest",
    residentCompany: visitor.residentCompany,
    host: visitor.host,
    purpose: visitor.purpose,
    notes: "",
  };

  return (
    <KioskWizard
      config={config}
      title="QR Express Check-In"
      initialVisitor={initialVisitor}
      startStep={2}
      banner={
        <p>
          Welcome, <strong>{visitor.firstName}</strong>. We found your pass{visitor.residentCompany ? ` for ${visitor.residentCompany}` : ""}
          {visitor.host ? ` (host: ${visitor.host})` : ""}.
        </p>
      }
      onBack={() => setFound(null)}
      onCancel={onCancel}
      submit={(_visitor, photo, signature) =>
        call<CheckInResult>("/pass-check-in", {
          method: "POST",
          body: { code: found.code, phoneCode: phone?.phoneCode, phone: phone?.phone, photo: photo ?? undefined, signature: signature ?? undefined },
        })
      }
      onDone={onDone}
    />
  );
}

function ScanStep({ call, onCancel, onFound }: { call: Call; onCancel: () => void; onFound: (found: Found) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const busyRef = useRef(false); // true while a code is being looked up, or just after one was refused
  const [camera, setCamera] = useState<Camera>(() => (cameraSupported() ? "starting" : "unavailable"));
  const [looking, setLooking] = useState(false);
  const [message, setMessage] = useState("");
  const [typed, setTyped] = useState("");

  const lookup = useCallback(
    async (code: string) => {
      busyRef.current = true;
      setLooking(true);
      setMessage("");
      try {
        const pass = await call<ApiKioskPass>("/pass-lookup", { method: "POST", body: { code } });
        onFound({ code, pass });
      } catch (err) {
        setMessage(errorMessage(err, "Couldn't check that pass. Please try again, or see the front desk."));
        window.setTimeout(() => (busyRef.current = false), RETRY_AFTER_MS);
      } finally {
        setLooking(false);
      }
    },
    [call, onFound],
  );

  const lookupRef = useRef(lookup);
  useEffect(() => {
    lookupRef.current = lookup;
  }, [lookup]);

  // the camera: a tablet on a stand faces the visitor, so it is the front camera; always switched off again
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) return; // needs HTTPS (or localhost); the box for typing the code is there instead
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stream: MediaStream | undefined;

    (async () => {
      try {
        const read = await createReader();
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "user" } }, audio: false });
        const video = videoRef.current;
        if (stopped || !video) return stream.getTracks().forEach((track) => track.stop());
        video.srcObject = stream;
        await video.play().catch(() => {});
        setCamera("live");

        const tick = async () => {
          if (stopped) return;
          if (!busyRef.current && video.readyState >= 2) {
            try {
              const raw = await read(video);
              const match = raw ? PASS_CODE.exec(raw) : null;
              if (match && !stopped) void lookupRef.current(match[0].toUpperCase());
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

  function submitTyped(event: FormEvent) {
    event.preventDefault();
    if (busyRef.current) return;
    const match = PASS_CODE.exec(typed);
    if (!match) return setMessage("Enter the code under the QR, like PR-123456.");
    setTyped("");
    void lookup(match[0].toUpperCase());
  }

  const showCamera = camera !== "unavailable" && camera !== "denied";

  return (
    <div className="mx-auto mt-4 flex w-full max-w-[480px] flex-col items-center text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-soft text-brand">
        <QrCodeIcon size={34} />
      </span>
      <h1 className="mt-3 text-[24px] font-bold tracking-[-0.035em]">QR Express Check-In</h1>
      <p className="mt-1.5 max-w-[360px] text-sm text-soft">{showCamera ? "Hold your QR pass up to the camera." : "Type the code printed under your QR pass."}</p>

      {showCamera && (
        <div className="relative my-5 h-[280px] w-[280px] overflow-hidden rounded-[20px] border-2 border-brand bg-black">
          <video ref={videoRef} muted playsInline aria-label="Camera view for scanning your QR pass" className="h-full w-full -scale-x-100 object-cover" />
          {camera === "starting" && <p className="absolute inset-0 grid place-items-center px-4 text-xs text-white/80">Starting the camera…</p>}
          {looking && <p className="absolute inset-0 grid place-items-center bg-black/60 text-sm font-medium text-white">Checking your pass…</p>}
        </div>
      )}
      {camera === "denied" && <p role="alert" className="mt-4 text-xs text-amber-600 dark:text-amber-300">The camera is blocked on this tablet, so please type the code below.</p>}

      <form onSubmit={submitTyped} className="mt-4 flex w-full items-center gap-2">
        <label htmlFor="kiosk-pass-code" className="sr-only">
          Pass code
        </label>
        <input
          id="kiosk-pass-code"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          placeholder="PR-123456"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className={`${inputClass} h-12 font-mono uppercase`}
        />
        <Button type="submit" disabled={typed.trim() === ""} loading={looking} className="min-h-[48px] shrink-0">
          {looking ? "Checking…" : "Continue"}
        </Button>
      </form>

      {message && (
        <p role="alert" className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-600 dark:text-red-300">
          {message}
        </p>
      )}

      <Button variant="ghost" onClick={onCancel} className="mt-5">
        Back
      </Button>
    </div>
  );
}

function PhoneStep({ name, onBack, onCancel, onNext }: { name: string; onBack: () => void; onCancel: () => void; onNext: (phone: { phoneCode: string; phone: string }) => void }) {
  const [number, setNumber] = useState({ phoneCode: "+234", phone: "" });
  const digits = number.phone.replace(/\D/g, "");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onNext({ phoneCode: number.phoneCode, phone: digits });
      }}
      className="mx-auto mt-4 w-full max-w-[480px]"
    >
      <h1 className="text-[21px] font-bold tracking-[-0.035em]">Welcome, {name}</h1>
      <div className="mt-5 rounded-[11px] border border-line bg-surface px-4 py-5 [box-shadow:var(--shadow)] sm:p-7">
        <label htmlFor="kiosk-pass-phone" className="mb-2 block text-[13px] font-medium">
          Your pass has no phone number. Enter yours so you can check out later.
        </label>
        <PhoneInput id="kiosk-pass-phone" autoFocus required onChange={setNumber} />
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={digits.length < minPhoneDigits(number.phoneCode)}>
              Continue
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
