import HomeShortcuts from "@/components/features/Home/HomeShortcuts";
import SyncNote from "@/components/elements/SyncNote";
import V from "@/skins/versus/text";
import HomeLinksBlock from "@/components/features/Home/HomeLinksBlock";
import PullToRefresh from "@/components/gestures/PullToRefresh";
import useHomeData from "@/hooks/screens/useHomeData";
import { useStandings } from "@/skins/versus/hooks/api";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import useTickets from "@/providers/TicketsProvider";
import type { Skin } from "@/skins/types";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { versusPalette as P } from "@/skins/versus/theme/palette";
import { Card, Kicker, Screen, VText } from "@/skins/versus/components";
import { VersusError, VersusLoading } from "../States";
import ListBar from "./_components/ListBar";
import HouseHome from "./_components/HouseHome";
import SoloHome from "./_components/SoloHome";

const VersusHome = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const [period, setPeriod] = useState<"week" | "season">("week");
  const standings = useStandings(period);
  const refreshStandings = standings.mutate;
  const home = useHomeData();
  const { counter } = useTickets();

  useFocusEffect(
    useCallback(() => {
      refreshStandings();
    }, [refreshStandings]),
  );

  if (!standings.data) {
    return standings.isLoading ? <VersusLoading /> : <VersusError onRetry={() => standings.mutate()} />;
  }

  const solo = standings.data.today.length <= 1;
  const refresh = () => Promise.all([standings.mutate(), home.refresh()]);

  return (
    <PullToRefresh onRefresh={refresh}>
      <Screen
        padded={false}
        dock={
          <>
            <HomeLinksBlock ink={P.white} muted={P.muted} fill={P.panel} />
          </>
        }
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.between}>
            <View>
              <Kicker>{solo ? V.home.soloKicker : V.home.houseKicker}</Kicker>
              <VText face="display" size={skin.type.headline}>
                {solo ? V.home.soloTitle : V.home.houseTitle}
              </VText>
            </View>
            <View style={styles.topRight}>
              {counter && (
                <View style={styles.pill}>
                  <VText face="bold" size={skin.type.caption}>{V.tickets(counter.balance)}</VText>
                </View>
              )}
              <HomeShortcuts ink={P.white} fill={P.panel} />
            </View>
          </View>
          <SyncNote />
          {solo ? <SoloHome /> : <HouseHome standings={standings.data} period={period} onPick={setPeriod} />}
          {home.dashboard && (
            <Card>
              <View style={styles.between}>
                <VText face="bold" size={skin.type.lead}>
                  {home.range.high ? V.home.listNeeded(home.range.low, home.range.high) : V.home.stocked}
                </VText>
                <VText size={skin.type.caption} color={P.muted}>{V.foodsCount(home.dashboard.foods.total)}</VText>
              </View>
              <ListBar counts={home.counts} />
            </Card>
          )}
        </ScrollView>
      </Screen>
    </PullToRefresh>
  );
};

export default VersusHome;

const createStyles = (s: Skin) =>
  StyleSheet.create({
    scroll: { gap: s.spacing.stack, paddingBottom: s.spacing.stack, paddingHorizontal: s.spacing.gutter },
    between: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: s.spacing.inline },
    topRight: { alignItems: "center", flexDirection: "row", gap: s.spacing.small },
    pill: { backgroundColor: P.panel, borderRadius: 999, paddingHorizontal: s.spacing.inline, paddingVertical: s.spacing.tight + 2 },
  });
