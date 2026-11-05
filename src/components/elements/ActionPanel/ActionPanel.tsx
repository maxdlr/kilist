import type { Skin } from "@/skins/types";
import BottomPanel from "@/components/elements/BottomPanel";
import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
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
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const [shown, setShown] = useState(request);

  if (request && request !== shown) {
    setShown(request);
  }

  const isDestructive = shown?.actions.some((action) => action.destructive);

  return (
    <BottomPanel visible={request !== null} onClose={onClose} dismissible>
      {shown?.title && (
        <Title
          size={skin.type.display.sm}
          lines={2}
          color={isDestructive ? skin.colors.danger : skin.colors.accent}
        >
          {shown.title}
        </Title>
      )}
      {shown?.message && (
        <ThemedText color={skin.colors.onGround}>{shown.message}</ThemedText>
      )}
      <View style={styles.actions}>
        <KilButton
          flex={1}
          height={skin.size.button.md}
          fontSize={skin.type.lead}
          variant="secondary"
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
    </BottomPanel>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    actions: {
      flexDirection: "row",
      gap: s.spacing.inline,
    },
  });

export default ActionPanel;
