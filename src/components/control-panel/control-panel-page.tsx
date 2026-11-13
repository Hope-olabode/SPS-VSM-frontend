"use client";

import { useEffect, useState } from "react";
import { KioskLinkCard } from "@/src/components/dashboard/kiosk-link-card";
import { useKioskLink } from "@/src/components/dashboard/use-kiosk-link";
import { BellIcon, ClockIcon, LockIcon, MonitorIcon, RotateCcwIcon, UserCheckIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { inputClass } from "@/src/components/ui/field";
import { useSettings } from "@/src/components/dashboard/settings-provider";
import { useVisitors } from "@/src/components/dashboard/visitors-provider";
import { ApiError, errorMessage } from "@/src/lib/api";
import {
  autoCheckoutOptions,
  changedSettings,
  overstayOptions,
  retentionOptions,
  type Settings,
} from "@/src/lib/settings";
import { QuickLinks } from "./quick-links";
import { SelectRow, SettingRow, ToggleRow } from "./setting-row";
import { SettingsSection } from "./settings-section";
import { ResidentCompaniesSection } from "./resident-companies-section";
import { UsersRolesSection } from "./users-roles-section";

export function ControlPanelPage() {
  const { settings: saved, loaded, error: loadError, save: saveSettings } = useSettings();
  const { refresh: refreshVisitors } = useVisitors();
  // null means nothing has been edited yet, so the form just shows what is saved
  const [edits, setEdits] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const draft = edits ?? saved;
  const kiosk = useKioskLink();
  const [confirmingKiosk, setConfirmingKiosk] = useState(false);
  const [confirmingCode, setConfirmingCode] = useState(false);
  const [notice, setNotice] = useState("");

  // the toast disappears by itself
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const changed = changedSettings(saved, draft);
  const dirty = changed.length > 0;

  const set = <K extends keyof Settings>(key: K) => (value: Settings[K]) => setEdits((current) => ({ ...(current ?? saved), [key]: value }));

  // the server writes the SETTINGS_UPDATED audit event itself
  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await saveSettings(draft);
      setEdits(null);
      void refreshVisitors(); // phone masking may have changed
      setNotice("Settings saved");
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "Couldn't save the settings.");
    } finally {
      setSaving(false);
    }
  }

  // the server turns the old link off and writes the KIOSK_TOKEN_REGENERATED audit event itself
  async function regenerateKioskCode() {
    setConfirmingCode(false);
    try {
      await kiosk.regenerateCode();
      setNotice("New kiosk code generated");
    } catch (err) {
      setNotice(errorMessage(err, "Couldn't generate a new kiosk code."));
    }
  }

  async function regenerateKiosk() {
    setConfirmingKiosk(false);
    try {
      await kiosk.regenerate();
      setNotice("New kiosk URL generated");
    } catch (err) {
      setNotice(errorMessage(err, "Couldn't generate a new kiosk URL."));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-[7px] text-[21px] font-bold leading-tight tracking-[-0.035em] sm:text-[25px]">Control Panel</h1>
          <p className="text-xs text-soft">Configure how check-in, check-out, security and alerts work for this branch</p>
        </div>

        <div className="flex items-center gap-2.5">
          {dirty && (
            <>
              <span className="hidden text-xs text-muted sm:inline">
                {changed.length} unsaved {changed.length === 1 ? "change" : "changes"}
              </span>
              <Button variant="ghost" onClick={() => setEdits(null)}>
                Discard
              </Button>
            </>
          )}
          <Button onClick={save} disabled={!dirty || saving || !loaded}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      {loadError && (
        <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-5 py-3 text-xs text-red-600 dark:text-red-300">
          {loadError} Changes can&apos;t be saved until the settings load.
        </p>
      )}

      <QuickLinks />

      <UsersRolesSection onNotice={setNotice} />

      <ResidentCompaniesSection onNotice={setNotice} />

      <div className="grid gap-6 xl:grid-cols-2">
        <SettingsSection title="Check-in" description="What visitors go through when they arrive" icon={UserCheckIcon}>
          <ToggleRow title="Require photo" description="Capture a photo of every visitor at check-in." checked={draft.requirePhoto} onChange={set("requirePhoto")} />
          <ToggleRow
            title="Require signature"
            description="Visitors must sign your active NDAs and policies before they are checked in."
            checked={draft.requireSignature}
            onChange={set("requireSignature")}
          />
          <ToggleRow
            title="Require host approval"
            description="The host has to approve a visitor before they are let in."
            checked={draft.requireHostApproval}
            onChange={set("requireHostApproval")}
          />
          <ToggleRow
            title="Allow walk-ins"
            description="Let visitors who haven't pre-registered check in at the kiosk."
            checked={draft.allowWalkIns}
            onChange={set("allowWalkIns")}
          />
        </SettingsSection>

        <SettingsSection title="Check-out & duration" description="How visits end and when to flag long ones" icon={ClockIcon}>
          <ToggleRow
            title="Require staff clearance to check out"
            description="Kiosk check-outs wait for a staff member to approve before they are finalized."
            checked={draft.requireCheckoutClearance}
            onChange={set("requireCheckoutClearance")}
          />
          <SelectRow
            id="cp-auto-checkout"
            title="Auto check-out"
            description="Automatically check out visitors who forgot to sign out."
            value={draft.autoCheckout}
            options={autoCheckoutOptions}
            onChange={set("autoCheckout")}
          />
          <SelectRow
            id="cp-overstay"
            title="Overstay threshold"
            description="Flag a visitor as overstaying after this long onsite."
            value={draft.overstayHours}
            options={overstayOptions}
            onChange={set("overstayHours")}
          />
        </SettingsSection>

        <SettingsSection title="Security & privacy" description="Screening and how visitor data is protected" icon={LockIcon}>
          <ToggleRow
            title="Screen against the watchlist"
            description="Check every visitor against your watchlist at check-in."
            checked={draft.screenWatchlist}
            onChange={set("screenWatchlist")}
          />
          <ToggleRow
            title="Mask phone numbers"
            description="Hide most of each phone number in the Visitor Log until someone unlocks it."
            checked={draft.maskPhones}
            onChange={set("maskPhones")}
          />
          <SelectRow
            id="cp-retention"
            title="Data retention"
            description="How long visitor records are kept before they are deleted."
            value={draft.retentionDays}
            options={retentionOptions}
            onChange={set("retentionDays")}
          />
        </SettingsSection>

        <SettingsSection title="Notifications" description="Who gets told, and when" icon={BellIcon}>
          <ToggleRow
            title="Notify host on arrival"
            description="Email the host as soon as their visitor checks in."
            checked={draft.notifyHostOnArrival}
            onChange={set("notifyHostOnArrival")}
          />
          <ToggleRow
            title="Watchlist match alerts"
            description="Alert admins immediately when a visitor matches a watchlist entry."
            checked={draft.notifyWatchlistMatch}
            onChange={set("notifyWatchlistMatch")}
          />
          <ToggleRow
            title="Overstay alerts"
            description="Alert the host when a visitor passes the overstay threshold."
            checked={draft.notifyOverstay}
            onChange={set("notifyOverstay")}
          />
          <ToggleRow
            title="Daily summary email"
            description="Send admins a recap of the day's visitors every evening."
            checked={draft.dailySummary}
            onChange={set("dailySummary")}
          />
        </SettingsSection>
      </div>

      <section className="space-y-4" aria-label="Kiosk">
        <KioskLinkCard link={kiosk} />

        <SettingsSection title="Kiosk" description="The check-in screen visitors use at the front desk" icon={MonitorIcon}>
          <SettingRow title="Welcome message" description="Shown at the top of the kiosk screen." htmlFor="cp-welcome">
            <input
              id="cp-welcome"
              value={draft.welcomeMessage}
              maxLength={120}
              onChange={(event) => set("welcomeMessage")(event.target.value)}
              className={`${inputClass} h-10 w-full text-xs sm:w-[340px]`}
            />
          </SettingRow>

          <SettingRow
            title="Regenerate kiosk URL"
            description="Creates a new link and turns the old one off. Use this if the link has been shared by mistake."
          >
            {confirmingKiosk ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-soft">Replace the link?</span>
                <button
                  type="button"
                  onClick={regenerateKiosk}
                  className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white transition hover:bg-red-700"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingKiosk(false)}
                  className="rounded border border-line-strong px-2 py-0.5 text-[11px] font-medium text-soft transition hover:bg-surface-soft"
                >
                  No
                </button>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setConfirmingKiosk(true)}>
                <RotateCcwIcon size={15} />
                Regenerate
              </Button>
            )}
          </SettingRow>

          <SettingRow
            title="Regenerate kiosk code"
            description="The 6-digit code a tablet must be given before the kiosk shows anything. A new code locks every tablet until it is entered again."
          >
            {confirmingCode ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-soft">Replace the code?</span>
                <button
                  type="button"
                  onClick={regenerateKioskCode}
                  className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white transition hover:bg-red-700"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingCode(false)}
                  className="rounded border border-line-strong px-2 py-0.5 text-[11px] font-medium text-soft transition hover:bg-surface-soft"
                >
                  No
                </button>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setConfirmingCode(true)}>
                <RotateCcwIcon size={15} />
                Regenerate
              </Button>
            )}
          </SettingRow>
        </SettingsSection>
      </section>

      <p
        role="status"
        aria-live="polite"
        className={notice ? "fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-fg px-4 py-2.5 text-xs font-medium text-surface shadow-lg" : "sr-only"}
      >
        {notice}
      </p>
    </div>
  );
}
