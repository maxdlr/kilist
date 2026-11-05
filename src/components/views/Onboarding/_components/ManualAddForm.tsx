import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import useToast from "@/providers/ToastProvider";
import { useState } from "react";
import { StyleSheet } from "react-native";

/**
 * The second onboarding phase: once bank suggestions run out, let the user add
 * their own items one by one. "Save & add another" keeps the form open;
 * "Finish" ends onboarding.
 */
const ManualAddForm = ({
  onAdd,
  onFinish,
}: {
  onAdd: (data: { name: string; description?: string }) => Promise<boolean>;
  onFinish: () => void;
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [addedCount, setAddedCount] = useState(0);

  const handleSaveAndAdd = async () => {
    if (!name.trim()) {
      showToast("Give the item a name");
      return;
    }
    const success = await onAdd({
      name: name.trim(),
      description: description.trim() || undefined,
    });
    if (success) {
      setAddedCount((c) => c + 1);
      setName("");
      setDescription("");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Add your own</ThemedText>
      <ThemedText type="small">
        Add any items you still need
        {addedCount > 0 ? ` (${addedCount} added)` : ""}.
      </ThemedText>

      <FormInput label="Name" value={name} onChangeText={setName} />
      <FormInput
        label="Description (optional)"
        value={description}
        onChangeText={setDescription}
      />

      <KilButton label="Save & add another" onTouch={handleSaveAndAdd} />
      <KilButton label="Finish" onTouch={onFinish} />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
});

export default ManualAddForm;
