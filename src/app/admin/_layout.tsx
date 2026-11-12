import AnimationService from "@/services/animation";
import RequireAuth from "@/components/RequireAuth";
import { Stack } from "expo-router";

const AdminLayout = () => (
  <RequireAuth>
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: AnimationService.screen.duration,
      }}
    />
  </RequireAuth>
);

export default AdminLayout;
