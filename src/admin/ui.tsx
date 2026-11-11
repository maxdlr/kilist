import withPressed from "@/utils/withPressed";
import { Href, router } from "expo-router";
import { ReactNode, useState } from "react";
import {
  ActivityIndicator,
  KeyboardTypeOptions,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { GestureDetector, GestureHandlerRootView, usePanGesture } from "react-native-gesture-handler";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

export const A = {
  ground: "#F4F4F1",
  card: "#FFFFFF",
  line: "#E1E2DD",
  divider: "#EEEFEB",
  field: "#D6D8D1",
  ink: "#1B1D22",
  mid: "#3D414B",
  soft: "#5A5F6B",
  faint: "#9A9EA8",
  chip: "#E7E8E3",
  action: "#2457D6",
  danger: "#B42318",
  dangerTint: "#FBF1EF",
  scrim: "rgba(20,21,24,0.45)",
  level: ["#3E8E4F", "#8DBE8F", "#C9CBC4", "#E3B29A", "#C2563F"],
};

const FONT = { regular: "Inter-Regular", medium: "Inter-Medium", bold: "Inter-SemiBold" };

export const AText = ({
  size = 15,
  weight = "regular",
  color = A.ink,
  style,
  ...rest
}: TextProps & { size?: number; weight?: keyof typeof FONT; color?: string; style?: StyleProp<TextStyle> }) => (
  <Text style={[{ color, fontFamily: FONT[weight], fontSize: size, lineHeight: Math.round(size * 1.35) }, style]} {...rest} />
);

const Chevron = ({ color = A.faint, back = false }: { color?: string; back?: boolean }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
    <Path d={back ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
  </Svg>
);

export const AScreen = ({
  title,
  count,
  subtitle,
  back,
  backLabel = "Admin",
  backTo = "/admin",
  children,
  dock,
  header,
  refreshing = false,
  onRefresh,
  scroll = true,
}: {
  title: string;
  count?: string | number;
  subtitle?: string;
  back?: boolean;
  backLabel?: string;
  backTo?: Href;
  children: ReactNode;
  dock?: ReactNode;
  header?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
}) => {
  const insets = useSafeAreaInsets();
  const top = (
    <View style={styles.head}>
      {back && (
        <Pressable accessibilityRole="button" onPress={() => (router.canGoBack() ? router.back() : router.replace(backTo))} style={withPressed(styles.back)}>
          <Chevron back color={A.mid} />
          <AText color={A.mid}>{backLabel}</AText>
        </Pressable>
      )}
      <View style={styles.titleRow}>
        <AText size={26} weight="bold" accessibilityRole="header" style={styles.flex}>
          {title}
        </AText>
        {count !== undefined && <AText color={A.soft}>{String(count)}</AText>}
      </View>
      {subtitle ? <AText size={14} color={A.soft} style={styles.pad4}>{subtitle}</AText> : null}
      {header}
    </View>
  );

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.root, { paddingTop: insets.top }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
        >
          {top}
          {children}
        </ScrollView>
      ) : (
        <View style={styles.flex}>
          {top}
          <View style={[styles.flex, styles.body]}>{children}</View>
        </View>
      )}
      {dock && <View style={[styles.dock, { paddingBottom: 12 + insets.bottom }]}>{dock}</View>}
    </KeyboardAvoidingView>
  );
};

export const ASection = ({ title, children, note }: { title?: string; children: ReactNode; note?: string }) => (
  <View style={styles.section}>
    {title ? <AText size={12} weight="bold" color={A.soft} style={styles.sectionTitle}>{title.toUpperCase()}</AText> : null}
    <View style={styles.card}>{children}</View>
    {note ? <AText size={13} color={A.soft} style={styles.pad4}>{note}</AText> : null}
  </View>
);

export type RowTone = "plain" | "action" | "danger" | "disabled";

export const ARow = ({
  label,
  value,
  sub,
  href,
  onPress,
  tone = "plain",
  first = false,
  left,
  right,
  accessibilityLabel,
}: {
  label: string;
  value?: string;
  sub?: string;
  href?: Href;
  onPress?: () => void;
  tone?: RowTone;
  first?: boolean;
  left?: ReactNode;
  right?: ReactNode;
  accessibilityLabel?: string;
}) => {
  const press = tone === "disabled" ? undefined : onPress ?? (href ? () => router.push(href) : undefined);
  const color = { plain: A.ink, action: A.action, danger: A.danger, disabled: A.faint }[tone];
  return (
    <Pressable
      accessibilityRole={press ? "button" : undefined}
      accessibilityLabel={accessibilityLabel ?? (value ? `${label}, ${value}` : label)}
      accessibilityState={tone === "disabled" ? { disabled: true } : undefined}
      disabled={!press}
      onPress={press}
      style={({ pressed }) => [styles.row, !first && styles.rowLine, pressed && { backgroundColor: A.ground }]}
    >
      {left}
      <View style={styles.flex}>
        <AText weight={tone === "plain" ? (sub ? "medium" : "regular") : "bold"} color={color} numberOfLines={1}>
          {label}
        </AText>
        {sub ? <AText size={13} color={A.soft} numberOfLines={1}>{sub}</AText> : null}
      </View>
      {value ? <AText size={14} color={A.soft} style={styles.value} numberOfLines={2}>{value}</AText> : null}
      {right}
      {href && tone !== "disabled" && <Chevron />}
    </Pressable>
  );
};

export const ATiles = ({ tiles, onPress }: { tiles: { value: string; label: string }[]; onPress?: () => void }) => (
  <Pressable disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? "button" : undefined} style={withPressed(styles.tiles)}>
    {tiles.map((tile) => (
      <View key={tile.label} style={styles.tile}>
        <AText size={21} weight="bold" numberOfLines={1} adjustsFontSizeToFit>{tile.value}</AText>
        <AText size={12} color={A.soft} numberOfLines={2}>{tile.label}</AText>
      </View>
    ))}
  </Pressable>
);

export const ASearch = ({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) => (
  <View style={styles.search}>
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={A.soft} strokeWidth={2} strokeLinecap="round">
      <Circle cx={11} cy={11} r={6} />
      <Path d="M20 20l-4-4" />
    </Svg>
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={A.faint}
      accessibilityLabel={placeholder}
      autoCapitalize="none"
      autoCorrect={false}
      style={styles.searchInput}
    />
  </View>
);

export const AChips = <T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) => (
  <View style={styles.chips}>
    {options.map((option) => {
      const on = option.value === value;
      return (
        <Pressable
          key={option.value}
          accessibilityRole="button"
          accessibilityState={{ selected: on }}
          onPress={() => onChange(option.value)}
          style={withPressed([styles.chip, on ? styles.chipOn : styles.chipOff])}
        >
          <AText size={13} weight="medium" color={on ? "#FFFFFF" : A.ink}>{option.label}</AText>
        </Pressable>
      );
    })}
  </View>
);

export const AButton = ({
  label,
  onPress,
  variant = "primary",
  busy = false,
  disabled = false,
  flex,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "text";
  busy?: boolean;
  disabled?: boolean;
  flex?: number;
}) => {
  const look = {
    primary: { fill: A.action, ink: "#FFFFFF", line: A.action },
    secondary: { fill: A.card, ink: A.ink, line: "#C9CBC4" },
    danger: { fill: A.danger, ink: "#FFFFFF", line: A.danger },
    text: { fill: "transparent", ink: A.mid, line: "transparent" },
  }[variant];
  const off = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: off, busy }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: look.fill, borderColor: look.line, opacity: off ? 0.5 : pressed ? 0.8 : 1, height: variant === "text" ? 44 : 50 },
        flex !== undefined && { flex },
      ]}
    >
      {busy ? <ActivityIndicator color={look.ink} /> : <AText weight="bold" color={look.ink}>{label}</AText>}
    </Pressable>
  );
};

export const AField = ({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  secure = false,
  autoFocus = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secure?: boolean;
  autoFocus?: boolean;
}) => (
  <View style={styles.field}>
    <AText size={14} color={A.mid}>{label}</AText>
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={A.faint}
      accessibilityLabel={label}
      keyboardType={keyboardType}
      secureTextEntry={secure}
      autoCapitalize="none"
      autoCorrect={false}
      autoFocus={autoFocus}
      style={styles.input}
    />
  </View>
);

export const ASheet = ({
  visible,
  title,
  line,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  line?: string;
  onClose: () => void;
  children: ReactNode;
}) => {
  const insets = useSafeAreaInsets();
  const drag = useSharedValue(0);
  const height = useSharedValue(1);
  const pan = usePanGesture({
    enabled: visible,
    activeOffsetY: [-1000, 12],
    failOffsetX: [-24, 24],
    onUpdate: (event) => {
      drag.set(Math.max(0, event.translationY));
    },
    onDeactivate: (event) => {
      if (event.translationY > Math.min(120, height.value * 0.3) || event.velocityY > 900) {
        scheduleOnRN(onClose);
        return;
      }
      drag.set(withTiming(0, { duration: 180 }));
    },
  });
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: drag.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, drag.value / Math.max(1, height.value)) }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => drag.set(0)}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <GestureHandlerRootView style={styles.flexOnly}>
        <KeyboardAvoidingView behavior="padding" style={styles.sheetRoot}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}>
            <Pressable accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={onClose} />
          </Animated.View>
          <GestureDetector gesture={pan}>
            <Animated.View
              accessibilityViewIsModal
              onLayout={(event) => height.set(event.nativeEvent.layout.height)}
              style={[styles.sheet, { paddingBottom: 16 + insets.bottom }, sheetStyle]}
            >
              <View style={styles.grip} />
              <AText size={20} weight="bold" accessibilityRole="header">{title}</AText>
              {line ? <AText size={14} color={A.soft}>{line}</AText> : null}
              {children}
            </Animated.View>
          </GestureDetector>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
};

export type ConfirmRequest = {
  title: string;
  line: string;
  losses?: string[];
  action: string;
  typeToConfirm?: string;
  tone?: "danger" | "primary";
  onConfirm: () => Promise<unknown>;
  secondary?: { label: string; onConfirm: () => Promise<unknown> };
};

export const AConfirm = ({ request, onClose }: { request: ConfirmRequest | null; onClose: () => void }) => {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const close = () => {
    setTyped("");
    onClose();
  };
  const confirm = async (action?: () => Promise<unknown>) => {
    if (!request) return;
    setBusy(true);
    try {
      await (action ?? request.onConfirm)();
    } finally {
      setBusy(false);
      close();
    }
  };
  const locked = !!request?.typeToConfirm && typed.trim().toUpperCase() !== request.typeToConfirm;
  return (
    <ASheet visible={!!request} title={request?.title ?? ""} line={request?.line} onClose={close}>
      {request?.losses?.length ? (
        <View style={styles.losses}>
          {request.losses.map((loss) => (
            <AText key={loss} size={14} color="#6E1C12">{`• ${loss}`}</AText>
          ))}
        </View>
      ) : null}
      {request?.typeToConfirm ? (
        <AField label={`Type ${request.typeToConfirm} to confirm`} value={typed} onChange={setTyped} />
      ) : null}
      <AButton variant={request?.tone ?? "danger"} label={request?.action ?? ""} busy={busy} disabled={locked} onPress={() => confirm()} />
      {request?.secondary ? (
        <AButton variant="secondary" label={request.secondary.label} disabled={busy} onPress={() => confirm(request.secondary!.onConfirm)} />
      ) : null}
      <AButton variant="text" label="Keep" onPress={close} />
    </ASheet>
  );
};

export const AEmpty = ({ line }: { line: string }) => (
  <View style={styles.empty}>
    <AText color={A.soft}>{line}</AText>
  </View>
);

export const ALoading = () => (
  <View style={[styles.root, styles.center]}>
    <ActivityIndicator color={A.mid} />
  </View>
);

export const when = (value?: string | Date | null) => {
  if (!value) return "Never";
  const date = new Date(value);
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return `Today, ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

export const levelIndex = (score?: number | null) => {
  const value = score ?? 0;
  return [0, 0.25, 0.5, 0.75, 1].reduce((best, threshold, index, all) =>
    Math.abs(threshold - value) < Math.abs(all[best]! - value) ? index : best, 0);
};

const LANGUAGE = { fr: "French", en: "English" } as Record<string, string>;

export const languageLabel = (language: string | null, device: string | null, short = false) => {
  if (language) return short ? language.toUpperCase() : LANGUAGE[language] ?? language;
  const phone = device ? (short ? device.toUpperCase() : LANGUAGE[device] ?? device) : "unknown";
  return short ? `Phone (${phone})` : `Phone setting (${phone})`;
};

export const LEVEL_NAMES = ["Needed", "Should buy", "Can wait", "Still some", "Plenty"];

export const Dot = ({ color, style }: { color: string; style?: StyleProp<ViewStyle> }) => (
  <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.dot, { backgroundColor: color }, style]} />
);

const styles = StyleSheet.create({
  root: { backgroundColor: A.ground, flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  center: { alignItems: "center", justifyContent: "center" },
  pad4: { paddingHorizontal: 4 },
  head: { gap: 10, paddingBottom: 4, paddingHorizontal: 16, paddingTop: 8 },
  back: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 4, minHeight: 44 },
  titleRow: { alignItems: "baseline", flexDirection: "row", gap: 8, paddingHorizontal: 4 },
  scroll: { gap: 16, paddingBottom: 24 },
  body: { paddingHorizontal: 16 },
  dock: { backgroundColor: A.ground, borderTopColor: A.line, borderTopWidth: 1, flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 12 },
  section: { gap: 8, paddingHorizontal: 16 },
  sectionTitle: { letterSpacing: 0.6, paddingHorizontal: 4 },
  card: { backgroundColor: A.card, borderColor: A.line, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  row: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 50, paddingHorizontal: 14, paddingVertical: 8 },
  rowLine: { borderTopColor: A.divider, borderTopWidth: 1 },
  value: { flexShrink: 1, maxWidth: "55%", textAlign: "right" },
  tiles: { flexDirection: "row", gap: 8, paddingHorizontal: 16 },
  tile: { backgroundColor: A.card, borderColor: A.line, borderRadius: 12, borderWidth: 1, flex: 1, gap: 2, padding: 12 },
  search: { alignItems: "center", backgroundColor: A.card, borderColor: A.field, borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: 8, height: 44, paddingHorizontal: 12 },
  searchInput: { color: A.ink, flex: 1, fontFamily: FONT.regular, fontSize: 15 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 16, borderWidth: 1, justifyContent: "center", minHeight: 32, paddingHorizontal: 12 },
  chipOn: { backgroundColor: A.ink, borderColor: A.ink },
  chipOff: { backgroundColor: A.card, borderColor: A.field },
  button: { alignItems: "center", borderRadius: 12, borderWidth: 1, justifyContent: "center", paddingHorizontal: 16 },
  field: { gap: 6 },
  input: { borderColor: A.field, borderRadius: 10, borderWidth: 1, color: A.ink, fontFamily: FONT.regular, fontSize: 15, height: 44, paddingHorizontal: 12 },
  flexOnly: { flex: 1 },
  sheetRoot: { flex: 1, justifyContent: "flex-end" },
  scrim: { backgroundColor: A.scrim },
  sheet: { backgroundColor: A.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 14, maxHeight: "88%", paddingHorizontal: 16, paddingTop: 10 },
  grip: { alignSelf: "center", backgroundColor: A.field, borderRadius: 2, height: 4, width: 40 },
  losses: { backgroundColor: A.dangerTint, borderRadius: 12, gap: 4, padding: 12 },
  empty: { alignItems: "center", padding: 32 },
  dot: { borderRadius: 5, height: 10, width: 10 },
});
