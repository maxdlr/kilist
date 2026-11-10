import ActionPanel from "@/components/elements/ActionPanel";
import Onboarding from "@/components/views/Onboarding";
import common from "@/i18n/common";
import { canAskPermission, requestPermission } from "@/notifications/push";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

const OnboardingScreen = () => {
  const { intro } = useLocalSearchParams<{ intro?: string }>();
  const [asking, setAsking] = useState(false);
  const T = common.notifications.ask;

  const done = async () => {
    if (await canAskPermission().catch(() => false)) setAsking(true);
    else router.replace("/");
  };

  return (
    <>
      <Onboarding intro={intro === "1"} onDone={done} />
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
          router.replace("/");
        }}
      />
    </>
  );
};

export default OnboardingScreen;
