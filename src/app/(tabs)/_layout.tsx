import AppTabs from "@/components/app-tabs";
import RequireAuth from "@/components/RequireAuth";

export default function TabsLayout() {
  return (
    <RequireAuth>
      <AppTabs />
    </RequireAuth>
  );
}
