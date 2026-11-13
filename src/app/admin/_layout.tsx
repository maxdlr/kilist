import RequireAuth from "@/components/RequireAuth";
import { useSlideStackOptions } from "@/services/screenSlide";
import { Stack } from "expo-router/js-stack";

const AdminLayout = () => {
  const slideOptions = useSlideStackOptions();

  return (
    <RequireAuth>
      <Stack screenOptions={{ headerShown: false, ...slideOptions }} />
    </RequireAuth>
  );
};

export default AdminLayout;
