import { CheckIcon } from "../icons";

const labels = ["Details", "Photo", "Confirm"];

/** step 1-3 = in progress, 4 = everything finished */
export function Stepper({ step }: { step: number }) {
  return (
    <ol className="mb-6 flex items-center" aria-label="Check-in progress">
      {labels.map((label, index) => {
        const number = index + 1;
        const completed = number < step;
        const active = number === step;
        const last = number === labels.length;

        return (
          <li key={label} className={`flex items-center ${last ? "" : "flex-1"}`} aria-current={active ? "step" : undefined}>
            <span className="flex items-center gap-1.5 sm:gap-2.5">
              <span
                className={`grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border text-xs font-semibold ${
                  active
                    ? "border-brand bg-brand text-white dark:text-[#04130a]"
                    : completed
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line-strong text-muted"
                }`}
              >
                {completed ? <CheckIcon size={14} /> : number}
              </span>
              <span
                className={`text-xs sm:text-[13px] ${
                  active ? "font-semibold text-fg" : completed ? "text-soft" : "text-muted"
                }`}
              >
                {label}
              </span>
            </span>
            {!last && <span className={`mx-[7px] h-px flex-1 sm:mx-3.5 ${completed ? "bg-brand" : "bg-line-strong"}`} />}
          </li>
        );
      })}
    </ol>
  );
}