import { BarcodeIcon } from "@/components/icons";
import ActionPanel from "@/components/elements/ActionPanel";
import BottomPanel from "@/components/elements/BottomPanel";
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
import useToast from "@/providers/ToastProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { StyleSheet, View, type TextInput } from "react-native";

const LOOKUP_DELAY_MS = 250;
const KEYBOARD_DELAY_MS = AnimationService.config.duration + 50;

const AddFoodForm = ({ run }: { run: ShopRun }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const T = common.shop;
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [existing, setExisting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [found, setFound] = useState<ScanResult | null>(null);
  const { findFood } = run;
  const hasName = Boolean(name.trim());
  const nameInput = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (scanning) return;
    const timer = setTimeout(() => nameInput.current?.focus(), KEYBOARD_DELAY_MS);
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

  const submit = async (action: ShopAddAction) => {
    if (busy) return;
    if (!hasName) {
      showToast(T.addMissing);
      return;
    }
    setBusy(true);
    const added = await run.addFood(name.trim(), action, found?.product);
    setBusy(false);
    if (added) run.closePanel();
  };

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
      <View style={styles.nameRow}>
        <View style={styles.nameField}>
          <FormInput
            ref={nameInput}
            placeholder={skin.copy.placeholders.foodName}
            labelColor={skin.panel.ink}
            value={name}
            onChangeText={setName}
          />
        </View>
        <KilButton
          height={skin.size.input}
          variant={hasName ? skin.panel.secondary : "primary"}
          accessibilityLabel={T.scan}
          icon={(color) => <BarcodeIcon size={skin.size.icon.action} color={color} />}
          onTouch={() => setScanning(true)}
        />
      </View>
      <NameSuggestions query={name} onPick={setName} />
      {!run.isStarted ? (
        <>
          <ThemedText size={12} color={skin.panel.ink} style={styles.note}>
            {T.addListLine}
          </ThemedText>
          <KilButton
            height={skin.size.button.md}
            fontSize={skin.type.lead}
            variant={hasName ? "primary" : skin.panel.secondary}
            label={T.addToList}
            onTouch={() => submit("list")}
          />
        </>
      ) : (
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
            />
            <KilButton
              flex={1}
              height={skin.size.button.md}
              fontSize={skin.type.lead}
              variant={hasName ? "primary" : skin.panel.secondary}
              label={T.addBought}
              onTouch={() => submit("buy")}
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
    nameRow: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline },
    nameField: { flex: 1, minWidth: 0 },
    note: { opacity: 0.6, textAlign: "center" },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: s.spacing.inline,
      justifyContent: "center",
    },
  });

export default ShopPanels;
