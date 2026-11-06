import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import PullToRefresh from "@/components/gestures/PullToRefresh/PullToRefresh";
import { ThemedText } from "@/components/themed-text";
import useHomeData from "@/hooks/screens/useHomeData";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { SwipeGameType } from "@/providers/SwipeFoodsProvider";
import useTickets from "@/providers/TicketsProvider";
import type { Skin } from "@/skins/types";
import { levelOf, THRESHOLDS } from "@/utils/scoreUtils";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import useSWR from "swr";
import { arcadePalette as P } from "..";
import Ground from "./Ground";
import { shadowOf, TicketChip } from "./parts";
import { ArcadeError, ArcadeLoading } from "./States";
import { arcadeText as T } from "./text";

const COIN_STEP = 10;

const Tube = ({
  count,
  max,
  label,
  fill,
  height,
}: {
  count: number;
  max: number;
  label: string;
  fill: string;
  height: number;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const room = Math.max(0, height - skin.type.lead * 2);
  const coins = max ? Math.round((count / max) * (room / COIN_STEP)) : 0;

  return (
    <View accessible accessibilityLabel={`${label}: ${count}`} style={styles.tubeSlot}>
      <ThemedText size={skin.type.lead} color={P.white}>
        {String(count)}
      </ThemedText>
      <View style={styles.tube}>
        {Array.from({ length: Math.max(count ? 1 : 0, coins) }, (_, index) => (
          <View key={index} style={[styles.coin, { backgroundColor: fill }]} />
        ))}
      </View>
      <ThemedText
        numberOfLines={2}
        size={skin.type.caption - 3}
        color={P.white}
        style={styles.tubeLabel}
      >
        {label}
      </ThemedText>
    </View>
  );
};

const ArcadeHome = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.home;
  const { dashboard, isLoading, refresh, needed, counts } = useHomeData();
  const { counter } = useTickets();
  const tzOffset = useMemo(() => new Date().getTimezoneOffset(), []);
  const { data: game } = useSWR<SwipeGameType>({
    url: "swipe-list/game",
    params: { tzOffset },
  });
  const [tubeHeight, setTubeHeight] = useState(0);

  if (!dashboard) {
    return isLoading ? <ArcadeLoading /> : <ArcadeError onRetry={refresh} />;
  }

  const max = Math.max(...counts, 1);

  return (
    <PullToRefresh onRefresh={refresh}>
      <Ground
        dock={
          <>
            <KilButton
              height={skin.size.button.xl - skin.spacing.tight}
              fontSize={skin.type.title}
              {...(needed
                ? { label: copy.shop, href: "/shop" as const }
                : { label: copy.swipe, href: "/swipe" as const })}
            />
            <ThemedText size={skin.type.caption} color={P.lilac} style={styles.tally}>
              {copy.tally(dashboard.foods.total, dashboard.shopLists.total, dashboard.swipes.total)}
            </ThemedText>
          </>
        }
      >
        <View style={styles.top}>
          <View style={styles.streak}>
            <ThemedText size={skin.type.label} color={P.navy}>
              {T.day(game?.level ?? 1)}
            </ThemedText>
          </View>
          {counter && <TicketChip count={counter.balance} />}
        </View>

        <View style={[styles.marquee, { boxShadow: shadowOf(skin, 1, P.plankShadow) }]}>
          <View style={styles.marqueeInner}>
            <Title
              size={skin.type.display.md}
              lines={2}
              color={P.white}
              textStyle={styles.center}
            >
              {copy.headline(needed)}
            </Title>
          </View>
        </View>

        <View
          accessibilityLabel={T.homeTubes}
          style={styles.tubes}
          onLayout={(event) => setTubeHeight(event.nativeEvent.layout.height)}
        >
          {tubeHeight > 0 &&
            THRESHOLDS.map((threshold, index) => {
              const level = levelOf(threshold);
              return (
                <Tube
                  key={threshold}
                  count={counts[index] ?? 0}
                  max={max}
                  label={skin.copy.levels[level]}
                  fill={skin.colors.levels[level]}
                  height={tubeHeight - skin.type.lead * 1.4}
                />
              );
            })}
        </View>
      </Ground>
    </PullToRefresh>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    center: {
      textAlign: "center",
    },
    top: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    streak: {
      backgroundColor: P.yellow,
      borderColor: P.navy,
      borderRadius: s.size.button.xl,
      borderWidth: s.shape.border,
      paddingHorizontal: s.spacing.stack,
      paddingVertical: s.spacing.tight + 2,
    },
    marquee: {
      backgroundColor: P.navy,
      borderColor: P.navy,
      borderRadius: s.shape.radius + s.spacing.small,
      borderWidth: s.shape.border,
      padding: s.spacing.small,
    },
    marqueeInner: {
      borderColor: P.white,
      borderRadius: s.shape.radius,
      borderStyle: "dotted",
      borderWidth: s.shape.border + 2,
      paddingHorizontal: s.spacing.stack,
      paddingVertical: s.spacing.section,
    },
    tubes: {
      flex: 1,
      flexDirection: "row",
      gap: s.spacing.small,
      minHeight: 0,
    },
    tubeSlot: {
      alignItems: "center",
      flex: 1,
      gap: s.spacing.tight,
    },
    tube: {
      backgroundColor: "rgba(255,255,255,0.18)",
      borderBottomLeftRadius: s.spacing.inline,
      borderBottomRightRadius: s.spacing.inline,
      borderColor: P.navy,
      borderTopLeftRadius: s.size.button.xl,
      borderTopRightRadius: s.size.button.xl,
      borderWidth: s.shape.border,
      flex: 1,
      flexDirection: "column-reverse",
      overflow: "hidden",
      padding: s.spacing.tight,
      alignSelf: "stretch",
    },
    coin: {
      borderColor: P.navy,
      borderRadius: COIN_STEP,
      borderWidth: 2,
      height: COIN_STEP,
    },
    tubeLabel: {
      textAlign: "center",
    },
    tally: {
      textAlign: "center",
    },
  });

export default ArcadeHome;
