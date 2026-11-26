import BottomPanel, { PanelScrollView } from "@/components/elements/BottomPanel";
import { FeedbackCard, FieldMessage } from "@/components/elements/Feedback";
import { BellOffIcon } from "@/components/icons";
import KilSwitch from "@/components/elements/KilSwitch";
import Title from "@/components/elements/Title";
import { ThemedText } from "@/components/elements/ThemedText";
import useNotificationSettings from "@/hooks/screens/useNotificationSettings";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

const SWITCH_COLUMN = 64;

const Section = ({
  title,
  email = true,
  push = true,
  children,
}: {
  title: string;
  email?: boolean;
  push?: boolean;
  children: ReactNode;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const T = common.notifications;
  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <ThemedText
          size={skin.type.label}
          color={skin.panel.title}
          style={styles.label}
        >
          {title}
        </ThemedText>
        <ThemedText
          size={skin.type.caption}
          color={skin.panel.ink}
          style={[styles.column, styles.dim]}
        >
          {email ? T.email : ""}
        </ThemedText>
        <ThemedText
          size={skin.type.caption}
          color={skin.panel.ink}
          style={[styles.column, styles.dim]}
        >
          {push ? T.push : ""}
        </ThemedText>
      </View>
      {children}
    </View>
  );
};

const Row = ({ label, error, children }: { label: string; error?: string | null; children: ReactNode }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <View style={[styles.line, { borderTopColor: skin.panel.line }]}>
      <View style={styles.row}>
        <ThemedText
          size={skin.type.body}
          color={skin.panel.ink}
          style={styles.label}
        >
          {label}
        </ThemedText>
        {children}
      </View>
      <FieldMessage message={error} />
    </View>
  );
};

const Slot = ({ children }: { children?: ReactNode }) => {
  const styles = useSkinStyles(createStyles);
  return <View style={styles.column}>{children}</View>;
};

const NotificationsModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const T = common.notifications;
  const settings = useNotificationSettings();

  return (
    <BottomPanel visible={visible} onClose={onClose} dismissible tall>
      <Title size={skin.type.headline} lines={1} color={skin.panel.title}>
        {T.menu}
      </Title>
      <ThemedText color={skin.panel.ink}>
        {settings.isGuest ? T.guest : T.line}
      </ThemedText>
      <FeedbackCard
        collapse={skin.spacing.stack}
        feedback={
          settings.pushBlocked
            ? {
                tone: "note",
                icon: BellOffIcon,
                title: common.feedback.pushOff,
                body: settings.isGuest ? undefined : common.feedback.pushOffLine,
                action: { label: common.feedback.openSettings, onPress: settings.openPhoneSettings },
              }
            : null
        }
      />
      <PanelScrollView
        style={styles.list}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Section title={T.yourChoice} email={!settings.isGuest}>
          {settings.rows.map((row) => {
            const label = T.events[row.event.id] ?? row.event.id;
            return (
              <Row key={row.event.id} label={label} error={settings.rowError(row.event.id)}>
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
        </Section>
        {settings.required.length > 0 && (
          <Section title={T.alwaysTitle} push={false}>
            {settings.required.map((id) => {
              const label = T.required[id] ?? id;
              return (
                <Row key={id} label={label}>
                  <Slot>
                    <KilSwitch
                      value
                      disabled
                      label={`${label}, ${T.email}`}
                      onChange={() => undefined}
                    />
                  </Slot>
                  <Slot />
                </Row>
              );
            })}
          </Section>
        )}
      </PanelScrollView>
    </BottomPanel>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    list: { flexGrow: 0, flexShrink: 1 },
    scroll: { gap: s.spacing.section, paddingBottom: s.spacing.stack },
    section: { gap: 0 },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.inline,
      paddingVertical: s.spacing.inline,
    },
    line: { borderTopWidth: s.shape.divider },
    label: { flex: 1, minWidth: 0 },
    column: { alignItems: "center", textAlign: "center", width: SWITCH_COLUMN },
    dim: { opacity: 0.6 },
  });

export default NotificationsModal;
