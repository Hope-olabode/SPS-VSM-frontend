"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { minPhoneDigits } from "@/src/lib/phone-codes";
import { ArrowLeftIcon, ArrowRightIcon } from "../icons";
import { Button } from "../ui/button";
import { CompanyCombobox, useResidentCompanies } from "../ui/company-combobox";
import { Field, inputClass } from "../ui/field";
import { PhoneInput } from "../ui/phone-input";
import { Select } from "../ui/select";
import { type VisitorForm, visitorTypes } from "./types";

type Company = { id: string; name: string; floor?: string };
type DetailsStepProps = {
  visitor: VisitorForm;
  onNext: (visitor: VisitorForm) => void;
  /** Pass the list in (the kiosk does) to skip loading it from GET /api/tenants, which needs a signed-in user */
  companies?: Company[];
  /** The kiosk asks for the phone number first, so by this step it is fixed (the visitor goes back to change it) */
  lockPhone?: boolean;
  /** Admins can add a resident company from the box when it isn't in the list yet (never at the kiosk) */
  canAddCompany?: boolean;
  /** Shows a Back button before the first step (the kiosk uses it to return to the three options) */
  onBack?: () => void;
  /**
   * The kiosk passes this in: once a full phone number is typed it is looked up, and when the number has visited before the visitor
   * is offered to fill in the details they gave last time (they can still change every one of them). Resolves null for a new number.
   */
  lookup?: (number: { phoneCode: string; phone: string }) => Promise<Partial<VisitorForm> | null>;
};

export function DetailsStep({ visitor, onNext, companies: given, lockPhone = false, canAddCompany = false, onBack, lookup }: DetailsStepProps) {
  // resident companies come from GET /api/tenants (unless the caller passed them in)
  const { companies, state: companiesState, add: addCompany } = useResidentCompanies(given);
  const [residentCompany, setResidentCompany] = useState(visitor.residentCompany);
  const [firstName, setFirstName] = useState(visitor.firstName);
  const [lastName, setLastName] = useState(visitor.lastName);
  const [company, setCompany] = useState(visitor.company);
  const [visitorType, setVisitorType] = useState<string>(visitor.visitorType);
  const [host, setHost] = useState(visitor.host);

  // a number that has visited before: what they gave last time, offered until they tap to use it
  const [known, setKnown] = useState<Partial<VisitorForm> | null>(null);
  const [number, setNumber] = useState({ phoneCode: visitor.phoneCode, phone: visitor.phone });
  const lookupRef = useRef(lookup);
  useEffect(() => {
    lookupRef.current = lookup;
  }, [lookup]);

  useEffect(() => {
    setKnown(null);
    const digits = number.phone.replace(/\D/g, "");
    if (!lookupRef.current || digits.length < minPhoneDigits(number.phoneCode)) return;
    let current = true; // ignore the answer if the number has changed again meanwhile
    const timer = setTimeout(() => {
      lookupRef.current?.({ phoneCode: number.phoneCode, phone: digits })
        .then((found) => current && setKnown(found))
        .catch(() => {}); // a refused or failed lookup is shown by the check-in itself
    }, 400);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [number]);

  /** Puts what the visitor gave last time into the form. Only values this form can hold are used; everything stays editable. */
  function fillIn() {
    if (!known) return;
    if (known.firstName) setFirstName(known.firstName);
    if (known.lastName) setLastName(known.lastName);
    if (known.company !== undefined) setCompany(known.company);
    if (known.visitorType && (visitorTypes as readonly string[]).includes(known.visitorType)) setVisitorType(known.visitorType);
    if (known.residentCompany && companies.some((c) => c.name === known.residentCompany)) setResidentCompany(known.residentCompany);
    if (known.host) setHost(known.host);
    setKnown(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const get = (key: keyof VisitorForm) => String(data.get(key) ?? "").trim();

    onNext({
      firstName: get("firstName"),
      lastName: get("lastName"),
      phoneCode: get("phoneCode") || "+234",
      phone: get("phone"),
      company: get("company"),
      visitorType: get("visitorType") as VisitorForm["visitorType"],
      residentCompany: get("residentCompany"),
      host: get("host"),
      purpose: get("purpose"),
      notes: get("notes"),
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="mb-6 text-base font-semibold">Visitor Details</h3>

      {known && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand/30 bg-brand-soft px-3.5 py-3 text-[13px]">
          <span>
            <strong>Welcome back!</strong> We recognise this number. Fill in the details you gave last time? You can still change them.
          </span>
          <Button variant="secondary" onClick={fillIn}>
            Fill in my details
          </Button>
        </div>
      )}

      <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
        <Field label="Visitor's First Name" htmlFor="firstName" required>
          <input id="firstName" name="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Emeka" required className={inputClass} />
        </Field>

        <Field label="Visitor's Last Name" htmlFor="lastName" required>
          <input id="lastName" name="lastName" value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Nwosu" required className={inputClass} />
        </Field>

        <Field label="Visitor's Phone" htmlFor="phone" required>
          <PhoneInput id="phone" defaultCode={visitor.phoneCode} defaultValue={visitor.phone} readOnly={lockPhone} required onChange={setNumber} />
        </Field>

        <Field label="Visitor's Company" htmlFor="company">
          <input id="company" name="company" value={company} onChange={(event) => setCompany(event.target.value)} placeholder="e.g. Sterling Industries" className={inputClass} />
        </Field>

        <Field label="Visitor Type" htmlFor="visitorType">
          <Select id="visitorType" name="visitorType" value={visitorType} onChange={setVisitorType} options={visitorTypes} />
        </Field>

        <Field label="Resident Company" htmlFor="residentCompany" required>
          <CompanyCombobox
            id="residentCompany"
            name="residentCompany"
            value={residentCompany}
            onChange={setResidentCompany}
            companies={companies}
            state={companiesState}
            onAdd={canAddCompany ? addCompany : undefined}
            required
          />
        </Field>

        <Field label="Person Being Visited" htmlFor="host" required>
          <input id="host" name="host" value={host} onChange={(event) => setHost(event.target.value)} placeholder="e.g. Babatunde Balogun" required className={inputClass} />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Purpose of Visit" htmlFor="purpose">
          <input id="purpose" name="purpose" defaultValue={visitor.purpose} placeholder="Meeting, Interview, Delivery..." className={inputClass} />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Notes" htmlFor="notes">
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={visitor.notes}
            placeholder="Any additional notes..."
            className={`${inputClass} h-auto min-h-[88px] resize-y py-3`}
          />
        </Field>
      </div>

      <div className={`mt-6 flex ${onBack ? "justify-between" : "justify-end"}`}>
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeftIcon size={16} /> Back
          </Button>
        )}
        <Button type="submit">
          Next: Photo <ArrowRightIcon size={16} />
        </Button>
      </div>
    </form>
  );
}