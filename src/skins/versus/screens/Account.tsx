import common from "@/i18n/common";
import V from "../text";
import AccountPanels from "@/components/views/Account/_components/AccountPanels";
import LooksShowcase from "@/components/views/Account/_components/LooksShowcase";
import useAccount from "@/hooks/screens/useAccount";
import { mmss, seconds, useVersusMe } from "@/hooks/versus/api";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { versusPalette as P } from "..";
import { Avatar, Card, memberColor, Screen, VButton, VText } from "./parts";

const Stat = ({ value, label }: { value: string; label: string }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <View style={styles.stat}>
      <VText face="bold" size={skin.type.body}>{value}</VText>
      <VText size={skin.type.caption - 1} color={P.muted}>{label}</VText>
    </View>
  );
};

const MenuRow = ({ label, detail, onPress, first = false }: { label: string; detail?: string; onPress: () => void; first?: boolean }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, !first && styles.menuBorder, pressed && { backgroundColor: P.panelHigh }]}
    >
      <VText size={skin.type.body}>{label}</VText>
      <VText size={skin.type.label} color={P.muted}>{detail ?? "›"}</VText>
    </Pressable>
  );
};

const VersusAccount = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.account;
  const account = useAccount();
  const { data: stats, mutate } = useVersusMe();
  const { user, setOpenPanel } = account;

  useFocusEffect(
    useCallback(() => {
      mutate();
    }, [mutate]),
  );

  if (!user) return null;

  const memberList = account.members.map((member) => ({ id: member.id, username: member.username }));
  const solo = account.members.length <= 1;
  const personal = stats?.personal;
  const wins = stats?.headToHead.reduce((sum, row) => sum + row.wins, 0) ?? 0;
  const losses = stats?.headToHead.reduce((sum, row) => sum + row.losses, 0) ?? 0;
  const recent = personal?.recent ?? [];
  const slowest = Math.max(1, ...recent.map((entry) => entry.totalMs));
  const bars = recent.map((entry, index) => ({
    ...entry,
    isBest: recent.slice(0, index).every((earlier) => entry.totalMs < earlier.totalMs),
  }));

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <Screen padded={false}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.profile}>
            <Avatar name={user.username} color={P.you} size={skin.size.button.lg} />
            <View style={styles.flex}>
              <VText face="display" size={skin.type.headline} numberOfLines={1}>{user.username}</VText>
              <VText size={skin.type.label} color={P.muted} numberOfLines={1}>{user.email}</VText>
            </View>
            {!solo && (
              <View style={styles.record}>
                <VText face="pixel" size={(skin.type.caption - 1)}>{`${wins}–${losses}`}</VText>
                <VText size={skin.type.caption - 1} color={P.muted}>{V.account.allRaces}</VText>
              </View>
            )}
          </View>

          <LooksShowcase titleColor={P.white} lineColor={P.soft} />

          {solo ? (
            <Card dashed line={P.you}>
              <View style={styles.cardHead}>
                <Avatar name={user.username} color={P.you} size={skin.size.button.xs - 8} ghost />
                <VText face="bold" size={skin.type.lead} style={styles.flex}>{V.youVsBest}</VText>
              </View>
              <View style={styles.stats}>
                <Stat value={seconds(personal?.bestRaceMs)} label={V.account.bestRace} />
                <Stat value={mmss(personal?.bestShopMs)} label={V.account.bestShop} />
                <Stat value={String(personal?.newBests ?? 0)} label={V.account.newBests} />
              </View>
              {recent.length > 1 && (
                <View style={styles.chartWrap}>
                  <VText size={skin.type.caption} color={P.muted}>{V.account.raceTimes(recent.length)}</VText>
                  <View
                    accessible
                    accessibilityLabel={V.account.raceTimesAria(seconds(recent[0]!.totalMs), seconds(recent[recent.length - 1]!.totalMs))}
                    style={styles.chart}
                  >
                    {bars.map((entry) => (
                      <View
                        key={entry.day}
                        style={[styles.bar, { backgroundColor: entry.isBest ? P.you : P.line, height: `${Math.round((entry.totalMs / slowest) * 100)}%` }]}
                      />
                    ))}
                  </View>
                </View>
              )}
            </Card>
          ) : (
            <View style={styles.section}>
              <VText face="bold" size={skin.type.lead}>{V.account.headToHead}</VText>
              {(stats?.headToHead ?? []).map((rival) => {
                const color = memberColor(memberList, user.id, rival.userId);
                return (
                  <Card key={rival.userId} line={color}>
                    <View style={styles.cardHead}>
                      <Avatar name={rival.username} color={color} size={skin.size.button.xs - 8} />
                      <VText face="bold" size={skin.type.lead} style={styles.flex} numberOfLines={1}>
                        {V.account.youVs(rival.username)}
                      </VText>
                      <VText face="display" size={skin.type.title}>{`${rival.wins}–${rival.losses}`}</VText>
                    </View>
                    <View style={styles.stats}>
                      <Stat value={String(rival.clashes)} label={V.account.clashes} />
                      <Stat value={V.account.of(rival.rightInClashes, rival.clashes)} label={V.account.youWereRight} />
                      <Stat value={rival.shopRecord === null ? "–" : rival.shopRecord === "you" ? V.you : rival.username} label={V.account.shopRecord} />
                    </View>
                  </Card>
                );
              })}
            </View>
          )}

          <Card>
            <VText size={skin.type.caption} color={P.muted}>{copy.household}</VText>
            <VText face="bold" size={skin.type.title - 2}>
              {`${account.householdName || copy.householdFallback}${solo ? V.account.onePlayer : ""}`}
            </VText>
            {solo && (
              <VText size={skin.type.label} color={P.soft}>{V.account.inviteLine}</VText>
            )}
            <View style={styles.codeRow}>
              <View style={styles.code}>
                <VText face="pixel" size={(skin.type.caption - 1)}>{account.joinCode}</VText>
              </View>
              <VButton label={copy.share} accessibilityLabel={V.account.shareAria} onPress={account.shareCode} />
              <VButton label={copy.qr} accessibilityLabel={V.account.qrAria} onPress={() => setOpenPanel("qr")} />
            </View>
          </Card>

          <Card style={styles.menu}>
            <MenuRow first label={solo ? V.account.joinHouse : copy.switch} onPress={() => setOpenPanel("switch")} />
            <MenuRow label={copy.suggested} onPress={account.replayOnboarding} />
            <MenuRow label={common.language} detail={`${account.languageName} ›`} onPress={account.openLanguage} />
            <MenuRow label={copy.credits} onPress={account.openCredits} />
          </Card>

          <View style={styles.danger}>
            <VText size={skin.type.caption} color={P.muted}>{copy.dangerTitle}</VText>
            <Card style={styles.menu}>
              <MenuRow first label={copy.logout} detail=" " onPress={account.logOut} />
            </Card>
            {!account.isAdmin && <VButton variant="danger" label={copy.delete} onPress={() => setOpenPanel("delete")} />}
          </View>
        </ScrollView>
      </Screen>
      <AccountPanels account={account} />
    </KeyboardAvoidingView>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    scroll: { gap: s.spacing.stack, paddingBottom: s.spacing.stack, paddingHorizontal: s.spacing.gutter },
    profile: { alignItems: "center", flexDirection: "row", gap: s.spacing.dock - 2 },
    record: { alignItems: "flex-end", gap: s.spacing.tight },
    section: { gap: s.spacing.inline },
    cardHead: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline + 2 },
    stats: { flexDirection: "row", gap: s.spacing.small },
    stat: { backgroundColor: P.panelHigh, borderRadius: s.spacing.inline + 2, flex: 1, gap: s.spacing.hair, padding: s.spacing.small },
    chartWrap: { gap: s.spacing.tight + 2 },
    chart: { alignItems: "flex-end", flexDirection: "row", gap: s.spacing.tight + 2, height: 56 },
    bar: { borderTopLeftRadius: 4, borderTopRightRadius: 4, flex: 1 },
    codeRow: { alignItems: "center", flexDirection: "row", gap: s.spacing.small },
    code: {
      borderColor: P.line,
      borderRadius: s.spacing.dock - 2,
      borderStyle: "dashed",
      borderWidth: s.shape.border,
      flex: 1,
      minWidth: 0,
      paddingHorizontal: s.spacing.inline + 2,
      paddingVertical: s.spacing.inline,
    },
    danger: { gap: s.spacing.small, marginTop: s.spacing.section },
    menu: { gap: 0, overflow: "hidden", padding: 0 },
    menuRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      minHeight: s.size.button.md,
      paddingHorizontal: s.spacing.stack,
    },
    menuBorder: { borderTopColor: P.line, borderTopWidth: s.shape.divider },
  });

export default VersusAccount;
