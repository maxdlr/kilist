import AppTabs from "@/components/app-tabs";
import RequireAuth from "@/components/RequireAuth";
import { HouseholdProvider } from "@/providers/HouseholdProvider";

export default function TabsLayout() {
  return (
    <RequireAuth>
      <HouseholdProvider>
        <AppTabs />
      </HouseholdProvider>
    </RequireAuth>
  );
}
