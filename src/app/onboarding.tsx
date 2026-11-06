import Onboarding from "@/components/views/Onboarding";
import { router, useLocalSearchParams } from "expo-router";

const OnboardingScreen = () => {
  const { intro } = useLocalSearchParams<{ intro?: string }>();
  return <Onboarding intro={intro === "1"} onDone={() => router.replace("/")} />;
};

export default OnboardingScreen;
