import LoadingAnim from "@/components/elements/LoadingAnim/LoadingAnim";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import useAuth from "@/providers/AuthProvider";
import { Redirect } from "expo-router";
import { ReactNode } from "react";
import { StyleSheet } from "react-native";

// Guards a screen/layout that requires an authenticated session: shows a
// loading spinner while the session is resolving, redirects to /login if
// there isn't one, otherwise renders its children.
const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  const theme = useTheme();

  if (isLoading) {
    return (
      <ThemedView style={styles.loading}>
        <LoadingAnim colorScale={theme.confirm} />
      </ThemedView>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default RequireAuth;
