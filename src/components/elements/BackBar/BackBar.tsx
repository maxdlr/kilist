import { ThemedText } from "@/components/themed-text";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { type Href, router } from "expo-router";
import { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaInsetsContext, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const TOUCH = 44;
const ICON = 22;

const BackBar = ({
  children,
  fallback = "/",
  label = common.back,
  fill,
  ink,
}: {
  children: ReactNode;
  fallback?: Href;
  label?: string;
  fill?: string;
  ink?: string;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  const color = ink ?? skin.colors.onGround;

  return (
    <View style={[styles.root, { backgroundColor: fill ?? skin.colors.ground }]}>
      <View style={[styles.bar, { paddingTop: insets.top }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback))}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 5l-7 7 7 7" />
          </Svg>
          <ThemedText size={skin.type.body} color={color} numberOfLines={1}>
            {label}
          </ThemedText>
        </Pressable>
      </View>
      <SafeAreaInsetsContext.Provider value={{ ...insets, top: 0 }}>
        <View style={styles.body}>{children}</View>
      </SafeAreaInsetsContext.Provider>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    root: { flex: 1 },
    bar: { paddingHorizontal: s.spacing.inline },
    button: {
      alignItems: "center",
      alignSelf: "flex-start",
      flexDirection: "row",
      gap: s.spacing.tight,
      minHeight: TOUCH,
      paddingRight: s.spacing.inline,
    },
    pressed: { opacity: 0.6 },
    body: { flex: 1, minHeight: 0 },
  });

export default BackBar;
