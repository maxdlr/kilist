import ActionRow from "@/components/elements/ActionRow";
import BottomPanel from "@/components/elements/BottomPanel";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

export type ActionPanelRequest = {
  title?: string;
  message?: string;
  actions: { label: string; onPress: () => void; destructive?: boolean }[];
};

const ActionPanel = ({
  request,
  onClose,
}: {
  request: ActionPanelRequest | null;
  onClose: () => void;
}) => {
  const [shown, setShown] = useState(request);

  if (request && request !== shown) {
    setShown(request);
  }

  return (
    <BottomPanel visible={request !== null} onClose={onClose} dismissible>
      {shown?.title && <ThemedText type="subtitle">{shown.title}</ThemedText>}
      {shown?.message && (
        <ThemedText type="small" themeColor="textSecondary">
          {shown.message}
        </ThemedText>
      )}
      <View style={styles.actions}>
        {shown?.actions.map((action) => (
          <ActionRow
            key={action.label}
            label={action.label}
            destructive={action.destructive}
            onPress={() => {
              onClose();
              action.onPress();
            }}
          />
        ))}
        <ActionRow label="Cancel" onPress={onClose} />
      </View>
    </BottomPanel>
  );
};

const styles = StyleSheet.create({
  actions: {
    marginTop: Spacing.one,
  },
});

export default ActionPanel;
