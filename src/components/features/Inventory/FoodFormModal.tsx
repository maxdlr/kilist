import BottomPanel from "@/components/elements/BottomPanel";
import { FeedbackCard, useFormFeedback } from "@/components/elements/Feedback";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import NameSuggestions from "@/components/elements/NameSuggestions";
import ProductScanner from "@/components/elements/ProductScanner";
import Title from "@/components/elements/Title";
import { BarcodeIcon, FloppyDiskIcon } from "@/components/icons";
import common from "@/i18n/common";
import type { ScannedProduct } from "@/offline/domain";
import { summarize } from "@/offline/summary";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import type { FoodType } from "@/types/model";
import type { Problem } from "@/utils/problem";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type MutableRefObject,
} from "react";
import { StyleSheet, View, type TextInput } from "react-native";
import FoodDetails, {
  type DetailKey,
  type FoodDetailValues,
} from "./FoodDetails";
import FoodSummary from "./FoodSummary";

export type FoodDetailChanges = Partial<FoodDetailValues>;

type FoodFormData = {
  name: string;
  product?: ScannedProduct;
} & FoodDetailChanges;

const KEYBOARD_DELAY_MS = AnimationService.panel.open.duration + 50;
const QUIET_SAVE_MS = 600;
const TEXT_KEYS = ["quantity", "note"] as const;

type CloseGuard = MutableRefObject<() => boolean>;

const valuesOf = (food?: FoodType | null): FoodDetailValues => ({
  frequencyDays: food?.frequencyDays ?? null,
  quantity: food?.quantity ?? null,
  note: food?.note ?? null,
});

const textOf = (value: string | null) => (value ?? "").trim() || null;

const FoodForm = ({
  title,
  food,
  initialName,
  onSubmit,
  onQuietSave,
  onRemove,
  onClose,
  scannable,
  guardRef,
  creating,
  expanded,
  setExpandable,
}: {
  creating: boolean;
  title: string;
  food?: FoodType | null;
  initialName: string;
  scannable: boolean;
  onSubmit: (data: FoodFormData) => Promise<Problem | null>;
  onQuietSave?: (changes: FoodDetailChanges) => void;
  onRemove?: () => void;
  onClose: () => void;
  guardRef: CloseGuard;
  expanded: boolean;
  setExpandable: (expandable: boolean) => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.inventory;
  const form = useFormFeedback(["name"] as const);
  const [name, setNameValue] = useState(initialName);
  const [scanning, setScanning] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [product, setProduct] = useState<ScannedProduct | undefined>();
  const [values, setValues] = useState<FoodDetailValues>(() => valuesOf(food));
  const [added, setAdded] = useState<DetailKey[]>([]);
  const saved = useRef<FoodDetailValues>(valuesOf(food));
  const nameInput = useRef<ComponentRef<typeof TextInput>>(null);
  const quiet = !creating && Boolean(onQuietSave);

  const detailsTouched =
    values.frequencyDays !== null ||
    textOf(values.quantity) !== null ||
    textOf(values.note) !== null;
  const isDirty =
    name !== initialName ||
    product !== undefined ||
    (creating && detailsTouched);
  const sentence = summarize(
    { boughtDates: food?.boughtDates, quantity: values.quantity },
    common.summary,
  );

  useEffect(() => {
    setExpandable(!scanning && !confirming);
  }, [scanning, confirming, setExpandable]);

  useEffect(() => {
    if (!creating || scanning) return;
    const timer = setTimeout(
      () => nameInput.current?.focus(),
      KEYBOARD_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [creating, scanning]);

  useEffect(() => {
    guardRef.current = () => {
      if (!isDirty || confirming) return true;
      setConfirming(true);
      return false;
    };
  }, [guardRef, isDirty, confirming]);

  const flush = useCallback(
    (key: (typeof TEXT_KEYS)[number], value: string | null) => {
      const next = textOf(value);
      if (!quiet || next === saved.current[key]) return;
      saved.current = { ...saved.current, [key]: next };
      onQuietSave?.({ [key]: next });
    },
    [quiet, onQuietSave],
  );

  const latestValues = useRef(values);

  useEffect(() => {
    latestValues.current = values;
  }, [values]);

  useEffect(() => {
    if (!quiet) return;
    const timer = setTimeout(() => {
      for (const key of TEXT_KEYS) flush(key, latestValues.current[key]);
    }, QUIET_SAVE_MS);
    return () => clearTimeout(timer);
  }, [quiet, values.quantity, values.note, flush]);

  useEffect(
    () => () => {
      for (const key of TEXT_KEYS) flush(key, latestValues.current[key]);
    },
    [flush],
  );

  const setFrequency = (frequencyDays: number | null) => {
    setValues((current) => ({ ...current, frequencyDays }));
    if (!quiet || frequencyDays === saved.current.frequencyDays) return;
    saved.current = { ...saved.current, frequencyDays };
    onQuietSave?.({ frequencyDays });
  };

  const setText = (key: (typeof TEXT_KEYS)[number], text: string) =>
    setValues((current) => ({ ...current, [key]: text }));

  const addDetail = (key: DetailKey) =>
    setAdded((keys) => (keys.includes(key) ? keys : [...keys, key]));

  const removeDetail = (key: DetailKey) => {
    setAdded((keys) => keys.filter((entry) => entry !== key));
    if (key === "frequencyDays") {
      setFrequency(null);
      return;
    }
    setValues((current) => ({ ...current, [key]: null }));
    flush(key, null);
  };

  const setName = (next: string) => {
    setNameValue(next);
    form.touch("name");
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      form.fail("name", skin.copy.errors.nameMissing);
      nameInput.current?.focus();
      return;
    }
    const details: FoodDetailChanges = creating
      ? {
          ...(values.frequencyDays !== null && {
            frequencyDays: values.frequencyDays,
          }),
          ...(textOf(values.quantity) && { quantity: textOf(values.quantity) }),
          ...(textOf(values.note) && { note: textOf(values.note) }),
        }
      : {};
    const failed = await onSubmit({
      name: name.trim(),
      ...(product && { product }),
      ...details,
    });
    if (
      form.settle(
        failed,
        creating
          ? common.feedback.addFailed(name.trim())
          : common.feedback.saveFailed,
      )
    )
      onClose();
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
          const scanned =
            typeof result.product?.quantity === "string"
              ? result.product.quantity
              : null;
          if (scanned)
            setValues((current) =>
              textOf(current.quantity)
                ? current
                : { ...current, quantity: scanned },
            );
          setScanning(false);
        }}
        onCancel={() => setScanning(false)}
      />
    );
  }

  if (expanded) {
    return (
      <FoodDetails
        name={name.trim() || title}
        sentence={sentence}
        values={values}
        added={added}
        focusKey={added[added.length - 1]}
        quiet={quiet}
        onAdd={addDetail}
        onRemove={removeDetail}
        onFrequency={setFrequency}
        onText={setText}
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
            error={form.of("name")}
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
        <KilButton
          disabled={!isDirty}
          height={skin.size.input}
          accessibilityLabel={form.problem ? common.feedback.retry : skin.copy.common.save}
          onTouch={handleSubmit}
          icon={(color) => (
            <FloppyDiskIcon size={skin.size.icon.action} color={color} />
          )}
        />
      </View>
      {creating && <NameSuggestions query={name} onPick={setName} />}
      {sentence && <FoodSummary parts={sentence} />}

      <FeedbackCard feedback={form.problem} collapse={skin.spacing.stack} />

      {onRemove && (
        <View style={styles.actions}>
          <KilButton
            flex={1}
            height={skin.size.button.md}
            fontSize={skin.type.lead}
            variant="danger"
            label={copy.removeIt}
            onTouch={onRemove}
          />
        </View>
      )}
    </>
  );
};

const FoodFormModal = ({
  visible,
  title,
  formKey,
  food,
  initialName = food?.name ?? "",
  onSubmit,
  onQuietSave,
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
  food?: FoodType | null;
  initialName?: string;
  onSubmit: (data: FoodFormData) => Promise<Problem | null>;
  onQuietSave?: (changes: FoodDetailChanges) => void;
  onRemove?: () => void;
  onClose: () => void;
}) => {
  const guardRef = useRef(() => true);
  const canClose = useCallback(() => guardRef.current(), []);
  const [expanded, setExpanded] = useState(false);
  const [expandable, setExpandable] = useState(true);
  const expand = useCallback(() => setExpanded(true), []);
  const collapse = useCallback(() => setExpanded(false), []);

  const [shownFor, setShownFor] = useState({ visible, formKey });

  if (shownFor.visible !== visible || shownFor.formKey !== formKey) {
    setShownFor({ visible, formKey });
    setExpanded(false);
  }

  return (
    <BottomPanel
      visible={visible}
      onClose={onClose}
      dismissible
      canClose={canClose}
      expanded={expanded}
      onExpand={expandable ? expand : undefined}
      onCollapse={collapse}
      expandHint={common.details.pullUp}
    >
      <FoodForm
        key={formKey}
        title={title}
        food={food}
        initialName={initialName}
        onSubmit={onSubmit}
        onQuietSave={onQuietSave}
        onRemove={onRemove}
        onClose={onClose}
        scannable={scannable}
        guardRef={guardRef}
        creating={creating}
        expanded={expanded}
        setExpandable={setExpandable}
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
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: s.spacing.inline,
      justifyContent: "center",
    },
  });

export default FoodFormModal;
