import type { Skin } from "@/skins/types";
import BottomPanel from "@/components/elements/BottomPanel";
import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import { usePanelSkin, useSkinStyles } from "@/providers/SkinProvider";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

export type ActionPanelRequest = {
  title?: string;
  message?: string;
  cancelLabel?: string;
  actions: { label: string; onPress: () => void; destructive?: boolean }[];
};

const ActionPanel = ({
  request,
  onClose,
}: {
  request: ActionPanelRequest | null;
  onClose: () => void;
}) => {
  const skin = usePanelSkin();
  const styles = useSkinStyles(createStyles);
  const [shown, setShown] = useState(request);

  if (request && request !== shown) {
    setShown(request);
  }

  const isDestructive = shown?.actions.some((action) => action.destructive);
  const stacked = (shown?.actions.length ?? 0) > 1;

  return (
    <BottomPanel visible={request !== null} onClose={onClose} dismissible>
      {shown?.title && (
        <Title
          size={skin.type.display.sm}
          lines={2}
          color={
            isDestructive && skin.panel.radius === 0
              ? skin.colors.danger
              : skin.panel.title
          }
        >
          {shown.title}
        </Title>
      )}
      {shown?.message && (
        <ThemedText color={skin.panel.ink}>{shown.message}</ThemedText>
      )}
      {stacked && (
        <View style={styles.stack}>
          {[...(shown?.actions ?? [])].reverse().map((action, index) => (
            <KilButton
              key={action.label}
              height={skin.size.button.md}
              fontSize={skin.type.lead}
              variant={
                action.destructive
                  ? "danger"
                  : index === 0
                    ? "primary"
                    : skin.panel.secondary
              }
              label={action.label}
              onTouch={() => {
                onClose();
                action.onPress();
              }}
            />
          ))}
          <KilButton
            height={skin.size.button.sm}
            fontSize={skin.type.label}
            variant={skin.panel.secondary}
            label={shown?.cancelLabel ?? skin.copy.common.cancel}
            onTouch={onClose}
          />
        </View>
      )}
      {!stacked && (
        <View style={styles.actions}>
          <KilButton
            flex={1}
            height={skin.size.button.md}
            fontSize={skin.type.lead}
            variant={skin.panel.secondary}
            label={shown?.cancelLabel ?? skin.copy.common.cancel}
            onTouch={onClose}
          />
          {shown?.actions.map((action) => (
            <KilButton
              key={action.label}
              flex={1}
              height={skin.size.button.md}
              fontSize={skin.type.lead}
              variant={action.destructive ? "danger" : "primary"}
              label={action.label}
              onTouch={() => {
                onClose();
                action.onPress();
              }}
            />
          ))}
        </View>
      )}
    </BottomPanel>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    actions: {
      flexDirection: "row",
      gap: s.spacing.inline,
    },
    stack: {
      gap: s.spacing.small,
    },
  });

export default ActionPanel;
