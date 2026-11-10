import Dock from "@/components/elements/Dock/Dock";
import KilButton from "@/components/elements/KilButton";
import KilSwitch from "@/components/elements/KilSwitch";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import useNotificationSettings from "@/hooks/screens/useNotificationSettings";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { router } from "expo-router";
import { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SWITCH_COLUMN = 64;

const Columns = ({ email = true, push = true }: { email?: boolean; push?: boolean }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <View style={[styles.row, styles.head]}>
      <View style={styles.label} />
      {[email ? common.notifications.email : "", push ? common.notifications.push : ""].map((name, index) => (
        <ThemedText key={index} size={skin.type.caption} color={skin.colors.onPaper} style={styles.column}>
          {name}
        </ThemedText>
      ))}
    </View>
  );
};

const Row = ({ label, first, children }: { label: string; first: boolean; children: ReactNode }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <View style={[styles.row, !first && { borderTopColor: skin.colors.fieldLine ?? skin.colors.muted, borderTopWidth: skin.shape.divider }]}>
      <ThemedText size={skin.type.body} color={skin.colors.onPaper} style={styles.label}>
        {label}
      </ThemedText>
      {children}
    </View>
  );
};

const Slot = ({ children }: { children?: ReactNode }) => {
  const styles = useSkinStyles(createStyles);
  return <View style={styles.column}>{children}</View>;
};

const NotificationsScreen = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  const T = common.notifications;
  const settings = useNotificationSettings();
  useStatusBarStyle(skin.statusBarOnGround);

  return (
    <View style={[styles.flex, { backgroundColor: skin.colors.ground }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + skin.spacing.top }]}>
        <Title size={skin.type.display.sm} lines={2} color={skin.colors.accent}>
          {T.menu}
        </Title>
        <ThemedText color={skin.colors.onGround}>{settings.isGuest ? T.guest : T.line}</ThemedText>

        <ThemedText size={skin.type.label} color={skin.colors.onGround}>
          {T.yourChoice}
        </ThemedText>
        <View style={[styles.card, { backgroundColor: skin.colors.paper, borderRadius: skin.shape.radius }]}>
          <Columns email={!settings.isGuest} />
          {settings.rows.map((row, index) => {
            const label = T.events[row.event.id] ?? row.event.id;
            return (
              <Row key={row.event.id} label={label} first={index === 0}>
                <Slot>
                  {row.canEmail && (
                    <KilSwitch
                      value={row.email}
                      label={`${label}, ${T.email}`}
                      onChange={(on) => settings.set(row, "email", on)}
                    />
                  )}
                </Slot>
                <Slot>
                  {row.canPush && (
                    <KilSwitch
                      value={row.push}
                      label={`${label}, ${T.push}`}
                      onChange={(on) => settings.set(row, "push", on)}
                    />
                  )}
                </Slot>
              </Row>
            );
          })}
        </View>

        {settings.required.length > 0 && (
          <>
            <ThemedText size={skin.type.label} color={skin.colors.onGround}>
              {T.alwaysTitle}
            </ThemedText>
            <View style={[styles.card, { backgroundColor: skin.colors.paper, borderRadius: skin.shape.radius }]}>
              <Columns push={false} />
              {settings.required.map((id, index) => {
                const label = T.required[id] ?? id;
                return (
                  <Row key={id} label={label} first={index === 0}>
                    <Slot>
                      <KilSwitch value disabled label={`${label}, ${T.email}`} onChange={() => undefined} />
                    </Slot>
                    <Slot />
                  </Row>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
      <Dock>
        <KilButton
          height={skin.size.button.md}
          fontSize={skin.type.lead}
          variant="secondary"
          label={T.back}
          onTouch={() => (router.canGoBack() ? router.back() : router.replace("/account"))}
        />
      </Dock>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: {
      gap: s.spacing.stack,
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.gutter,
    },
    card: {
      borderColor: s.colors.onPaper,
      borderWidth: s.shape.border,
      paddingHorizontal: s.spacing.gutter,
    },
    head: {
      paddingBottom: 0,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.inline,
      paddingVertical: s.spacing.stack,
    },
    label: { flex: 1, minWidth: 0 },
    column: { alignItems: "center", textAlign: "center", width: SWITCH_COLUMN },
  });

export default NotificationsScreen;
