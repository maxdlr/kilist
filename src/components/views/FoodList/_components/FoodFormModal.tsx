import BottomPanel from "@/components/elements/BottomPanel";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

type FoodFormData = { name: string; description?: string };

const FoodForm = ({
  title,
  initialName,
  initialDescription,
  onSubmit,
  onClose,
}: {
  title: string;
  initialName: string;
  initialDescription: string;
  onSubmit: (data: FoodFormData) => Promise<boolean>;
  onClose: () => void;
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const success = await onSubmit({ name: name.trim(), description });
    if (success) onClose();
  };

  return (
    <>
      <ThemedText type="smallBold">{title}</ThemedText>

      <FormInput label="Name" value={name} onChangeText={setName} />
      <FormInput
        label="Description"
        value={description}
        onChangeText={setDescription}
      />

      <View style={styles.actions}>
        <KilButton label="Cancel" onTouch={onClose} />
        <KilButton label="Save" onTouch={handleSubmit} />
      </View>
    </>
  );
};

const FoodFormModal = ({
  visible,
  title,
  formKey,
  initialName = "",
  initialDescription = "",
  onSubmit,
  onClose,
}: {
  visible: boolean;
  title: string;
  formKey?: string | number;
  initialName?: string;
  initialDescription?: string;
  onSubmit: (data: FoodFormData) => Promise<boolean>;
  onClose: () => void;
}) => (
  <BottomPanel visible={visible} onClose={onClose}>
    <FoodForm
      key={formKey}
      title={title}
      initialName={initialName}
      initialDescription={initialDescription}
      onSubmit={onSubmit}
      onClose={onClose}
    />
  </BottomPanel>
);

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.two,
  },
});

export default FoodFormModal;
