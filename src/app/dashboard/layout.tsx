import type { ReactNode } from "react";
import { AccountSettingsProvider } from "@/src/components/account/account-settings-provider";
import { AuditProvider } from "@/src/components/dashboard/audit-provider";
import { CurrentUserProvider } from "@/src/components/dashboard/current-user-provider";
import { LocationsProvider } from "@/src/components/dashboard/locations-provider";
import { NotificationsProvider } from "@/src/components/dashboard/notifications-provider";
import { SettingsProvider } from "@/src/components/dashboard/settings-provider";
import { UsersProvider } from "@/src/components/dashboard/users-provider";
import { VisitorsProvider } from "@/src/components/dashboard/visitors-provider";
import { DashboardShell } from "@/src/components/layout/dashboard-shell";

export const instant = false;
export default function DashboardLayout({ children }: { children: ReactNode }) {
  // CurrentUserProvider loads the signed-in user from the API and VisitorsProvider loads the visitor list.
  // AuditProvider loads the audit trail from the API when the Audit Trail page opens.
  
  return (
    <CurrentUserProvider>
      <SettingsProvider>
        <AuditProvider>
          <VisitorsProvider>
            <LocationsProvider>
              <UsersProvider>
                <AccountSettingsProvider>
                  <NotificationsProvider>
                    <DashboardShell>{children}</DashboardShell>
                  </NotificationsProvider>
                </AccountSettingsProvider>
              </UsersProvider>
            </LocationsProvider>
          </VisitorsProvider>
        </AuditProvider>
      </SettingsProvider>
    </CurrentUserProvider>
  );
}
