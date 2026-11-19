import BottomPanel from "@/components/elements/BottomPanel";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import KilToggleButton from "@/components/elements/KilToggleButton";
import Press from "@/components/elements/Press";
import { ThemedText } from "@/components/elements/ThemedText";
import NameSuggestions from "@/components/elements/NameSuggestions";
import ProductScanner from "@/components/elements/ProductScanner";
import Title from "@/components/elements/Title";
import { BarcodeIcon } from "@/components/icons";
import common from "@/i18n/common";
import type { ScannedProduct } from "@/offline/domain";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import useToast from "@/providers/ToastProvider";
import AnimationService from "@/services/animation";
import withPressed from "@/utils/withPressed";
import type { LevelNumber, Skin } from "@/skins/types";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type MutableRefObject,
} from "react";
import { StyleSheet, View, type TextInput } from "react-native";

type FoodFormData = {
  name: string;
  product?: ScannedProduct;
  level?: LevelNumber;
  frequencyDays?: number | null;
};

const FREQUENCIES = ["auto", "7", "14", "30"] as const;
type Frequency = (typeof FREQUENCIES)[number];

const toFrequency = (days?: number | null): Frequency =>
  FREQUENCIES.find((option) => option === String(days)) ?? "auto";

const KEYBOARD_DELAY_MS = AnimationService.config.duration + 50;

type CloseGuard = MutableRefObject<() => boolean>;

const FoodForm = ({
  title,
  initialName,
  initialFrequency,
  onSubmit,
  onRemove,
  onClose,
  scannable,
  guardRef,
  creating,
}: {
  creating: boolean;
  title: string;
  initialName: string;
  initialFrequency?: number | null;
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
  const [scanning, setScanning] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [product, setProduct] = useState<ScannedProduct | undefined>();
  const startFrequency = toFrequency(initialFrequency);
  const [frequency, setFrequency] = useState<Frequency>(startFrequency);
  const [showFrequency, setShowFrequency] = useState(false);
  const nameInput = useRef<ComponentRef<typeof TextInput>>(null);
  const isCreating = creating;

  const isDirty =
    name !== initialName ||
    product !== undefined ||
    frequency !== startFrequency;

  useEffect(() => {
    if (!isCreating || scanning) return;
    const timer = setTimeout(
      () => nameInput.current?.focus(),
      KEYBOARD_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [isCreating, scanning]);

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
    const frequencyDays = frequency === "auto" ? null : Number(frequency);
    const success = await onSubmit({
      name: name.trim(),
      ...(product && { product }),
      ...(frequency !== startFrequency &&
        (isCreating ? frequencyDays !== null : true) && { frequencyDays }),
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
            ref={nameInput}
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
            icon={(color) => (
              <BarcodeIcon size={skin.size.icon.action} color={color} />
            )}
            onTouch={() => setScanning(true)}
          />
        )}
      </View>
      {isCreating && <NameSuggestions query={name} onPick={setName} />}

      <View style={styles.frequency}>
        <Press
          accessibilityRole="button"
          accessibilityState={{ expanded: showFrequency }}
          hitSlop={skin.spacing.small}
          onPress={() => setShowFrequency((shown) => !shown)}
          style={withPressed(styles.frequencyToggle)}
        >
          <ThemedText size={skin.type.label} color={skin.panel.ink}>
            {common.frequency.label}
            {" · "}
            <ThemedText
              size={skin.type.label}
              color={skin.panel.ink}
              style={{
                fontFamily: skin.fonts.body?.bold ?? skin.fonts.display.family,
              }}
            >
              {common.frequency.options[frequency]}
            </ThemedText>
          </ThemedText>
        </Press>
        {showFrequency && (
          <View style={styles.frequencyPicker}>
            <KilToggleButton
              value={frequency}
              onChange={setFrequency}
              onDark={skin.panel.ink === skin.colors.onGround}
              options={FREQUENCIES.map((option) => ({
                label: common.frequency.options[option],
                value: option,
              }))}
            />
            <ThemedText size={skin.type.caption} color={skin.panel.ink}>
              {common.frequency.hint}
            </ThemedText>
          </View>
        )}
      </View>

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
  initialFrequency,
  initialLevel,
  onSubmit,
  onRemove,
  onClose,
  scannable = false,
  creating = !onRemove,
}: {
  creating?: boolean;
  visible: boolean;
  scannable?: boolean;
  title: string;
  formKey?: string | number;
  initialName?: string;
  initialFrequency?: number | null;
  initialLevel?: LevelNumber;
  onSubmit: (data: FoodFormData) => Promise<boolean>;
  onRemove?: () => void;
  onClose: () => void;
}) => {
  const guardRef = useRef(() => true);
  const canClose = useCallback(() => guardRef.current(), []);

  return (
    <BottomPanel
      visible={visible}
      onClose={onClose}
      dismissible
      canClose={canClose}
    >
      <FoodForm
        key={formKey}
        title={title}
        initialName={initialName}
        initialFrequency={initialFrequency}
        initialLevel={initialLevel}
        onSubmit={onSubmit}
        onRemove={onRemove}
        onClose={onClose}
        scannable={scannable}
        guardRef={guardRef}
        creating={creating}
      />
    </BottomPanel>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    nameRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.inline,
    },
    nameField: { flex: 1, minWidth: 0 },
    frequency: { gap: s.spacing.small },
    frequencyToggle: {
      alignSelf: "flex-start",
      paddingVertical: s.spacing.hair,
    },
    frequencyPicker: { gap: s.spacing.small },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: s.spacing.inline,
      justifyContent: "center",
    },
  });

export default FoodFormModal;
