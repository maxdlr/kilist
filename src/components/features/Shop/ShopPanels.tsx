import { BarcodeIcon, FloppyDiskIcon } from "@/components/icons";
import ActionPanel from "@/components/elements/ActionPanel";
import BottomPanel from "@/components/elements/BottomPanel";
import {
  ActionNote,
  FeedbackCard,
  useFormFeedback,
} from "@/components/elements/Feedback";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import NameSuggestions from "@/components/elements/NameSuggestions";
import ProductScanner from "@/components/elements/ProductScanner";
import Title from "@/components/elements/Title";
import { ThemedText } from "@/components/elements/ThemedText";
import type { ShopAddAction, ShopRun } from "@/hooks/screens/useShopRun";
import type { ScanResult } from "@/hooks/useProductScan";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { StyleSheet, View, type TextInput } from "react-native";

const LOOKUP_DELAY_MS = 250;
const KEYBOARD_DELAY_MS = AnimationService.panel.open.duration + 50;

const AddFoodForm = ({ run }: { run: ShopRun }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const T = common.shop;
  const form = useFormFeedback(["name"] as const);
  const [name, setNameValue] = useState("");
  const [existing, setExisting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [found, setFound] = useState<ScanResult | null>(null);
  const { findFood } = run;
  const hasName = Boolean(name.trim());
  const nameInput = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (scanning) return;
    const timer = setTimeout(
      () => nameInput.current?.focus(),
      KEYBOARD_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [scanning]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const found = await findFood(name);
      if (active) setExisting(found?.name ?? null);
    }, LOOKUP_DELAY_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [name, findFood]);

  const setName = (next: string) => {
    setNameValue(next);
    form.touch("name");
  };

  const submit = async (action: ShopAddAction) => {
    if (busy || !run.inventoryReady) return;
    if (!hasName) {
      form.fail("name", T.addMissing);
      nameInput.current?.focus();
      return;
    }
    setBusy(true);
    const failed = await run.addFood(name.trim(), action, found?.product);
    setBusy(false);
    if (form.settle(failed, common.feedback.addFailed(name.trim())))
      run.closePanel();
  };
  const held = run.inventoryReady ? null : common.feedback.inventoryWait;

  if (scanning) {
    return (
      <ProductScanner
        onFound={(result) => {
          setFound(result);
          setName(result.name);
          setScanning(false);
        }}
        onCancel={() => setScanning(false)}
      />
    );
  }

  return (
    <>
      <Title size={skin.type.headline} lines={2} color={skin.panel.title}>
        {T.addTitle}
      </Title>
      <ThemedText size={12} color={skin.panel.ink} style={styles.note}>
        {T.addListLine}
      </ThemedText>
      <View style={styles.nameRow}>
        <View style={styles.nameField}>
          <FormInput
            ref={nameInput}
            placeholder={skin.copy.placeholders.foodName}
            labelColor={skin.panel.ink}
            value={name}
            onChangeText={setName}
            error={form.of("name")}
          />
        </View>
        <KilButton
          height={skin.size.input}
          variant={hasName ? skin.panel.secondary : "primary"}
          accessibilityLabel={T.scan}
          icon={(color) => (
            <BarcodeIcon size={skin.size.icon.action} color={color} />
          )}
          onTouch={() => setScanning(true)}
        />
        <KilButton
          disabled={!hasName || busy || Boolean(held)}
          height={skin.size.input}
          accessibilityLabel={form.problem ? common.feedback.retry : T.addToList}
          icon={(color) => (
            <FloppyDiskIcon size={skin.size.icon.action} color={color} />
          )}
          onTouch={() => submit("list")}
        />
      </View>
      <NameSuggestions query={name} onPick={setName} />
      <FeedbackCard feedback={form.problem} collapse={skin.spacing.stack} />
      <ActionNote reason={held} collapse={skin.spacing.stack} />
      {run.isStarted && (
        <>
          <ThemedText color={skin.panel.ink}>
            {existing ? T.addExists(existing) : T.addLine}
          </ThemedText>
          <View style={styles.actions}>
            <KilButton
              flex={1}
              height={skin.size.button.md}
              fontSize={skin.type.lead}
              variant={skin.panel.secondary}
              label={T.addLater}
              onTouch={() => submit("later")}
              disabled={Boolean(held)}
            />
            <KilButton
              flex={1}
              height={skin.size.button.md}
              fontSize={skin.type.lead}
              variant={hasName ? "primary" : skin.panel.secondary}
              label={T.addBought}
              onTouch={() => submit("buy")}
              disabled={Boolean(held)}
            />
          </View>
        </>
      )}
    </>
  );
};

const ShopPanels = ({ run }: { run: ShopRun }) => (
  <>
    <ActionPanel
      request={run.panel === "stop" ? run.stopRequest : null}
      onClose={run.closePanel}
    />
    <BottomPanel
      visible={run.panel === "add"}
      onClose={run.closePanel}
      dismissible
    >
      {run.panel === "add" && <AddFoodForm run={run} />}
    </BottomPanel>
  </>
);

const createStyles = (s: Skin) =>
  StyleSheet.create({
    nameRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.inline,
    },
    nameField: { flex: 1, minWidth: 0 },
    note: { opacity: 0.6, textAlign: "start" },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: s.spacing.inline,
      justifyContent: "center",
    },
  });

export default ShopPanels;
