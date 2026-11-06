import { DashboardType } from "@/components/views/Dashboard/interfaces";
import { THRESHOLDS } from "@/utils/scoreUtils";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import useSWR from "swr";

const useHomeData = () => {
  const { data, isLoading, mutate } = useSWR<DashboardType>({
    url: "/dashboard",
  });

  useFocusEffect(
    useCallback(() => {
      mutate();
    }, [mutate]),
  );

  const summary = data?.foods.scoreSummary;

  return {
    dashboard: data,
    isLoading,
    refresh: mutate,
    needed: summary ? summary[0] + summary[0.25] : 0,
    counts: summary ? THRESHOLDS.map((threshold) => summary[threshold]) : [],
  };
};

export default useHomeData;
