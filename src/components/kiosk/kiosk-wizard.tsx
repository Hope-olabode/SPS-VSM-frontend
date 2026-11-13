"use client";

import { type ReactNode, useState } from "react";
import { ApiError, type ApiKioskConfig } from "@/src/lib/api";
import { ConfirmStep } from "../check-in/confirm-step";
import { DetailsStep } from "../check-in/details-step";
import { PhotoStep } from "../check-in/photo-step";
import { Stepper } from "../check-in/stepper";
import type { VisitorForm } from "../check-in/types";
import { Button } from "../ui/button";
import type { CheckInResult } from "./kiosk-types";

type WizardProps = {
  config: ApiKioskConfig;
  title: string;
  /** The visitor's details so far (empty for a walk-in, filled from the pass for QR Express) */
  initialVisitor: VisitorForm;
  /** 1 = the details form (walk-in), 2 = straight to the photo (the pass already gave the details) */
  startStep: 1 | 2;
  /** A line above the steps, e.g. the welcome for a visitor with a pass */
  banner?: ReactNode;
  /** Back from the first step this wizard shows */
  onBack: () => void;
  onCancel: () => void;
  /** Saves the check-in. Rejects with ApiError, whose message is shown to the visitor. */
  submit: (visitor: VisitorForm, photo: string | null, signature: string | null) => Promise<CheckInResult>;
  onDone: (result: CheckInResult) => void;
};

/** The check-in steps on the tablet: details, photo, confirm and sign. The walk-in and QR Express flows both use it. */
export function KioskWizard({ config, title, initialVisitor, startStep, banner, onBack, onCancel, submit, onDone }: WizardProps) {
  const [step, setStep] = useState<number>(startStep);
  const [visitor, setVisitor] = useState<VisitorForm>(initialVisitor);
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function finish() {
    setSubmitting(true);
    setError("");
    try {
      onDone(await submit(visitor, photo, signature));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't check you in. Please try again, or see the front desk.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h1 className="text-[21px] font-bold tracking-[-0.035em]">{title}</h1>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <Stepper step={step} />

      {banner && <div className="mb-4 rounded-lg border border-brand/30 bg-brand-soft px-3.5 py-2.5 text-[13px]">{banner}</div>}

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="rounded-[11px] border border-line bg-surface px-4 py-5 [box-shadow:var(--shadow)] sm:p-7">
        {step === 1 ? (
          <DetailsStep
            visitor={visitor}
            companies={config.tenants}
            onBack={onBack}
            onNext={(values) => {
              setVisitor(values);
              setStep(2);
            }}
          />
        ) : step === 2 ? (
          <PhotoStep photo={photo} required={config.requirePhoto} onPhotoChange={setPhoto} onBack={() => (startStep === 1 ? setStep(1) : onBack())} onNext={() => setStep(3)} />
        ) : (
          <ConfirmStep
            visitor={visitor}
            documents={config.documents}
            signature={signature}
            signatureRequired={config.requireSignature}
            onSignatureChange={setSignature}
            onBack={() => setStep(2)}
            onFinish={finish}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}
