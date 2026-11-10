import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import useLooks, { Look } from "@/hooks/screens/useLooks";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { LevelNumber, Skin } from "@/skins/types";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

const LEVELS: LevelNumber[] = [1, 2, 3, 4, 5];
const PEEK = 56;

export const LockIcon = ({ color, size = 16 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={5} y={10.5} width={14} height={10} rx={2} stroke={color} strokeWidth={2} />
    <Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const Preview = ({ look }: { look: Look }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const target = look.skin;
  const locked = look.state === "locked";

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.preview, { backgroundColor: target.colors.ground, borderRadius: skin.shape.radius }]}
    >
      <View style={styles.previewTop}>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={{
            color: target.colors.onGround,
            flexShrink: 1,
            fontFamily: target.fonts.display.family,
            fontSize: skin.type.title + 2,
            lineHeight: Math.round((skin.type.title + 2) * target.fonts.display.lineHeight),
          }}
        >
          {target.textCase === "upper" ? target.name.toUpperCase() : target.name}
        </Text>
        {locked && (
          <View style={[styles.lockBadge, { backgroundColor: target.colors.onGround }]}>
            <LockIcon color={target.colors.ground} size={14} />
          </View>
        )}
      </View>
      <View style={styles.previewBottom}>
        <View style={styles.levels}>
          {LEVELS.map((level) => (
            <View key={level} style={[styles.level, { backgroundColor: target.colors.levels[level] }]} />
          ))}
        </View>
        <View
          style={[
            styles.pill,
            {
              backgroundColor: target.actions.primary.fill,
              borderColor: target.actions.primary.line,
              borderRadius: target.shape.radius,
            },
          ]}
        />
      </View>
    </View>
  );
};

const LookCard = ({ look, width, looks }: { look: Look; width: number; looks: ReturnType<typeof useLooks> }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.prizes;
  const busy = looks.busy === look.prize.id;
  const button = { height: skin.size.button.sm, fontSize: skin.type.label };

  const status = {
    current: copy.wearing,
    owned: look.prize.price === 0 ? copy.free : look.skin.tagline,
    unlockable: `${look.prize.price} · ${copy.premium}`,
    locked: `${look.prize.price} · ${copy.premium}`,
    account: `${look.prize.price} · ${copy.premium}`,
  }[look.state];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: skin.colors.paper,
          borderColor: look.state === "current" ? skin.colors.onPaper : skin.colors.fieldLine ?? skin.colors.muted,
          borderRadius: skin.shape.radius + skin.spacing.tight,
          borderWidth: look.state === "current" ? skin.shape.accentBorder + 1 : skin.shape.border,
          width,
        },
      ]}
    >
      <Preview look={look} />
      <View style={styles.cardText}>
        <ThemedText size={skin.type.lead} color={skin.colors.onPaper} numberOfLines={1}>
          {look.skin.name}
        </ThemedText>
        <ThemedText size={skin.type.caption} color={skin.colors.onPaper} numberOfLines={2}>
          {look.state === "current" || look.state === "owned" ? status : `${look.skin.tagline} · ${status}`}
        </ThemedText>
      </View>
      <View style={styles.cardActions}>
        {look.state === "current" && (
          <KilButton {...button} variant="attached" label={copy.wearing} onTouch={() => undefined} />
        )}
        {look.state === "owned" && (
          <KilButton {...button} label={busy ? "…" : copy.wear} onTouch={() => looks.wear(look)} />
        )}
        {look.wearableAnyway && (
          <KilButton
            {...button}
            variant="attached"
            label={busy ? "…" : copy.wear}
            accessibilityLabel={`${copy.wear} ${look.skin.name} without unlocking it`}
            onTouch={() => looks.wear(look)}
          />
        )}
        {look.state === "unlockable" && (
          <KilButton {...button} label={busy ? "…" : copy.redeem(look.prize.price)} onTouch={() => looks.unlock(look)} />
        )}
        {look.state === "account" && (
          <KilButton
            {...button}
            variant="attached"
            label={copy.needsAccount}
            icon={(color) => <LockIcon color={color} />}
            onTouch={() => looks.unlock(look)}
          />
        )}
        {look.state === "locked" && (
          <>
            <KilButton
              {...button}
              variant="attached"
              label={copy.locked(look.missing)}
              accessibilityLabel={`${look.skin.name} is locked. ${copy.locked(look.missing)}. ${copy.earnHint}`}
              icon={(color) => <LockIcon color={color} />}
              onTouch={looks.earnMore}
            />
            <KilButton {...button} label={copy.buy(looks.price)} onTouch={looks.buy} />
          </>
        )}
      </View>
    </View>
  );
};

const LooksShowcase = ({
  titleColor,
  lineColor,
  inset,
}: {
  titleColor?: string;
  lineColor?: string;
  inset?: number;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const looks = useLooks();
  const { width: windowWidth } = useWindowDimensions();
  const copy = skin.copy.prizes;
  const edge = inset ?? skin.spacing.gutter;
  const cardWidth = Math.min(windowWidth - edge * 2 - PEEK, 320);

  return (
    <View style={[styles.section, { marginHorizontal: -edge }]}>
      <View style={[styles.head, { paddingHorizontal: edge }]}>
        <Title size={skin.type.title} lines={2} color={titleColor ?? skin.colors.onGround}>
          {copy.sectionTitle}
        </Title>
        <ThemedText size={skin.type.label} color={lineColor ?? titleColor ?? skin.colors.onGround}>
          {copy.sectionLine(looks.balance)}
        </ThemedText>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + skin.spacing.inline}
        decelerationRate="fast"
        contentContainerStyle={[styles.track, { paddingHorizontal: edge }]}
      >
        {looks.looks.map((look) => (
          <LookCard key={look.prize.id} look={look} width={cardWidth} looks={looks} />
        ))}
      </ScrollView>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    section: { gap: s.spacing.inline },
    head: { gap: s.spacing.tight },
    track: { gap: s.spacing.inline },
    card: { gap: s.spacing.inline, padding: s.spacing.inline },
    preview: { height: s.size.icon.card + s.spacing.small, justifyContent: "space-between", padding: s.spacing.inline },
    previewTop: { alignItems: "flex-start", flexDirection: "row", gap: s.spacing.small, justifyContent: "space-between" },
    lockBadge: {
      alignItems: "center",
      borderRadius: s.size.check,
      height: s.size.check + s.spacing.tight,
      justifyContent: "center",
      width: s.size.check + s.spacing.tight,
    },
    previewBottom: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between" },
    levels: { flexDirection: "row", gap: s.spacing.tight },
    level: { borderRadius: s.spacing.small, height: s.spacing.stack, width: s.spacing.stack },
    pill: { borderWidth: 1, height: s.spacing.section, width: s.size.button.lg + s.spacing.section },
    cardText: { gap: s.spacing.hair, minHeight: s.type.lead * 1.3 + s.type.caption * 2.8 },
    cardActions: { gap: s.spacing.small, marginTop: "auto" },
  });

export default LooksShowcase;
