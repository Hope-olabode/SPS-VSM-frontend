"use client";

import { type FormEvent, useState } from "react";
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
};

export function DetailsStep({ visitor, onNext, companies: given, lockPhone = false, canAddCompany = false, onBack }: DetailsStepProps) {
  // resident companies come from GET /api/tenants (unless the caller passed them in)
  const { companies, state: companiesState, add: addCompany } = useResidentCompanies(given);
  const [residentCompany, setResidentCompany] = useState(visitor.residentCompany);

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

      <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
        <Field label="Visitor's First Name" htmlFor="firstName" required>
          <input id="firstName" name="firstName" defaultValue={visitor.firstName} placeholder="Emeka" required className={inputClass} />
        </Field>

        <Field label="Visitor's Last Name" htmlFor="lastName" required>
          <input id="lastName" name="lastName" defaultValue={visitor.lastName} placeholder="Nwosu" required className={inputClass} />
        </Field>

        <Field label="Visitor's Phone" htmlFor="phone" required>
          <PhoneInput id="phone" defaultCode={visitor.phoneCode} defaultValue={visitor.phone} readOnly={lockPhone} required />
        </Field>

        <Field label="Visitor's Company" htmlFor="company">
          <input id="company" name="company" defaultValue={visitor.company} placeholder="e.g. Sterling Industries" className={inputClass} />
        </Field>

        <Field label="Visitor Type" htmlFor="visitorType">
          <Select id="visitorType" name="visitorType" defaultValue={visitor.visitorType} options={visitorTypes} />
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
          <input id="host" name="host" defaultValue={visitor.host} placeholder="e.g. Babatunde Balogun" required className={inputClass} />
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