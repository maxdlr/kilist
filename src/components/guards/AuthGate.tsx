import useAuth from "@/providers/AuthProvider";
import { Redirect, usePathname } from "expo-router";

const LOGIN_ROUTE = "/login";

// Rendered as a sibling of the navigator, never in its place — the
// navigator must mount unconditionally on first render, or expo-router's
// own linking resolution can try to update it before it exists.
//
// Its only job: bounce an already-authenticated user away from /login.
// Unauthenticated access to protected screens is handled by RequireAuth.
const AuthGate = () => {
  const { user, isGuest, needsOnboarding } = useAuth();
  const pathname = usePathname();

  if (user && !isGuest && pathname === LOGIN_ROUTE) {
    return <Redirect href={needsOnboarding ? "/onboarding?intro=1" : "/"} />;
  }

  return null;
};

export default AuthGate;
