import EmptyData from "@/components/elements/EmptyData";
import LoadingAnim from "@/components/elements/LoadingAnim/LoadingAnim";
import useHomeData from "@/hooks/screens/useHomeData";
import { useSkin } from "@/providers/SkinProvider";
import Dashboard from "./Dashboard";

const RoastHome = () => {
  const skin = useSkin();
  const { dashboard, isLoading, refresh } = useHomeData();

  if (dashboard) return <Dashboard dashboard={dashboard} onRefresh={refresh} />;
  if (isLoading) return <LoadingAnim />;

  return (
    <EmptyData
      label={skin.copy.errors.dashboardLabel}
      title={skin.copy.errors.title}
      fill={skin.colors.alert}
      onRefresh={refresh}
    />
  );
};

export default RoastHome;
