import AppTabs from "@/components/app-tabs";
import RequireAuth from "@/components/RequireAuth";
import SyncBridge from "@/offline/SyncBridge";
import { HouseholdProvider } from "@/providers/HouseholdProvider";
import { TabBarProvider } from "@/providers/TabBarProvider";
import { TicketsProvider } from "@/providers/TicketsProvider";

export default function TabsLayout() {
  return (
    <RequireAuth>
      <HouseholdProvider>
        <TicketsProvider>
          <TabBarProvider>
            <AppTabs />
            <SyncBridge />
          </TabBarProvider>
        </TicketsProvider>
      </HouseholdProvider>
    </RequireAuth>
  );
}
