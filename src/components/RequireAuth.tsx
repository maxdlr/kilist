import LoadingAnim from "@/components/elements/LoadingAnim/LoadingAnim";
import useAuth from "@/providers/AuthProvider";
import { Redirect } from "expo-router";
import { ReactNode } from "react";

// Guards a screen/layout that requires an authenticated session: shows a
// loading spinner while the session is resolving, redirects to /login if
// there isn't one, otherwise renders its children.
const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingAnim />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <>{children}</>;
};

export default RequireAuth;
