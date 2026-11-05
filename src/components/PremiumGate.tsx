import usePremium from "@/hooks/usePremium";
import { ReactNode } from "react";

const PremiumGate = ({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) => {
  const { isPremium } = usePremium();
  return <>{isPremium ? children : fallback}</>;
};

export default PremiumGate;
