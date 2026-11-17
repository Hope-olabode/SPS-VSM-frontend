/** A small spinning ring. It takes the colour of the surrounding text, so it works inside buttons. */
export function Spinner({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current/25 border-t-current motion-reduce:[animation-duration:2.5s] ${className}`}
    />
  );
}
