import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { versusPalette as P } from "..";
import { Avatar, Kicker, Screen, VButton, VText } from "./parts";

const BOUNCE_MS = 320;

export const VersusLoading = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const lift = useSharedValue(0);

  useEffect(() => {
    lift.set(withRepeat(withTiming(1, { duration: BOUNCE_MS }), -1, true));
  }, [lift]);

  const left = useAnimatedStyle(() => ({ transform: [{ translateY: -lift.value * 14 }] }));
  const right = useAnimatedStyle(() => ({ transform: [{ translateY: (lift.value - 1) * 14 }] }));

  return (
    <Screen>
      <View accessibilityRole="progressbar" accessibilityLabel="Loading" style={styles.center}>
        <View style={styles.row}>
          <Animated.View style={left}>
            <Avatar name="You" color={P.you} size={skin.size.button.lg} />
          </Animated.View>
          <VText face="display" size={skin.type.headline}>
            VS
          </VText>
          <Animated.View style={right}>
            <Avatar name="?" color={P.mates[0]!} size={skin.size.button.lg} />
          </Animated.View>
        </View>
        <VText face="pixel" size={(skin.type.caption - 1)}>
          WARMING UP…
        </VText>
        <VText size={skin.type.label} color={P.muted}>
          Fetching the house scores
        </VText>
      </View>
    </Screen>
  );
};

export const VersusError = ({ onRetry }: { onRetry: () => unknown }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const [busy, setBusy] = useState(false);

  const retry = async () => {
    setBusy(true);
    try {
      await onRetry();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen dock={<VButton big label={busy ? "Hold on" : "Try again"} onPress={retry} />}>
      <View style={styles.middle}>
        <VText face="pixel" size={(skin.type.caption - 1) - 2} color={P.clash}>
          CONNECTION LOST
        </VText>
        <VText face="display" size={skin.type.display.md}>
          {"Your rivals can't see you"}
        </VText>
        <VText size={skin.type.body} color={P.soft}>
          {"We couldn't reach the server. Pull down or try again in a moment."}
        </VText>
      </View>
    </Screen>
  );
};

export const VersusEmpty = ({
  kicker,
  title,
  line,
  action,
}: {
  kicker: string;
  title: string;
  line: string;
  action: { label: string; onPress: () => void };
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <Screen dock={<VButton big label={action.label} onPress={action.onPress} />}>
      <View style={styles.middle}>
        <Kicker>{kicker}</Kicker>
        <VText face="display" size={skin.type.display.md}>
          {title}
        </VText>
        <VText size={skin.type.body} color={P.soft}>
          {line}
        </VText>
      </View>
    </Screen>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    center: {
      alignItems: "center",
      flex: 1,
      gap: s.spacing.section,
      justifyContent: "center",
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.stack,
    },
    middle: {
      flex: 1,
      gap: s.spacing.inline,
      justifyContent: "center",
    },
  });
