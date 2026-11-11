import { A, AEmpty, ARow, AScreen, ASection, ATiles } from "@/admin/ui";
import { AdminStats, useAdmin } from "@/admin/api";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import useAuth from "@/providers/AuthProvider";
import { router } from "expo-router";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

const Icon = ({ d }: { d: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={A.mid} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <Path d={d} />
  </Svg>
);

const AdminHome = () => {
  const { user } = useAuth();
  const isAdmin = user?.type === "admin";
  const { data: stats, mutate, isValidating } = useAdmin<AdminStats>(isAdmin ? "/stats?days=7" : null);
  useStatusBarStyle("dark");

  if (!isAdmin) {
    return (
      <AScreen back backLabel="Back" backTo="/" title="Admin">
        <AEmpty line="Admins only." />
      </AScreen>
    );
  }

  const number = (value?: number) => (value === undefined ? "–" : value.toLocaleString());

  return (
    <AScreen back backLabel="Back" backTo="/" title="Admin" subtitle="Last 7 days" refreshing={isValidating} onRefresh={() => mutate()}>
      <ATiles
        onPress={() => router.push("/admin/stats")}
        tiles={[
          { value: number(stats?.growth.users), label: "Users" },
          { value: number(stats?.use.activeWeek), label: "Active this week" },
          { value: number(stats?.shopping.trips), label: "Trips this week" },
        ]}
      />
      <ASection title="Insights">
        <ARow first label="Stats" value="Growth, use, business" href="/admin/stats" left={<Icon d="M4 20V10M10 20V4M16 20v-7M22 20H2" />} />
      </ASection>
      <ASection title="Manage">
        <ARow first label="Users" value={number(stats?.growth.users)} href="/admin/users" left={<Icon d="M16 19a4 4 0 0 0-8 0M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />} />
        <ARow label="Households" value={number(stats?.growth.households)} href="/admin/households" left={<Icon d="M4 11l8-6 8 6v8H4zM10 19v-5h4v5" />} />
        <ARow label="Foods" value={number(stats?.growth.foods)} href="/admin/foods" left={<Icon d="M7 4h10l-1 16H8zM7 8h10" />} />
        <ARow label="Lists" href="/admin/lists" left={<Icon d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />} />
      </ASection>
      <ASection title="Tools">
        <ARow first label="Emails" value="Templates, history" href="/admin/emails" left={<Icon d="M3 6h18v12H3zM3 7l9 6 9-6" />} />
        <ARow label="Jobs and action log" href="/admin/jobs" left={<Icon d="M14 6l4 4M4 20l9-9M13 5l6 6-3 3-6-6z" />} />
      </ASection>
      <View />
    </AScreen>
  );
};

export default AdminHome;
