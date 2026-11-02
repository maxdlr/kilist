import KilButton from "@/components/elements/KilButton";
import FormInput from "@/components/elements/FormInput";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useState } from "react";
import { Modal, StyleSheet } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

const FoodFormModal = ({
  visible,
  title,
  initialName = "",
  initialDescription = "",
  onSubmit,
  onClose,
}: {
  visible: boolean;
  title: string;
  initialName?: string;
  initialDescription?: string;
  onSubmit: (data: { name: string; description?: string }) => Promise<boolean>;
  onClose: () => void;
}) => {
  const theme = useTheme();
  // Modal unmounts its children when visible is false, so these naturally
  // reset to the latest initial values each time it reopens.
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const success = await onSubmit({ name: name.trim(), description });
    if (success) onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior="padding"
        automaticOffset
      >
        <ThemedView style={[styles.card, { backgroundColor: theme.background }]}>
          <ThemedText type="smallBold">{title}</ThemedText>

          <FormInput label="Name" value={name} onChangeText={setName} />
          <FormInput
            label="Description"
            value={description}
            onChangeText={setDescription}
          />

          <ThemedView style={styles.actions}>
            <KilButton label="Cancel" onTouch={onClose} />
            <KilButton label="Save" onTouch={handleSubmit} />
          </ThemedView>
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: Spacing.four,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.three,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.two,
  },
});

export default FoodFormModal;
