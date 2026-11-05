import Dock from "@/components/elements/Dock/Dock";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import Sheet from "@/components/elements/Sheet/Sheet";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import { useSkin } from "@/providers/SkinProvider";
import useToast from "@/providers/ToastProvider";
import { useRef, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

const ManualAddForm = ({
  onAdd,
  onFinish,
}: {
  onAdd: (data: { name: string; description?: string }) => Promise<boolean>;
  onFinish: () => void;
}) => {
  const skin = useSkin();
  const copy = skin.copy.onboarding;
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [addedCount, setAddedCount] = useState(0);

  const isSavingRef = useRef(false);

  const saveCurrentItem = async () => {
    if (!name.trim()) {
      showToast(skin.copy.errors.nameMissing);
      return false;
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
    return success;
  };

  const runOnce = async (action: () => Promise<void>) => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      await action();
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleSaveAndAdd = () =>
    runOnce(async () => {
      await saveCurrentItem();
    });

  const handleFinish = () =>
    runOnce(async () => {
      const isFormEmpty = !name.trim() && !description.trim();
      if (isFormEmpty || (await saveCurrentItem())) {
        onFinish();
      }
    });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <Sheet
        fill={skin.colors.paper}
        style={styles.noSpread}
        dock={
          <Dock>
            <ThemedText
              accessibilityLiveRegion="polite"
              size={skin.type.body}
              color={skin.colors.onGround}
              style={styles.saved}
            >
              {addedCount > 0 ? copy.saved(addedCount) : " "}
            </ThemedText>
            <FormInput
              label={copy.name}
              labelColor={skin.colors.onGround}
              value={name}
              onChangeText={setName}
            />
            <FormInput
              label={copy.description}
              labelColor={skin.colors.onGround}
              value={description}
              onChangeText={setDescription}
            />
            <KilButton label={copy.saveAnother} onTouch={handleSaveAndAdd} />
            <KilButton
              variant="secondary"
              label={copy.finish}
              onTouch={handleFinish}
            />
          </Dock>
        }
      >
        <ScrollView contentContainerStyle={styles.form}>
          <Title size={skin.type.display.md} lines={2}>
            {copy.manualTitle}
          </Title>
        </ScrollView>
      </Sheet>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  noSpread: {
    justifyContent: "flex-start",
  },
  form: {
    flexGrow: 1,
    justifyContent: "center",
  },
  saved: {
    textAlign: "center",
  },
});

export default ManualAddForm;
