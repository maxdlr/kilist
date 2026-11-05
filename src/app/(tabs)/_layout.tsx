import AppTabs from "@/components/app-tabs";
import RequireAuth from "@/components/RequireAuth";
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
          </TabBarProvider>
        </TicketsProvider>
      </HouseholdProvider>
    </RequireAuth>
  );
}
