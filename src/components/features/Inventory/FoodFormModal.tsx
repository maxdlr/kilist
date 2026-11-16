import { BarcodeIcon } from "@/components/icons";
import type { LevelNumber, Skin } from "@/skins/types";
import BottomPanel from "@/components/elements/BottomPanel";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import LevelPicker from "@/components/elements/LevelPicker";
import NameSuggestions from "@/components/elements/NameSuggestions";
import ProductScanner from "@/components/elements/ProductScanner";
import Title from "@/components/elements/Title";
import common from "@/i18n/common";
import type { ScannedProduct } from "@/offline/domain";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import useToast from "@/providers/ToastProvider";
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { StyleSheet, View } from "react-native";

type FoodFormData = { name: string; product?: ScannedProduct; level?: LevelNumber };

type CloseGuard = MutableRefObject<() => boolean>;

const FoodForm = ({
  title,
  initialName,
  initialLevel,
  onSubmit,
  onRemove,
  onClose,
  scannable,
  guardRef,
}: {
  title: string;
  initialName: string;
  initialLevel?: LevelNumber;
  scannable: boolean;
  onSubmit: (data: FoodFormData) => Promise<boolean>;
  onRemove?: () => void;
  onClose: () => void;
  guardRef: CloseGuard;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.inventory;
  const { showToast } = useToast();
  const [name, setName] = useState(initialName);
  const [level, setLevel] = useState(initialLevel);
  const [scanning, setScanning] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [product, setProduct] = useState<ScannedProduct | undefined>();

  const isDirty =
    name !== initialName || level !== initialLevel || product !== undefined;

  useEffect(() => {
    guardRef.current = () => {
      if (!isDirty || confirming) return true;
      setConfirming(true);
      return false;
    };
  }, [guardRef, isDirty, confirming]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast(skin.copy.errors.nameMissing);
      return;
    }
    const success = await onSubmit({
      name: name.trim(),
      ...(product && { product }),
      ...(level !== undefined && level !== initialLevel && { level }),
    });
    if (success) onClose();
  };

  if (confirming) {
    return (
      <>
        <Title size={skin.type.headline} lines={3} color={skin.panel.title}>
          {copy.discardTitle}
        </Title>
        <View style={styles.actions}>
          <KilButton
            flex={1}
            height={skin.size.button.md}
            fontSize={skin.type.lead}
            variant={skin.panel.secondary}
            label={copy.discardLeave}
            onTouch={onClose}
          />
          <KilButton
            flex={1}
            height={skin.size.button.md}
            fontSize={skin.type.lead}
            label={copy.discardKeep}
            onTouch={() => setConfirming(false)}
          />
        </View>
      </>
    );
  }

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

      <View style={styles.nameRow}>
        <View style={styles.nameField}>
          <FormInput
            accessibilityLabel={copy.name}
            placeholder={skin.copy.placeholders.foodName}
            labelColor={skin.panel.ink}
            value={name}
            onChangeText={setName}
          />
        </View>
        {scannable && (
          <KilButton
            height={skin.size.input}
            variant={name.trim() ? skin.panel.secondary : "primary"}
            accessibilityLabel={common.shop.scan}
            icon={(color) => <BarcodeIcon size={skin.size.icon.action} color={color} />}
            onTouch={() => setScanning(true)}
          />
        )}
      </View>
      {!onRemove && <NameSuggestions query={name} onPick={setName} />}

      {level !== undefined && <LevelPicker label={copy.status} value={level} onChange={setLevel} />}

      <View style={styles.actions}>
        {onRemove && (
          <KilButton
            flex={1}
            height={skin.size.button.md}
            fontSize={skin.type.lead}
            variant="danger"
            label={copy.removeIt}
            onTouch={onRemove}
          />
        )}
        <KilButton
          flex={1}
          height={skin.size.button.md}
          fontSize={skin.type.lead}
          label={skin.copy.common.save}
          onTouch={handleSubmit}
          disabled={!name.trim()}
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
  initialLevel,
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
  initialLevel?: LevelNumber;
  onSubmit: (data: FoodFormData) => Promise<boolean>;
  onRemove?: () => void;
  onClose: () => void;
}) => {
  const guardRef = useRef(() => true);
  const canClose = useCallback(() => guardRef.current(), []);

  return (
    <BottomPanel visible={visible} onClose={onClose} dismissible canClose={canClose}>
      <FoodForm
        key={formKey}
        title={title}
        initialName={initialName}
        initialLevel={initialLevel}
        onSubmit={onSubmit}
        onRemove={onRemove}
        onClose={onClose}
        scannable={scannable}
        guardRef={guardRef}
      />
    </BottomPanel>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    nameRow: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline },
    nameField: { flex: 1, minWidth: 0 },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: s.spacing.inline,
      justifyContent: "center",
    },
  });

export default FoodFormModal;
