import ActionPanel from "@/components/elements/ActionPanel";
import Onboarding from "@/components/views/Onboarding";
import common from "@/i18n/common";
import { canAskPermission, requestPermission } from "@/notifications/push";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

const OnboardingScreen = () => {
  const { intro, replay } = useLocalSearchParams<{ intro?: string; replay?: string }>();
  const [asking, setAsking] = useState(false);
  const T = common.notifications.ask;

  const [target, setTarget] = useState<"/" | "/swipe">("/");

  const done = async (startRound: boolean) => {
    const next = startRound ? "/swipe" : "/";
    if (intro !== "1") {
      if (router.canGoBack()) router.back();
      else router.replace("/");
      return;
    }
    setTarget(next);
    if (await canAskPermission().catch(() => false)) setAsking(true);
    else router.replace(next);
  };

  return (
    <>
      <Onboarding
        intro={intro === "1"}
        backTo={replay === "1" ? "/account" : intro !== "1" ? "/inventory" : undefined}
        onDone={done}
      />
      <ActionPanel
        request={
          asking
            ? {
                title: T.title,
                message: T.line,
                cancelLabel: T.later,
                actions: [{ label: T.yes, onPress: () => requestPermission().catch(() => false) }],
              }
            : null
        }
        onClose={() => {
          setAsking(false);
          router.replace(target);
        }}
      />
    </>
  );
};

export default OnboardingScreen;
