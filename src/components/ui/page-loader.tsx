import { Spinner } from "./spinner";

type PageLoaderProps = {
  /** What is loading, e.g. "Loading visitors…" */
  label?: string;
  /** Fill the whole screen (first load of the dashboard or the kiosk). Otherwise it fills just its own area. */
  fullScreen?: boolean;
  className?: string;
};

/** The one loading screen used across the app: a spinner and a short label, announced to screen readers. */
export function PageLoader({ label = "Loading…", fullScreen = false, className = "" }: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3.5 text-center text-xs text-soft ${fullScreen ? "min-h-screen p-6" : "px-5 py-16"} ${className}`}
    >
      <Spinner size={fullScreen ? 38 : 28} className="text-brand" />
      <span>{label}</span>
    </div>
  );
}
