"use client";


"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../../../hooks/useTheme";
import { api, ApiError } from "../../../lib/api";
import Image from "next/image";
import logoDark from "../../../../public/Logo dark.png";
import logolight from "../../../../public/Logo light.png";

function Brand() {
  const { theme } = useTheme();
  return (
    <a
      href="#"
      aria-label="SPS home"
      className="mb-8 inline-flex items-center gap-2.5 font-[family-name:var(--font-space-grotesk)] text-[23px] font-bold leading-none tracking-[-0.03em] text-[#151520] no-underline dark:text-white"
    >
      {theme === "dark" ? (
        <Image width={120}
          height={100} src={logoDark.src} alt="SPS logo" className="h-[90px] w-[100px]" />
      ) : (
        <Image width={120}
          height={100} src={logolight.src} alt="SPS logo" className="h-[80px] w-[100px]" />
      )}
      
    </a>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  const svgClass = "h-full w-full fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]";
  return hidden ? (
    <svg className={svgClass} viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.5 10.5 0 0 1 22 12a10.8 10.8 0 0 1-3.2 4.7M6.6 6.6A10.8 10.8 0 0 0 2 12a10.7 10.7 0 0 0 12.4 7.5" />
    </svg>
  ) : (
    <svg className={svgClass} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.1 12.3a1 1 0 0 1 0-.6 10.8 10.8 0 0 1 19.8 0 1 1 0 0 1 0 .6 10.8 10.8 0 0 1-19.8 0Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function LoginIcon() {
  return (
    <svg
      className="h-[18px] w-[18px] fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m10 17 5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    </svg>
  );
}

function ThemeIcon({ dark }: { dark: boolean }) {
  const svgClass = "h-5 w-5 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]";
  // In dark mode show the sun (switch to light); in light mode show the moon.
  return dark ? (
    <svg className={svgClass} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ) : (
    <svg className={svgClass} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

export default function Login() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      await api("/auth/login", {
        method: "POST",
        body: { email: String(data.get("email") ?? ""), password: String(data.get("password") ?? "") },
        redirectOn401: false,
      });
      // go back to the page that sent us here, but only if it's a page on this site
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't sign you in. Please try again.");
      setSubmitting(false);
    }
  }

  const inputClass =
    "h-12 w-full rounded-[9px] border border-[#dedee6] bg-white px-3.5 text-sm text-[#1c1c26] transition placeholder:text-[#a0a0ad] hover:border-[#c2c2ce] focus:border-green-600 focus:outline-none focus:ring-[3px] focus:ring-green-600/15 " +
    "dark:border-white/10 dark:bg-[#0c1511] dark:text-gray-100 dark:placeholder:text-gray-500 dark:hover:border-white/20 dark:focus:border-green-500 dark:focus:ring-green-500/20";

  const labelClass = "mb-2 block text-[13px] font-semibold text-[#33333f] dark:text-gray-200";

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#e6ebe8] px-4 py-10 font-[family-name:var(--font-outfit)] text-[#17171f] antialiased transition-colors dark:bg-[#080f0b] dark:text-gray-100">

      {/* Theme toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="absolute right-4 top-4 grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-black/10 bg-white text-[#4b4b5c] transition hover:bg-[#f5f5f8] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-green-600/40 dark:border-white/10 dark:bg-[#111c16] dark:text-gray-300 dark:hover:bg-[#16241c]"
      >
        <ThemeIcon dark={isDark} />
      </button>

      <section
        aria-label="Sign in"
        className="w-full max-w-[460px] rounded-2xl border border-black/5 bg-white px-6 py-10 shadow-[0_10px_40px_rgba(15,40,25,0.10)] transition-colors sm:px-11 sm:py-12 dark:border-white/10 dark:bg-[#111c16] dark:shadow-[0_10px_40px_rgba(0,0,0,0.55)]"
      >
        <form onSubmit={handleSubmit} className="w-full">
          <Brand />

          <div className="mb-[31px]">
            <h1 className="mb-[9px] mt-0 text-[29px] font-bold leading-[1.15] tracking-[-0.035em] text-[#16161e] sm:text-[32px] dark:text-white">
              Welcome back
            </h1>
            <p className="m-0 text-[15px] text-[#777788] dark:text-gray-400">Sign in to your account to continue</p>
          </div>

          <div className="mb-5">
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              required
              className={inputClass}
            />
          </div>

          <div className="mb-5">
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute right-[11px] top-1/2 grid h-8 w-8 -translate-y-1/2 cursor-pointer place-items-center rounded-md border-0 bg-transparent p-[7px] text-[#9292a2] hover:bg-[#f5f5f8] hover:text-[#5e5e70] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-green-600/25 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-200"
              >
                <EyeIcon hidden={showPassword} />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMessage("Enter your email and we’ll send you a reset link.")}
            className="-mt-2 ml-auto block cursor-pointer border-0 bg-transparent py-0.5 text-[13px] font-medium text-green-600 hover:text-green-800 hover:underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-green-600/25 dark:text-green-400 dark:hover:text-green-300"
          >
            Forgot password?
          </button>

          {message && (
            <p
              role="status"
              className="-mb-[3px] mt-3.5 rounded-[7px] border border-green-200 bg-green-50 px-[11px] py-[9px] text-xs leading-[1.45] text-green-700 dark:border-green-500/25 dark:bg-green-500/10 dark:text-green-300"
            >
              {message}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="-mb-[3px] mt-3.5 rounded-[7px] border border-red-200 bg-red-50 px-[11px] py-[9px] text-xs leading-[1.45] text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-[30px] flex h-[50px] w-full cursor-pointer items-center justify-center gap-[9px] rounded-[10px] border border-green-600 bg-green-600 text-sm font-semibold text-white shadow-[0_3px_8px_rgba(22,163,74,0.2),inset_0_1px_rgba(255,255,255,0.18)] transition duration-150 hover:-translate-y-px hover:bg-green-700 hover:shadow-[0_6px_14px_rgba(22,163,74,0.25)] active:translate-y-0 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-green-600/25 dark:border-green-500 dark:bg-green-500 dark:text-[#04130a] dark:hover:bg-green-400"
          >
            <LoginIcon />
            {submitting ? "Signing in…" : "Sign In"}
          </button>

          <p className="mb-0 mt-[23px] text-center text-[13px] text-[#777788] dark:text-gray-400">
            Don&apos;t have an account?{" "}
            <a href="#create" className="font-medium text-green-600 no-underline hover:underline dark:text-green-400">
              Create organization
            </a>
          </p>

          <nav aria-label="Legal" className="mt-[17px] flex items-center justify-center gap-[7px] text-[11px] text-[#a0a0ad] dark:text-gray-500">
            <a href="#terms" className="text-inherit no-underline hover:underline">
              Terms of Service
            </a>
            <span aria-hidden="true">·</span>
            <a href="#privacy" className="text-inherit no-underline hover:underline">
              Privacy Policy
            </a>
          </nav>
        </form>
      </section>
    </main>
  );
}