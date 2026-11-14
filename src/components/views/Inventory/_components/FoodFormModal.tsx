import type { Skin } from "@/skins/types";
import BottomPanel from "@/components/elements/BottomPanel";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import NameSuggestions from "@/components/elements/NameSuggestions";
import ProductScanner from "@/components/elements/ProductScanner";
import Title from "@/components/elements/Title/Title";
import common from "@/i18n/common";
import type { ScannedProduct } from "@/offline/domain";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import useToast from "@/providers/ToastProvider";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

type FoodFormData = { name: string; description?: string; product?: ScannedProduct };

const FoodForm = ({
  title,
  initialName,
  initialDescription,
  onSubmit,
  onRemove,
  onClose,
  scannable,
}: {
  title: string;
  initialName: string;
  initialDescription: string;
  scannable: boolean;
  onSubmit: (data: FoodFormData) => Promise<boolean>;
  onRemove?: () => void;
  onClose: () => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.inventory;
  const { showToast } = useToast();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [scanning, setScanning] = useState(false);
  const [product, setProduct] = useState<ScannedProduct | undefined>();

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast(skin.copy.errors.nameMissing);
      return;
    }
    const success = await onSubmit({ name: name.trim(), description, ...(product && { product }) });
    if (success) onClose();
  };

  if (scanning) {
    return (
      <ProductScanner
        onFound={(result) => {
          setName(result.name);
          setProduct(result.product);
          setScanning(false);
        }}
        onCancel={() => setScanning(false)}
      />
    );
  }

  return (
    <>
      <Title size={skin.type.headline} lines={2} color={skin.panel.title}>
        {title}
      </Title>

      {scannable && (
        <KilButton
          height={skin.size.button.sm}
          fontSize={skin.type.label}
          variant={skin.panel.secondary}
          label={common.shop.scan}
          onTouch={() => setScanning(true)}
        />
      )}
      <FormInput
        label={copy.name}
        placeholder={skin.copy.placeholders.foodName}
        labelColor={skin.panel.ink}
        value={name}
        onChangeText={setName}
      />
      {!onRemove && <NameSuggestions query={name} onPick={setName} />}
      <FormInput
        label={copy.description}
        placeholder={skin.copy.placeholders.foodDescription}
        labelColor={skin.panel.ink}
        value={description}
        onChangeText={setDescription}
      />

      {onRemove && (
        <KilButton
          height={skin.size.button.sm}
          fontSize={skin.type.body}
          variant="danger"
          label={copy.removeIt}
          onTouch={onRemove}
        />
      )}

      <View style={styles.actions}>
        <KilButton
          flex={1}
          height={skin.size.button.md}
          fontSize={skin.type.lead}
          variant={skin.panel.secondary}
          label={skin.copy.common.cancel}
          onTouch={onClose}
        />
        <KilButton
          flex={1}
          height={skin.size.button.md}
          fontSize={skin.type.lead}
          label={skin.copy.common.save}
          onTouch={handleSubmit}
        />
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
  onRemove,
  onClose,
  scannable = false,
}: {
  visible: boolean;
  scannable?: boolean;
  title: string;
  formKey?: string | number;
  initialName?: string;
  initialDescription?: string;
  onSubmit: (data: FoodFormData) => Promise<boolean>;
  onRemove?: () => void;
  onClose: () => void;
}) => (
  <BottomPanel visible={visible} onClose={onClose}>
    <FoodForm
      key={formKey}
      title={title}
      initialName={initialName}
      initialDescription={initialDescription}
      onSubmit={onSubmit}
      onRemove={onRemove}
      onClose={onClose}
      scannable={scannable}
    />
  </BottomPanel>
);

const createStyles = (s: Skin) =>
  StyleSheet.create({
    actions: {
      flexDirection: "row",
      gap: s.spacing.inline,
    },
  });

export default FoodFormModal;
