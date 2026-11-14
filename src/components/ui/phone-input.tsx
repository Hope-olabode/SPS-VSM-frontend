"use client";

import { useState } from "react";
import { DEFAULT_PHONE_CODE, maxPhoneDigits, phoneCountries } from "@/src/lib/phone-codes";
import { ChevronDownIcon } from "../icons";

type PhoneInputProps = {
  id: string;
  /** Form field names: the country code is sent as `codeName` and the number as `name`, so a plain <form> picks up both. */
  name?: string;
  codeName?: string;
  defaultCode?: string;
  defaultValue?: string;
  readOnly?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  /** Called whenever the code or the number changes, for screens that keep the values in state */
  onChange?: (value: { phoneCode: string; phone: string }) => void;
  /** Applied to the number box (the kiosk uses it for a taller field, e.g. "h-12") */
  inputClassName?: string;
  /** Red border, for a failed validation */
  invalid?: boolean;
  "aria-describedby"?: string;
};

/**
 * A country-code picker joined to the phone number box as ONE field: a single border, and the focus glow is drawn
 * on that border (inset), so it can never be clipped by a parent or hidden behind the neighbouring box.
 * The real <select> sits invisibly on top of the code, so the code shown is just for looks.
 */
export function PhoneInput({
  id,
  name = "phone",
  codeName = "phoneCode",
  defaultCode = DEFAULT_PHONE_CODE,
  defaultValue = "",
  readOnly = false,
  required = false,
  autoFocus = false,
  onChange,
  inputClassName = "",
  invalid = false,
  "aria-describedby": describedBy,
}: PhoneInputProps) {
  const [code, setCode] = useState(defaultCode);
  const [phone, setPhone] = useState(defaultValue);

  const border = invalid ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/25" : "border-line-strong focus-within:border-brand focus-within:ring-brand/25";
  const hover = readOnly || invalid ? "" : "hover:border-brand/40";

  return (
    <div className={`flex w-full rounded-lg border bg-surface-soft transition focus-within:ring-2 focus-within:ring-inset ${border} ${hover}`}>
      <div className="relative flex shrink-0 items-center gap-2 rounded-l-lg border-r border-line-strong px-3 text-sm">
        <span aria-hidden="true" className="text-[11px] font-semibold text-muted">
          {phoneCountries.find((country) => country.code === code)?.iso}
        </span>
        <strong className="font-semibold">{code}</strong>
        {!readOnly && <ChevronDownIcon size={13} className="text-muted" />}
        {/* a disabled <select> isn't sent with the form, so the code travels in this hidden field */}
        <input type="hidden" name={codeName} value={code} />
        <select
          value={code}
          disabled={readOnly}
          onChange={(event) => {
            setCode(event.target.value);
            onChange?.({ phoneCode: event.target.value, phone });
          }}
          aria-label="Country code"
          className="absolute inset-0 h-full w-full cursor-pointer rounded-l-lg opacity-0 disabled:cursor-default"
        >
          {phoneCountries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name} ({country.code})
            </option>
          ))}
        </select>
      </div>
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete="off"
        autoFocus={autoFocus}
        maxLength={maxPhoneDigits(code) + 4 /* room for spaces and a leading 0 */}
        value={phone}
        readOnly={readOnly}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(event) => {
          const next = event.target.value.replace(/[^\d\s]/g, "");
          setPhone(next);
          onChange?.({ phoneCode: code, phone: next });
        }}
        placeholder={code === "+234" ? "801 234 5678" : "Phone number"}
        className={`h-11 w-full min-w-0 rounded-r-lg bg-transparent px-3.5 text-sm text-fg placeholder:text-muted focus:outline-none ${inputClassName}`}
      />
    </div>
  );
}