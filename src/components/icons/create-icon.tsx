import type { ReactNode, SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & { size?: number };

/** Builds an icon component from raw SVG path markup (24x24 grid, stroke style). */
export function createIcon(displayName: string, paths: ReactNode) {
  function Icon({ size = 18, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {paths}
      </svg>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}