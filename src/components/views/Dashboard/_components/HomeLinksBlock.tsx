import withPressed from "@/utils/withPressed";
import { ThemedText } from "@/components/themed-text";
import useHomeLinks from "@/hooks/screens/useHomeLinks";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { caseFor } from "@/skins";
import type { Skin } from "@/skins/types";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

const HomeLinksBlock = ({
  ink,
  muted,
  fill,
  style,
}: {
  ink?: string;
  muted?: string;
  fill?: string;
  style?: StyleProp<ViewStyle>;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const links = useHomeLinks();
  const T = common.home;
  const text = ink ?? skin.colors.onGround;
  const soft = muted ?? skin.colors.muted;

  return (
    <View style={[styles.block, style]}>
      {links.prizes.length === 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.prizesAria}
          onPress={links.openPrizes}
          style={({ pressed }) => [
            styles.prize,
            { backgroundColor: fill ?? skin.colors.raised, opacity: pressed ? skin.shape.pressedOpacity : 1 },
          ]}
        >
          <ThemedText size={skin.type.label} color={text}>
            {links.balanceLabel}
          </ThemedText>
        </Pressable>
      ) : (
        <View style={[styles.looks, { backgroundColor: fill ?? skin.colors.raised, borderColor: soft }]}>
          <View style={styles.looksHead}>
            <ThemedText size={skin.type.label} color={text} accessibilityRole="header">
              {caseFor(skin, links.prizesTitle)}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={T.prizesAria}
              hitSlop={8}
              onPress={links.openPrizes}
              style={({ pressed }) => [
                styles.discover,
                { borderColor: text, opacity: pressed ? skin.shape.pressedOpacity : 1 },
              ]}
            >
              <ThemedText size={skin.type.caption} color={text}>
                {caseFor(skin, links.discoverLabel)}
              </ThemedText>
            </Pressable>
          </View>
          {links.prizes.map((prize) => (
            <Pressable
              key={prize.id}
              accessibilityRole="button"
              accessibilityLabel={`${prize.name}. ${prize.away}. ${prize.line}`}
              onPress={prize.open}
              style={({ pressed }) => [styles.prizeRow, { opacity: pressed ? skin.shape.pressedOpacity : 1 }]}
            >
              <View style={styles.prizeText}>
                <ThemedText size={skin.type.label} color={text} numberOfLines={1} style={styles.prizeName}>
                  {caseFor(skin, prize.name)}
                </ThemedText>
                <ThemedText size={skin.type.label} color={soft} numberOfLines={1} style={styles.detail}>
                  {caseFor(skin, prize.away)}
                </ThemedText>
              </View>
              <View style={[styles.track, { backgroundColor: soft }]}>
                <View style={[styles.fill, { backgroundColor: text, width: `${Math.round(prize.progress * 100)}%` }]} />
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {links.notice && (
        <Pressable accessibilityRole="button" onPress={links.notice.open} style={withPressed(styles.notice)}>
          <ThemedText size={skin.type.label} color={text} style={styles.noticeText}>
            {caseFor(skin, links.notice.label)}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    block: { gap: s.spacing.small },
    looks: {
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      gap: s.spacing.inline,
      marginTop: s.spacing.stack,
      padding: s.spacing.stack,
    },
    looksHead: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline, justifyContent: "space-between" },
    discover: {
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      paddingHorizontal: s.spacing.inline,
      paddingVertical: s.spacing.tight,
    },
    prizeRow: { gap: s.spacing.small },
    prizeName: { flexShrink: 1 },
    prize: {
      borderRadius: s.shape.radius,
      gap: s.spacing.small,
      paddingHorizontal: s.spacing.stack,
      paddingVertical: s.spacing.inline,
    },
    prizeText: { flexDirection: "row", gap: s.spacing.inline, justifyContent: "space-between" },
    detail: { flexShrink: 1, textAlign: "right" },
    track: { borderRadius: 2, height: 4, overflow: "hidden" },
    fill: { borderRadius: 2, height: 4 },
    notice: { alignItems: "center", justifyContent: "center", minHeight: s.size.button.xs },
    noticeText: { textAlign: "center", textDecorationLine: "underline" },
  });

export default HomeLinksBlock;
