type ToggleProps = { checked: boolean; onChange: (checked: boolean) => void; label: string };

/** On/off switch. `label` is read out by screen readers. */
export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${checked ? "bg-brand" : "bg-line-strong"}`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`}
      />
    </button>
  );
}
