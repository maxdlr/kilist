import { ActionNote, FeedbackCard } from "@/components/elements/Feedback";
import KilButton from "@/components/elements/KilButton";
import { CheckIcon, EyeIcon } from "@/components/icons";
import Title from "@/components/elements/Title";
import { ThemedText } from "@/components/elements/ThemedText";
import useLooks, { Look, Looks } from "@/hooks/screens/useLooks";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { useSceneInset } from "@/providers/TabBarProvider";
import type { LevelNumber, Skin } from "@/skins/types";
import { useFocusEffect } from "expo-router";
import { type ComponentRef, useCallback, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

const LEVELS: LevelNumber[] = [1, 2, 3, 4, 5];

export const LockIcon = ({ color, size = 16 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={5} y={10.5} width={14} height={10} rx={2} stroke={color} strokeWidth={2} />
    <Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const Swatch = ({ look }: { look: Look }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const target = look.skin;
  const locked = look.state === "locked" || look.state === "account";

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.swatch, { backgroundColor: target.colors.ground, borderRadius: skin.shape.radius }]}
    >
      <View style={styles.swatchTop}>
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
      <View style={styles.swatchBottom}>
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

export const CompactLookActions = ({
  look,
  looks,
  withPreview = false,
  large = false,
}: {
  look: Look;
  looks: Looks;
  withPreview?: boolean;
  large?: boolean;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.prizes;
  const busy = looks.busy === look.prize.id;
  const check = (color: string) => <CheckIcon size={skin.size.icon.action - 4} color={color} strokeWidth={2} />;
  const lock = (color: string) => <LockIcon color={color} />;
  const size = large ? { height: skin.size.button.md, fontSize: skin.type.label } : { small: true };

  return (
    <View style={[styles.compact, large && styles.large]}>
      {withPreview && (
        <KilButton
          {...size}
          variant="attached"
          accessibilityLabel={common.looks.previewAria(look.skin.name)}
          icon={(color) => <EyeIcon size={skin.size.icon.action - 4} color={color} strokeWidth={2} />}
          onTouch={() => looks.preview(look)}
        />
      )}
      {(look.state === "locked" || look.state === "unlockable") && (
        <KilButton {...size} flex={large ? 1 : undefined} label={copy.buy(looks.price)} onTouch={() => looks.buy(look)} />
      )}
      {look.state === "current" && (
        <KilButton {...size} accessibilityLabel={copy.wearing} icon={check} onTouch={() => undefined} />
      )}
      {look.state === "owned" && (
        <KilButton {...size} disabled={busy} accessibilityLabel={copy.wear} icon={check} onTouch={() => looks.wear(look)} />
      )}
      {look.wearableAnyway && (
        <KilButton
          {...size}
          variant="attached"
          disabled={busy}
          accessibilityLabel={`${copy.wear} ${look.skin.name} without unlocking it`}
          icon={check}
          onTouch={() => looks.wear(look)}
        />
      )}
      {look.state === "unlockable" && (
        <KilButton {...size} flex={large ? 1 : undefined} disabled={busy} label={copy.redeem(look.prize.price)} onTouch={() => looks.unlock(look)} />
      )}
      {look.state === "account" && (
        <KilButton
          {...size}
          variant="attached"
          accessibilityLabel={copy.needsAccount}
          icon={lock}
          onTouch={() => looks.unlock(look)}
        />
      )}
      {look.state === "locked" && (
        <KilButton
          {...size}
          variant="attached"
          accessibilityLabel={`${look.skin.name} is locked. ${copy.locked(look.missing)}. ${copy.earnHint}`}
          icon={lock}
          onTouch={() => looks.earnMore(look)}
        />
      )}
    </View>
  );
};

const LookCard = ({ look, looks, onPlaced }: { look: Look; looks: Looks; onPlaced: (y: number) => void }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.prizes;
  const owned = look.state === "current" || look.state === "owned";
  const line = skin.colors.fieldLine ?? skin.colors.muted;

  return (
    <View
      onLayout={(event) => onPlaced(event.nativeEvent.layout.y)}
      style={[
        styles.card,
        {
          backgroundColor: skin.colors.paper,
          borderColor: look.state === "current" ? skin.colors.onPaper : line,
          borderRadius: skin.shape.radius + skin.spacing.tight,
          borderWidth: look.state === "current" ? skin.shape.accentBorder + 1 : skin.shape.border,
        },
      ]}
    >
      <Swatch look={look} />
      <View style={styles.cardText}>
        <View style={styles.nameRow}>
          <View style={styles.name}>
            <ThemedText size={skin.type.lead} color={skin.colors.onPaper} numberOfLines={1}>
              {look.skin.name}
            </ThemedText>
            <ThemedText size={skin.type.caption} color={skin.colors.onPaper}>
              {look.state === "current" ? copy.wearing : look.prize.price === 0 ? copy.free : copy.premium}
            </ThemedText>
          </View>
        </View>
        <ThemedText size={skin.type.caption} color={skin.colors.onPaper} numberOfLines={2}>
          {look.skin.tagline}
        </ThemedText>
      </View>
      {!owned && look.state !== "account" && (
        <View style={styles.progress}>
          <View style={[styles.track, { backgroundColor: line }]}>
            <View
              style={[styles.fill, { backgroundColor: skin.colors.onPaper, width: `${Math.round(look.progress * 100)}%` }]}
            />
          </View>
          <ThemedText size={skin.type.caption} color={skin.colors.onPaper}>
            {copy.progress(look.funds, look.prize.price)}
          </ThemedText>
        </View>
      )}
      <FeedbackCard feedback={looks.problemOf(look)} collapse={skin.spacing.inline} />
      <ActionNote reason={looks.hintOf(look)} collapse={skin.spacing.inline} />
      <CompactLookActions look={look} looks={looks} withPreview large />
    </View>
  );
};

const LooksShowcase = ({ focus, titleColor, lineColor }: { focus?: string; titleColor?: string; lineColor?: string }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const looks = useLooks();
  const copy = skin.copy.prizes;
  const sceneInset = useSceneInset();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const offsets = useRef<Record<string, number>>({});
  const waiting = useRef(false);

  const jump = useCallback(() => {
    const y = focus ? offsets.current[focus] : 0;
    if (y === undefined) return;
    waiting.current = false;
    scroll.current?.scrollTo({ y: Math.max(0, y - skin.spacing.inline), animated: false });
  }, [focus, skin.spacing.inline]);

  useFocusEffect(
    useCallback(() => {
      waiting.current = true;
      jump();
    }, [jump]),
  );

  const place = (id: string, y: number) => {
    offsets.current[id] = y;
    if (waiting.current && id === focus) jump();
  };

  return (
    <ScrollView
      ref={scroll}
      style={{ backgroundColor: skin.colors.ground }}
      contentContainerStyle={[styles.content, { paddingBottom: skin.spacing.section + sceneInset }]}
    >
      <View style={styles.head}>
        <Title size={skin.type.title} lines={2} color={titleColor ?? skin.colors.onGround}>
          {copy.sectionTitle}
        </Title>
        <ThemedText size={skin.type.label} color={lineColor ?? titleColor ?? skin.colors.onGround}>
          {copy.sectionLine(looks.balance)}
        </ThemedText>
      </View>
      {looks.looks.map((look) => (
        <LookCard key={look.prize.id} look={look} looks={looks} onPlaced={(y) => place(look.skin.id, y)} />
      ))}
    </ScrollView>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    content: {
      gap: s.spacing.stack,
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.gutter,
      paddingTop: s.spacing.stack,
    },
    head: { gap: s.spacing.tight },
    card: { gap: s.spacing.inline, padding: s.spacing.inline },
    swatch: { height: s.size.icon.card + s.spacing.section, justifyContent: "space-between", padding: s.spacing.inline },
    swatchTop: { alignItems: "flex-start", flexDirection: "row", gap: s.spacing.small, justifyContent: "space-between" },
    lockBadge: {
      alignItems: "center",
      borderRadius: s.size.check,
      height: s.size.check + s.spacing.tight,
      justifyContent: "center",
      width: s.size.check + s.spacing.tight,
    },
    swatchBottom: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between" },
    levels: { flexDirection: "row", gap: s.spacing.tight },
    level: { borderRadius: s.spacing.small, height: s.spacing.stack, width: s.spacing.stack },
    pill: { borderWidth: 1, height: s.spacing.section, width: s.size.button.lg + s.spacing.section },
    cardText: { gap: s.spacing.hair },
    nameRow: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline, justifyContent: "space-between" },
    name: { flex: 1, minWidth: 0 },
    progress: { gap: s.spacing.tight },
    track: { borderRadius: 2, height: 4, overflow: "hidden" },
    fill: { borderRadius: 2, height: 4 },
    compact: { alignItems: "center", flexDirection: "row", gap: s.spacing.tight },
    large: { gap: s.spacing.small, justifyContent: "center" },
  });

export default LooksShowcase;
