import AppTabs from "@/components/app-tabs";
import RequireAuth from "@/components/RequireAuth";
import { HouseholdProvider } from "@/providers/HouseholdProvider";
import { TabBarProvider } from "@/providers/TabBarProvider";

export default function TabsLayout() {
  return (
    <RequireAuth>
      <HouseholdProvider>
        <TabBarProvider>
          <AppTabs />
        </TabBarProvider>
      </HouseholdProvider>
    </RequireAuth>
  );
}
