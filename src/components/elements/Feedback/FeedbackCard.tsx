import KilButton from "@/components/elements/KilButton";
import { ThemedText } from "@/components/elements/ThemedText";
import { CheckCircleIcon, InfoCircleIcon, WarningCircleIcon, type Icon } from "@/components/icons";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { caseFor } from "@/skins";
import type { FeedbackTone, Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";
import Presence from "./Presence";

export type FeedbackAction = { label: string; onPress: () => void };

export type Feedback = {
  tone: FeedbackTone;
  title: string;
  body?: string;
  action?: FeedbackAction;
  icon?: Icon;
};

const ICONS: Record<FeedbackTone, Icon> = {
  error: WarningCircleIcon,
  note: InfoCircleIcon,
  success: CheckCircleIcon,
};

export const FeedbackCardBody = ({ tone, title, body, action, icon }: Feedback) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const look = skin.feedback.card;
  const ink = look[tone];
  const Glyph = icon ?? ICONS[tone];
  const bold = skin.fonts.body?.bold ?? skin.fonts.display.family;

  return (
    <View
      accessibilityRole={tone === "error" ? "alert" : undefined}
      accessibilityLiveRegion="polite"
      style={[
        styles.card,
        { backgroundColor: ink.fill, borderColor: ink.line, borderRadius: look.radius, borderWidth: look.border },
      ]}
    >
      <Glyph size={skin.size.icon.action} color={ink.icon} strokeWidth={1.8} />
      <View style={styles.text}>
        <ThemedText size={skin.type.body} color={ink.ink} style={{ fontFamily: bold }}>
          {caseFor(skin, title)}
        </ThemedText>
        {body ? (
          <ThemedText size={skin.type.label} color={ink.soft}>
            {body}
          </ThemedText>
        ) : null}
        {action && (
          <View style={styles.action}>
            <KilButton small variant="secondary" label={action.label} onTouch={action.onPress} style={styles.actionButton} />
          </View>
        )}
      </View>
    </View>
  );
};

const FeedbackCard = ({
  feedback,
  collapse,
}: {
  feedback: Feedback | null | undefined;
  collapse?: number;
}) => (
  <Presence visible={Boolean(feedback)} collapse={collapse}>
    {feedback && <FeedbackCardBody {...feedback} />}
  </Presence>
);

const createStyles = (s: Skin) =>
  StyleSheet.create({
    card: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: s.spacing.inline,
      paddingHorizontal: s.spacing.stack,
      paddingVertical: s.spacing.inline + 2,
    },
    text: { flex: 1, gap: s.spacing.hair, minWidth: 0 },
    action: { alignItems: "flex-start", paddingTop: s.spacing.small },
    actionButton: { alignSelf: "flex-start" },
  });

export default FeedbackCard;
