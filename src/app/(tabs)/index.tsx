import EmptyData from "@/components/elements/EmptyData";
import LoadingAnim from "@/components/elements/LoadingAnim/LoadingAnim";
import Dashboard from "@/components/views/Dashboard/Dashboard";
import { DashboardType } from "@/components/views/Dashboard/interfaces";
import { useSkin } from "@/providers/SkinProvider";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import useSWR from "swr";

const HomeScreen = () => {
  const skin = useSkin();
  const { data, isLoading, mutate } = useSWR<DashboardType>({
    url: "/dashboard",
  });

  useFocusEffect(
    useCallback(() => {
      mutate();
    }, [mutate]),
  );

  if (data) return <Dashboard dashboard={data} onRefresh={mutate} />;
  if (isLoading) return <LoadingAnim />;

  return (
    <EmptyData
      label={skin.copy.errors.dashboardLabel}
      title={skin.copy.errors.title}
      fill={skin.colors.alert}
      onRefresh={mutate}
    />
  );
};

export default HomeScreen;
