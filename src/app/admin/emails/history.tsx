import { AdminEmailLog, emailTitle, Paged, query, useAdmin } from "@/admin/api";
import { A, AChips, AEmpty, ALoading, ARow, AScreen, ASearch, ASection, AText, when } from "@/admin/ui";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
  { value: "not_configured", label: "Not sent" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

const STATUS_LABEL: Record<AdminEmailLog["status"], string> = {
  sent: "Sent",
  failed: "Failed",
  not_configured: "Not sent",
};

const EmailHistoryScreen = () => {
  const { userId, username } = useLocalSearchParams<{ userId?: string; username?: string }>();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const { data, isValidating, mutate } = useAdmin<Paged<AdminEmailLog>>(
    `/emails/history${query({ userId, search: search.trim(), status: filter !== "all" && filter })}`,
  );

  if (!data) return <ALoading />;

  return (
    <AScreen
      back
      backLabel="Back"
      title={username ? `Emails to ${username}` : "Email history"}
      count={data.total}
      refreshing={isValidating}
      onRefresh={() => mutate()}
      header={
        <View style={styles.header}>
          {!userId && <ASearch value={search} onChange={setSearch} placeholder="Name or email" />}
          <AChips options={[...FILTERS]} value={filter} onChange={setFilter} />
        </View>
      }
    >
      <ASection>
        {data.items.length === 0 && <AEmpty line="No email here yet. Emails appear once the app sends them." />}
        {data.items.map((log, index) => (
          <ARow
            key={log.id}
            first={index === 0}
            label={emailTitle(log.emailId)}
            sub={[log.user?.username ?? "Deleted user", log.recipient, log.lang.toUpperCase(), log.error].filter(Boolean).join(" · ")}
            value={`${STATUS_LABEL[log.status]} · ${when(log.at)}`}
            tone={log.status === "failed" ? "danger" : "plain"}
            href={log.user ? `/admin/users/${log.user.id}` : undefined}
          />
        ))}
      </ASection>
      {data.total > data.items.length && (
        <AText size={13} color={A.soft} style={styles.more}>{`Showing ${data.items.length} of ${data.total}. Search to narrow it down.`}</AText>
      )}
    </AScreen>
  );
};

const styles = StyleSheet.create({
  header: { gap: 8 },
  more: { paddingHorizontal: 20 },
});

export default EmailHistoryScreen;
