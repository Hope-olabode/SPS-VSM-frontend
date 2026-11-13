"use client";

import { useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from "react";
import { useTheme } from "@/src/hooks/useTheme";
import { api, ApiError, type ApiKioskConfig, errorMessage } from "@/src/lib/api";
import { CheckIcon, ClockIcon, CloseIcon, MoonIcon, QrCodeIcon, SunIcon, UserPlusIcon, UserXIcon } from "../icons";
import { emptyVisitor, type VisitorForm } from "../check-in/types";
import { Button } from "../ui/button";
import { PhoneInput } from "../ui/phone-input";
import { minPhoneDigits } from "@/src/lib/phone-codes";
import { KioskCodeGate } from "./kiosk-code-gate";
import { KioskQrCheckIn } from "./kiosk-qr";
import type { Call, CheckInResult } from "./kiosk-types";
import { KioskWizard } from "./kiosk-wizard";

type Screen = "home" | "walk-in" | "qr" | "check-out" | "done";
type Outcome = "checked-in" | "awaiting-approval" | "approved" | "declined" | "checkout-requested" | "checked-out";

const OUTCOMES: Record<Outcome, { title: string; text: string }> = {
  "checked-in": { title: "You're checked in", text: "Thank you. Your host has been told you've arrived." },
  "awaiting-approval": { title: "Waiting for approval", text: "Please take a seat. A staff member will let you in shortly, and this screen will update when they do." },
  approved: { title: "You're approved", text: "Welcome in. Thank you for waiting." },
  declined: { title: "Entry not approved", text: "Sorry, we couldn't let you in just now. Please speak to the front desk." },
  "checkout-requested": { title: "Check-out requested", text: "Please wait a moment at the front desk while a staff member clears you to leave." },
  "checked-out": { title: "You're checked out", text: "Thank you for visiting. Safe travels." },
};

/** How long the "done" screen stays before the kiosk is ready for the next person */
const RESET_AFTER_MS = 10_000;
/** While a visitor waits for host approval the kiosk asks the server this often, and gives up (back to the start screen) after this long */
const APPROVAL_POLL_MS = 4_000;
const MAX_APPROVAL_WAIT_MS = 5 * 60_000;
/** Someone walked away in the middle of a form: after this long without a touch or a key, the kiosk goes back to the start screen */
const IDLE_RESET_MS = 3 * 60_000;

// The tablet remembers the code it was unlocked with, so a reload or a restart doesn't ask for it again.
// An admin regenerating the code (or the link) locks it again: the server answers 423 and the code screen comes back.
const codeKey = (token: string) => `kiosk-code:${token.slice(-12)}`;
const readCode = (token: string) => {
  try {
    return localStorage.getItem(codeKey(token)) ?? "";
  } catch {
    return "";
  }
};

export function KioskApp() {
  const token = useSearchParams().get("token") ?? "";
  /** null until the tablet has looked for a remembered code; "" = locked */
  const [code, setCode] = useState<string | null>(null);
  const [lockedMessage, setLockedMessage] = useState("");
  const [config, setConfig] = useState<ApiKioskConfig | null>(null);
  const [problem, setProblem] = useState("");
  const [screen, setScreen] = useState<Screen>("home");
  const [outcome, setOutcome] = useState<Outcome>("checked-in");
  /** the visit waiting for approval, so the kiosk can ask what staff decided */
  const [waitingVisitId, setWaitingVisitId] = useState("");

  useEffect(() => {
    setCode(readCode(token));
  }, [token]);

  /** Back to the code screen, and forget the code this tablet remembered */
  const lock = useCallback(
    (message = "") => {
      try {
        localStorage.removeItem(codeKey(token));
      } catch {
        // storage can be blocked; the code screen still shows
      }
      setConfig(null);
      setScreen("home");
      setLockedMessage(message);
      setCode("");
    },
    [token],
  );

  const unlock = (entered: string) => {
    try {
      localStorage.setItem(codeKey(token), entered);
    } catch {
      // the kiosk works without it, it just asks again after a reload
    }
    setLockedMessage("");
    setCode(entered);
  };

  // every kiosk call carries the link's token and the code in headers; a 401 is a bad or switched-off link, a 423 is a missing or changed code
  const call = useCallback(
    <T,>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> =>
      api<T>(`/kiosk${path}`, { ...init, headers: { "x-kiosk-token": token, "x-kiosk-code": code ?? "" }, redirectOn401: false }).catch((err) => {
        if (err instanceof ApiError && err.status === 423) lock(err.message);
        throw err;
      }),
    [token, code, lock],
  );

  // nothing is asked of the server about the location until the code has been accepted
  useEffect(() => {
    if (!token || !code) return;
    let cancelled = false;
    call<ApiKioskConfig>("/config")
      .then((data) => !cancelled && setConfig(data))
      .catch((err) => {
        if (cancelled || (err instanceof ApiError && err.status === 423)) return;
        setProblem(errorMessage(err, "The kiosk can't reach the server. Please ask staff for help."));
      });
    return () => {
      cancelled = true;
    };
  }, [call, token, code]);

  const finish = (result: Outcome) => {
    setOutcome(result);
    setScreen("done");
  };

  const checkedIn = (result: CheckInResult) => {
    setWaitingVisitId(result.status === "pending_approval" ? result.id : "");
    finish(result.status === "pending_approval" ? "awaiting-approval" : "checked-in");
  };

  // after a visitor finishes, go back to the start screen by itself (not while they are still waiting for approval)
  useEffect(() => {
    if (screen !== "done" || outcome === "awaiting-approval") return;
    const timer = setTimeout(() => setScreen("home"), RESET_AFTER_MS);
    return () => clearTimeout(timer);
  }, [screen, outcome]);

  // a visitor walked away from a form: the next person starts from the start screen, with nothing of the last one's left
  useEffect(() => {
    if (screen === "home" || screen === "done") return;
    let timer = setTimeout(() => setScreen("home"), IDLE_RESET_MS);
    const touched = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setScreen("home"), IDLE_RESET_MS);
    };
    window.addEventListener("pointerdown", touched);
    window.addEventListener("keydown", touched);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", touched);
      window.removeEventListener("keydown", touched);
    };
  }, [screen]);

  // a visitor waiting for host approval: ask the server every few seconds what staff decided
  useEffect(() => {
    if (screen !== "done" || outcome !== "awaiting-approval" || !waitingVisitId) return;
    const startedAt = Date.now();
    const timer = setInterval(async () => {
      if (Date.now() - startedAt > MAX_APPROVAL_WAIT_MS) {
        setScreen("home");
        return;
      }
      try {
        const { status } = await call<{ status: "pending_approval" | "approved" | "declined" }>(`/visits/${encodeURIComponent(waitingVisitId)}/status`);
        if (status === "approved") setOutcome("approved");
        else if (status === "declined") setOutcome("declined");
      } catch {
        // a dropped connection is fine: the next poll tries again
      }
    }, APPROVAL_POLL_MS);
    return () => clearInterval(timer);
  }, [screen, outcome, waitingVisitId, call]);

  if (!token) return <Frame><Notice title="No kiosk link">This page needs the kiosk link. Ask a staff member for the kiosk URL.</Notice></Frame>;
  if (problem) return <Frame><Notice title="The kiosk isn't available" error>{problem}</Notice></Frame>;
  if (code === null) return <Frame />;
  if (!code) return <Frame><KioskCodeGate token={token} message={lockedMessage} onUnlock={unlock} /></Frame>;
  if (!config) return <Frame><p className="py-20 text-center text-sm text-soft">Loading…</p></Frame>;

  const walkIn = (visitor: VisitorForm, photo: string | null, signature: string | null) =>
    call<CheckInResult>("/check-in", {
      method: "POST",
      body: {
        firstName: visitor.firstName,
        lastName: visitor.lastName,
        phoneCode: visitor.phoneCode,
        phone: visitor.phone,
        company: visitor.company,
        visitorType: visitor.visitorType,
        residentCompany: visitor.residentCompany,
        hostName: visitor.host,
        purpose: visitor.purpose,
        notes: visitor.notes,
        photo: photo ?? undefined,
        signature: signature ?? undefined,
      },
    });

  return (
    <Frame toolbar>
      {screen === "home" && <Home config={config} onChoose={setScreen} />}

      {/* Walk-In Check-In opens the check-in form itself: no number to type first */}
      {screen === "walk-in" && (
        <KioskWizard
          config={config}
          title="Walk-In Check-In"
          initialVisitor={emptyVisitor}
          startStep={1}
          onBack={() => setScreen("home")}
          onCancel={() => setScreen("home")}
          submit={walkIn}
          onDone={checkedIn}
        />
      )}
      {screen === "qr" && <KioskQrCheckIn config={config} call={call} onCancel={() => setScreen("home")} onDone={checkedIn} />}
      {screen === "check-out" && <KioskCheckOut call={call} onCancel={() => setScreen("home")} onDone={finish} />}

      {screen === "done" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center">
          <span
            className={`grid h-16 w-16 place-items-center rounded-full text-white ${
              outcome === "declined" ? "bg-red-600" : outcome === "awaiting-approval" ? "bg-blue-600" : "bg-green-600"
            }`}
          >
            {outcome === "declined" ? <CloseIcon size={34} /> : outcome === "awaiting-approval" ? <ClockIcon size={34} /> : <CheckIcon size={34} />}
          </span>
          <h1 className="text-[28px] font-bold tracking-[-0.035em]">{OUTCOMES[outcome].title}</h1>
          <p className="max-w-[460px] text-soft">{OUTCOMES[outcome].text}</p>
          <Button onClick={() => setScreen("home")} className="mt-2 min-h-[52px] px-8 text-base">
            Back to start
          </Button>
        </div>
      )}
    </Frame>
  );
}

/** The start screen: three big choices for a tablet */
function Home({ config, onChoose }: { config: ApiKioskConfig; onChoose: (screen: Screen) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 py-8 text-center">
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-[-0.04em] sm:text-[42px]">{config.locationName}</h1>
        <p className="mx-auto mt-2 max-w-[560px] text-base text-soft">{config.welcomeMessage}</p>
      </div>

      <div className="grid w-full gap-4 md:grid-cols-3">
        <Choice
          icon={<UserPlusIcon size={30} />}
          title="Walk-In Check-In"
          text="Checking in for a meeting or delivery? Start here."
          onClick={() => onChoose("walk-in")}
          disabled={!config.allowWalkIns}
          note={config.allowWalkIns ? "" : "Walk-ins aren't accepted here. Use QR Express Check-In if you were pre-registered."}
        />
        <Choice icon={<QrCodeIcon size={30} />} title="QR Express Check-In" text="Have an invite code? Scan your QR pass here." onClick={() => onChoose("qr")} />
        <Choice icon={<UserXIcon size={30} />} title="Visitor Check Out" text="Leaving the building? Sign out here." onClick={() => onChoose("check-out")} tone="red" />
      </div>
    </div>
  );
}

function Choice({
  icon,
  title,
  text,
  note,
  onClick,
  disabled = false,
  tone = "green",
}: {
  icon: ReactNode;
  title: string;
  text: string;
  note?: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "green" | "red";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-[230px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-surface p-6 text-center transition [box-shadow:var(--shadow)] hover:-translate-y-0.5 hover:border-brand/40 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:border-line"
    >
      <span className={`grid h-14 w-14 place-items-center rounded-xl ${tone === "red" ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-brand-soft text-brand"}`}>{icon}</span>
      <span className="text-[19px] font-bold tracking-[-0.02em]">{title}</span>
      <span className="max-w-[240px] text-[13px] leading-snug text-soft">{note || text}</span>
    </button>
  );
}

function Frame({ toolbar = false, children }: { toolbar?: boolean; children?: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col px-5 py-5 sm:py-7">
      {toolbar ? (
        <Toolbar />
      ) : (
        <header className="text-sm">
          <strong className="font-bold tracking-[-0.02em]">SPS</strong>
        </header>
      )}
      {children}
      <footer className="mt-auto pt-6 text-center text-xs text-muted">
        Powered by <strong className="font-semibold text-soft">SPS</strong> · Need help? Ask the front desk team
      </footer>
    </main>
  );
}

/** Clock and date on the left; full screen and light/dark on the right */
function Toolbar() {
  const { theme, toggleTheme } = useTheme();
  const [now, setNow] = useState<Date | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // some tablets don't allow it; the kiosk works the same
    }
  }

  const time = now?.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  const date = now?.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  return (
    <header className="flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2 [box-shadow:var(--shadow)]" aria-live="off">
        <ClockIcon size={14} className="text-soft" />
        <span className="min-w-[78px] font-mono font-semibold">{time ?? ""}</span>
        <span className="text-soft">{date ?? ""}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded-lg border border-line bg-surface px-3 py-2 font-medium text-soft transition hover:border-brand/40 hover:text-brand"
        >
          {fullscreen ? "Exit fullscreen" : "Fullscreen"}
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="grid h-[34px] w-[34px] place-items-center rounded-lg border border-line bg-surface text-soft transition hover:border-brand/40 hover:text-brand"
        >
          {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
        </button>
      </div>
    </header>
  );
}

function Notice({ title, error = false, children }: { title: string; error?: boolean; children: ReactNode }) {
  return (
    <div role={error ? "alert" : undefined} className="my-auto rounded-xl border border-line bg-surface p-6 text-center [box-shadow:var(--shadow)]">
      <h1 className="text-lg font-bold">{title}</h1>
      <p className="mt-2 text-sm text-soft">{children}</p>
    </div>
  );
}

function KioskCheckOut({ call, onCancel, onDone }: { call: Call; onCancel: () => void; onDone: (outcome: Outcome) => void }) {
  const [number, setNumber] = useState({ phoneCode: "+234", phone: "" });
  const phoneDigits = number.phone.replace(/\D/g, "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = await call<{ status: "pending_clearance" | "left" }>("/check-out", { method: "POST", body: { phoneCode: number.phoneCode, phone: phoneDigits } });
      onDone(result.status === "left" ? "checked-out" : "checkout-requested");
    } catch (err) {
      setError(errorMessage(err, "Couldn't check you out. Please see the front desk."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-6 w-full max-w-[560px]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h1 className="text-[21px] font-bold tracking-[-0.035em]">Visitor Check Out</h1>
        <Button variant="ghost" onClick={onCancel}>
          Back
        </Button>
      </div>

      <div className="rounded-[11px] border border-line bg-surface px-4 py-5 [box-shadow:var(--shadow)] sm:p-7">
        <label htmlFor="kiosk-phone" className="mb-2 block text-[13px] font-medium">
          Enter the phone number you checked in with
        </label>
        <PhoneInput id="kiosk-phone" autoFocus required onChange={setNumber} inputClassName="h-12" />
        {error && (
          <p role="alert" className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-600 dark:text-red-300">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={phoneDigits.length < minPhoneDigits(number.phoneCode) || submitting} className="min-h-[48px]">
            {submitting ? "Checking out…" : "Check Out"}
          </Button>
        </div>
      </div>
    </form>
  );
}
