import AppTabs from "@/components/app-tabs";
import FoodListProvider from "@/providers/FoodListProvider";
import { ListType } from "@/types/model";
import useSWR from "swr";

export default function TabsLayout() {
  return <AppTabs />;
}
