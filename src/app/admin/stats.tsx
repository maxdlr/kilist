import { AdminStats, useAdmin } from "@/admin/api";
import { A, AChips, ALoading, AText, ARow, AScreen, ASection, ATiles } from "@/admin/ui";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

const PERIODS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "0", label: "All" },
] as const;

const pct = (value: number | null | undefined) => (value === null || value === undefined ? "–" : `${value}%`);
const cohortPct = (rate: { rate: number | null; cohort: number }) =>
  rate.cohort ? `${pct(rate.rate)} of ${rate.cohort}` : "Not enough data";
const n = (value: number | null | undefined, unit = "") => (value === null || value === undefined ? "–" : `${value.toLocaleString()}${unit}`);

const Bar = ({ label, rate }: { label: string; rate: { rate: number | null; cohort: number } }) => (
  <View style={styles.bar}>
    <View style={styles.between}>
      <AText size={14} style={styles.flex}>{label}</AText>
      <AText size={14} weight="bold">{cohortPct(rate)}</AText>
    </View>
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${rate.rate ?? 0}%` }]} />
    </View>
  </View>
);

const StatsScreen = () => {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["value"]>("30");
  const { data: stats, mutate, isValidating } = useAdmin<AdminStats>(`/stats?days=${period}`);

  if (!stats) return <ALoading />;

  const { growth, firstDays, use, shopping, business, health } = stats;
  const peak = Math.max(1, ...growth.signups.map((day) => day.count));
  const totalLang = Math.max(1, growth.languages.fr + growth.languages.en + growth.languages.phone);
  const langs = [
    { label: "French", count: growth.languages.fr, color: A.ink },
    { label: "English", count: growth.languages.en, color: "#7D828D" },
    { label: "Phone (French)", count: growth.languages.phoneFr, color: "#A3A7AF" },
    { label: "Phone (English)", count: growth.languages.phoneEn, color: "#C9CBC4" },
    { label: "Phone (unknown)", count: growth.languages.phone - growth.languages.phoneFr - growth.languages.phoneEn, color: "#E1E2DD" },
  ];
  const periodLabel = period === "0" ? "all time" : `last ${period} days`;

  return (
    <AScreen
      back
      title="Stats"
      subtitle={`New, active and shopping figures cover ${periodLabel}. Totals are all time.`}
      refreshing={isValidating}
      onRefresh={() => mutate()}
      header={<AChips options={[...PERIODS]} value={period} onChange={setPeriod} />}
    >
      <ASection title="Growth">
        <View style={styles.inner}>
          <ATiles
            tiles={[
              { value: n(growth.users), label: `Users · +${growth.newUsers}` },
              { value: n(growth.households), label: `Households · +${growth.newHouseholds}` },
              { value: n(growth.peoplePerHousehold), label: "People per household" },
            ]}
          />
          <View style={styles.block}>
            <AText size={13} color={A.soft}>Sign-ups per day, last 30 days</AText>
            <View
              accessible
              accessibilityLabel={`Sign-ups per day over the last 30 days, at most ${peak} a day`}
              style={styles.chart}
            >
              {growth.signups.map((day) => (
                <View key={day.day} style={[styles.column, { height: `${Math.max(2, (day.count / peak) * 100)}%`, opacity: day.count ? 1 : 0.25 }]} />
              ))}
            </View>
          </View>
          <View style={styles.block}>
            <AText size={13} color={A.soft}>Language</AText>
            <View style={styles.stack}>
              {langs.map((lang) => (
                <View key={lang.label} style={{ flex: lang.count, backgroundColor: lang.color }} />
              ))}
            </View>
            <AText size={13} color={A.mid}>
              {langs.filter((lang) => lang.count > 0).map((lang) => `${lang.label} ${Math.round((lang.count / totalLang) * 100)}%`).join(" · ")}
            </AText>
          </View>
        </View>
        <ARow label="Solo / shared households" value={`${growth.soloHouseholds} / ${growth.sharedHouseholds}`} />
      </ASection>

      <ASection title="First days" note="New users in the period, once they are old enough to count.">
        <View style={styles.inner}>
          <Bar label="Households with 5+ foods" rate={firstDays.pickedFive} />
          <Bar label="First game within 24 h" rate={firstDays.firstGame} />
          <Bar label="First shopping trip within 7 days" rate={firstDays.firstTrip} />
        </View>
        <ARow label="Back after 1 day" value={cohortPct(firstDays.retention.day1)} />
        <ARow label="Back after 7 days" value={cohortPct(firstDays.retention.day7)} />
        <ARow label="Back after 30 days" value={cohortPct(firstDays.retention.day30)} />
      </ASection>

      <ASection title="Daily use">
        <ARow first label="Active today / this week" value={`${use.activeToday} / ${use.activeWeek}`} />
        <ARow label="Games finished" value={pct(use.gamesFinished)} />
        <ARow label={'"Not sure" answers'} value={pct(use.unsure)} />
        <ARow label={'Most "not sure"'} value={use.mostUnsure.join(", ") || "–"} />
        <ARow label="Skins in use" value={use.skins.map((skin) => `${skin.skin} ${pct(skin.share)}`).join(" · ") || "–"} />
      </ASection>

      <ASection title="Shopping">
        <ARow first label="Trips" value={n(shopping.trips)} />
        <ARow label="Items per trip (median)" value={n(shopping.itemsPerTrip)} />
        <ARow label="Trip length (median)" value={n(shopping.tripMinutes, " min")} />
        <ARow label="Suggested next, then bought" value={shopping.suggestionsShown ? `${pct(shopping.suggestionsTaken)} of ${shopping.suggestionsShown}` : "No data yet"} />
        <ARow label="Most bought" value={shopping.mostBought.map((food) => food.name).join(", ") || "–"} />
      </ASection>

      <ASection title="Business">
        <ARow first label="Points earned / spent" value={`${n(business.earned)} / ${n(business.spent)}`} />
        <ARow label="Points given by admins" value={n(business.givenByAdmins)} />
        <ARow label="Average balance" value={n(business.averageBalance)} />
        <ARow label="Within 100 points of a skin" value={`${business.nearUnlock} users`} />
        {business.unlocks.map((row) => (
          <ARow
            key={row.skin}
            label={`${row.skin.charAt(0).toUpperCase()}${row.skin.slice(1)} unlocked`}
            value={`${row.total} · ${row.points} points, ${row.gift} gifts, ${row.purchase} bought`}
          />
        ))}
      </ASection>

      <ASection title="Data health">
        <ARow first label="Foods without an icon" value={n(health.foodsWithoutIcon)} href="/admin/foods?noIcon=1" />
        <ARow label="Top names missing one" value={health.topMissingIcons.join(", ") || "–"} />
        <ARow label="Households with no foods" value={n(health.emptyHouseholds)} />
        <ARow label="Users never active" value={n(health.neverActive)} />
      </ASection>
    </AScreen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inner: { gap: 14, paddingVertical: 14 },
  block: { gap: 6, paddingHorizontal: 14 },
  between: { flexDirection: "row", gap: 12 },
  chart: { alignItems: "flex-end", flexDirection: "row", gap: 3, height: 72 },
  column: { backgroundColor: A.mid, borderTopLeftRadius: 2, borderTopRightRadius: 2, flex: 1 },
  stack: { borderRadius: 6, flexDirection: "row", height: 12, overflow: "hidden" },
  bar: { gap: 4, paddingHorizontal: 14 },
  track: { backgroundColor: A.divider, borderRadius: 4, height: 8 },
  fill: { backgroundColor: A.mid, borderRadius: 4, height: 8 },
});

export default StatsScreen;
