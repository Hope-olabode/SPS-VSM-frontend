"use client";

import { useState } from "react";
import { api, ApiError, type ApiPreRegistration } from "@/src/lib/api";
import { useCurrentUser } from "../dashboard/current-user-provider";
import { useSettings } from "../dashboard/settings-provider";
import { useVisitors } from "../dashboard/visitors-provider";
import { CheckIcon, QrCodeIcon } from "../icons";
import { Button } from "../ui/button";
import { ConfirmStep } from "./confirm-step";
import { DetailsStep } from "./details-step";
import { PhotoStep } from "./photo-step";
import { QrModal } from "./qr-modal";
import { Stepper } from "./stepper";
import { isAdminRole } from "@/src/lib/mock-users";
import { emptyVisitor, type VisitorForm, visitorTypes } from "./types";

export function CheckInFlow() {
  const [step, setStep] = useState(1);
  const [visitor, setVisitor] = useState<VisitorForm>(emptyVisitor);
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  // set when staff scan a pass: the form is filled in from it, and the check-in uses the pass up
  const [pass, setPass] = useState<ApiPreRegistration | null>(null);
  const [formKey, setFormKey] = useState(0); // the form keeps what was typed, so a scanned pass starts a fresh one
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { refresh } = useVisitors();
  const { settings } = useSettings();
  const { user } = useCurrentUser();

  function reset() {
    setVisitor(emptyVisitor);
    setPhoto(null);
    setSignature(null);
    setStep(1);
    setComplete(false);
    setError("");
    setPass(null);
    setFormKey((key) => key + 1);
  }

  /** The scanner found a pre-registered visitor: fill in the first step from the pass and start over from there */
  function fillFromPass(item: ApiPreRegistration) {
    const [firstName = "", ...rest] = item.name.trim().split(/\s+/);
    setVisitor({
      firstName,
      lastName: rest.join(" "),
      // the pass keeps the country code and the number apart, and so does the form
      phoneCode: item.phoneCode || "+234",
      phone: (item.phone ?? "").replace(/\D/g, ""),
      company: item.company,
      visitorType: visitorTypes.find((type) => type === item.visitorType) ?? "Guest",
      residentCompany: item.residentCompany,
      host: item.host ?? "",
      purpose: item.purpose ?? "",
      notes: "",
    });
    setPhoto(null);
    setSignature(null);
    setPass(item);
    setStep(1);
    setComplete(false);
    setError("");
    setFormKey((key) => key + 1);
    setQrOpen(false);
  }

  async function finish() {
    if (submitting) return; // already saving: ignore a second press
    setSubmitting(true);
    setError("");
    try {
      // POST /api/visitors saves the photo (JPEG data URL) and signature (PNG data URL) as files on the server
      await api("/visitors", {
        method: "POST",
        body: {
          firstName: visitor.firstName,
          lastName: visitor.lastName,
          phoneCode: visitor.phoneCode,
          phone: visitor.phone,
          company: visitor.company,
          visitorType: visitor.visitorType,
          residentCompany: visitor.residentCompany,
          hostName: visitor.host,
          purpose: visitor.purpose,
          notes: visitor.notes,
          photo: photo ?? undefined,
          signature: signature ?? undefined,
          preRegistrationId: pass?.id,
        },
      });
      setComplete(true);
      void refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't check the visitor in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[820px]">
      <div className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
        <div>
          <h1 className="mb-[7px] text-[21px] font-bold leading-tight tracking-[-0.035em] sm:text-[25px]">Visitor Check-In</h1>
          <p className="text-[13px] text-soft">Register a new visitor</p>
        </div>
        <Button onClick={() => setQrOpen(true)} className="shrink-0 px-3 sm:px-4">
          <QrCodeIcon size={16} /> Scan QR
        </Button>
      </div>

      <Stepper step={complete ? 4 : step} />

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      {pass && !complete && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-brand/30 bg-brand-soft px-3.5 py-2.5 text-[13px]">
          <p>
            Filled in from pass <strong className="font-mono">{pass.qrCode}</strong> for {pass.name}.
            {visitor.phone === "" && " Add their phone number to continue."}
          </p>
          <button type="button" onClick={reset} className="shrink-0 font-semibold text-brand hover:underline">
            Not them? Clear
          </button>
        </div>
      )}

      <div className="rounded-[11px] border border-line bg-surface px-4 py-5 [box-shadow:var(--shadow)] sm:p-7">
        {complete ? (
          <div className="flex flex-col items-center px-2.5 py-7 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-green-600 text-white">
              <CheckIcon size={28} />
            </span>
            <h3 className="mt-4 text-[19px] font-semibold">Visitor checked in</h3>
            <p className="mb-[22px] mt-[7px] text-soft">The visitor has been registered successfully.</p>
            <Button onClick={reset}>Check In Another Visitor</Button>
          </div>
        ) : step === 1 ? (
          <DetailsStep
            key={formKey}
            visitor={visitor}
            canAddCompany={isAdminRole(user.role)}
            onNext={(values) => {
              setVisitor(values);
              setStep(2);
            }}
          />
        ) : step === 2 ? (
          <PhotoStep
            photo={photo}
            required={settings.requirePhoto}
            onPhotoChange={setPhoto}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        ) : (
          <ConfirmStep
            visitor={visitor}
            signature={signature}
            signatureRequired={settings.requireSignature}
            onSignatureChange={setSignature}
            onBack={() => setStep(2)}
            onFinish={finish}
            submitting={submitting}
          />
        )}
      </div>

      <QrModal open={qrOpen} onClose={() => setQrOpen(false)} onUse={fillFromPass} />
    </div>
  );
}