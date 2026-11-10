import AppTabs from "@/components/app-tabs";
import RequireAuth from "@/components/RequireAuth";
import SyncBridge from "@/offline/SyncBridge";
import NotificationsBridge from "@/notifications/NotificationsBridge";
import { AccountGateProvider } from "@/providers/AccountGateProvider";
import { HouseholdProvider } from "@/providers/HouseholdProvider";
import { TabBarProvider } from "@/providers/TabBarProvider";
import { TicketsProvider } from "@/providers/TicketsProvider";

export default function TabsLayout() {
  return (
    <RequireAuth>
      <HouseholdProvider>
        <TicketsProvider>
          <TabBarProvider>
            <AccountGateProvider>
              <AppTabs />
              <SyncBridge />
              <NotificationsBridge />
            </AccountGateProvider>
          </TabBarProvider>
        </TicketsProvider>
      </HouseholdProvider>
    </RequireAuth>
  );
}
