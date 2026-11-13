"use client";

import { useState } from "react";
import { DEFAULT_PHONE_CODE, maxPhoneDigits, phoneCountries } from "@/src/lib/phone-codes";
import { ChevronDownIcon } from "../icons";
import { inputClass } from "./field";

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
  inputClassName?: string;
};

/** A country-code picker next to the phone number box. The real <select> sits invisibly on top, so the code shown is just for looks. */
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
}: PhoneInputProps) {
  const [code, setCode] = useState(defaultCode);
  const [phone, setPhone] = useState(defaultValue);

  return (
    <div className="flex w-full">
      <div className="relative flex shrink-0 items-center gap-2 rounded-l-lg border border-r-0 border-line-strong bg-surface-soft px-3 text-sm transition focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand/20">
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
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
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
        onChange={(event) => {
          const next = event.target.value.replace(/[^\d\s]/g, "");
          setPhone(next);
          onChange?.({ phoneCode: code, phone: next });
        }}
        placeholder={code === "+234" ? "801 234 5678" : "Phone number"}
        className={`${inputClass} rounded-l-none ${readOnly ? "bg-surface-soft" : ""} ${inputClassName}`}
      />
    </div>
  );
}
