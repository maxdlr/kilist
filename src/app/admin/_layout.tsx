import RequireAuth from "@/components/RequireAuth";
import { Stack } from "expo-router";

const AdminLayout = () => (
  <RequireAuth>
    <Stack screenOptions={{ headerShown: false }} />
  </RequireAuth>
);

export default AdminLayout;
