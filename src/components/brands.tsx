import Link from "next/link";
import Image from "next/image";
import { useTheme } from "../hooks/useTheme";
import logoDark from "../../public/Logo dark.png";
import logolight from "../../public/Logo light.png";

type BrandProps = { href?: string; labelClassName?: string };

export function Brand({ href = "/dashboard", labelClassName = "" }: BrandProps) {
  const { theme } = useTheme();
  return (
    <Link
      href={href}
      aria-label="SPS home"
      className="flex items-center gap-2.5 text-xl font-bold tracking-[-0.03em] text-fg"
    >
      {theme === "dark" ? (
        <Image width={100}
          height={100} src={logoDark.src} alt="SPS logo" className="h-[90px] w-[100px]" />
      ) : (
        <Image width={100}
          height={100} src={logolight.src} alt="SPS logo" className="h-[80px] w-[100px]" />
      )}
    </Link>
  );
}