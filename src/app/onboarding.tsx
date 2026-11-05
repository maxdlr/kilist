import Onboarding from "@/components/views/Onboarding";
import { router } from "expo-router";

const OnboardingScreen = () => {
  return <Onboarding onDone={() => router.replace("/")} />;
};

export default OnboardingScreen;
