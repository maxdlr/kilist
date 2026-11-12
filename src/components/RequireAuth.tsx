import LoadingAnim from "@/components/elements/LoadingAnim/LoadingAnim";
import { ThemedText } from "@/components/themed-text";
import common from "@/i18n/common";
import { refreshCatalog } from "@/offline/catalog";
import { hasRules, subscribeRules } from "@/offline/rules";
import useAuth from "@/providers/AuthProvider";
import { useSkin } from "@/providers/SkinProvider";
import axios from "@/services/axios";
import { Redirect, router } from "expo-router";
import { ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import { StyleSheet, View } from "react-native";

const RETRY_MS = 4000;

const PackWait = () => {
  const skin = useSkin();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const attempt = async () => {
      await refreshCatalog(axios);
      if (!active || hasRules()) return;
      setFailed(true);
      timer = setTimeout(attempt, RETRY_MS);
    };
    attempt();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!failed) return <LoadingAnim />;

  return (
    <View style={[styles.wait, { backgroundColor: skin.colors.ground, padding: skin.spacing.gutter }]}>
      <ThemedText size={skin.type.lead} color={skin.colors.onGround} style={styles.text}>
        {common.needsConnection}
      </ThemedText>
    </View>
  );
};

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, isLoading, sessionExpired, pendingIntro, consumeIntro } = useAuth();
  const ready = useSyncExternalStore(subscribeRules, hasRules, hasRules);

  useEffect(() => {
    if (!user || !pendingIntro || !ready) return;
    consumeIntro();
    router.push("/onboarding?intro=1");
  }, [user, pendingIntro, consumeIntro, ready]);

  if (sessionExpired) {
    return <Redirect href="/login" />;
  }

  if (!ready) {
    return <PackWait />;
  }

  if (isLoading || !user) {
    return <LoadingAnim />;
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  wait: { alignItems: "center", flex: 1, justifyContent: "center" },
  text: { textAlign: "center" },
});

export default RequireAuth;
