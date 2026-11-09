import LoadingAnim from "@/components/elements/LoadingAnim/LoadingAnim";
import useAuth from "@/providers/AuthProvider";
import { Redirect, router } from "expo-router";
import { ReactNode, useEffect } from "react";

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, isLoading, sessionExpired, pendingIntro, consumeIntro } = useAuth();

  useEffect(() => {
    if (!user || !pendingIntro) return;
    consumeIntro();
    router.push("/onboarding?intro=1");
  }, [user, pendingIntro, consumeIntro]);

  if (sessionExpired) {
    return <Redirect href="/login" />;
  }

  if (isLoading || !user) {
    return <LoadingAnim />;
  }

  return <>{children}</>;
};

export default RequireAuth;
