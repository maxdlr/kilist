import ActionPanel from "@/components/elements/ActionPanel";
import BottomPanel from "@/components/elements/BottomPanel";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import QrCodeScanner from "@/components/elements/QrCodeScanner";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import type { ShopAddAction, ShopRun } from "@/hooks/screens/useShopRun";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import useToast from "@/providers/ToastProvider";
import type { Skin } from "@/skins/types";
import type { BarcodeType } from "expo-camera";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

const LOOKUP_DELAY_MS = 250;
const PRODUCT_CODES: BarcodeType[] = ["ean13", "ean8", "upc_a", "upc_e"];

const AddFoodForm = ({ run }: { run: ShopRun }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const T = common.shop;
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [existing, setExisting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scan, setScan] = useState<"off" | "camera" | "searching">("off");
  const { findFood } = run;

  const scanned = async (barcode: string) => {
    setScan("searching");
    const found = await run.findProduct(barcode.replace(/\D/g, ""));
    if (found) setName(found);
    setScan("off");
  };

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
    if (!name.trim()) {
      showToast(T.addMissing);
      return;
    }
    setBusy(true);
    const added = await run.addFood(name.trim(), action);
    setBusy(false);
    if (added) run.closePanel();
  };

  if (scan !== "off") {
    return (
      <>
        <Title size={skin.type.headline} lines={2} color={skin.panel.title}>
          {T.scan}
        </Title>
        <ThemedText color={skin.panel.ink}>{scan === "searching" ? T.scanSearching : T.scanLine}</ThemedText>
        {scan === "camera" && (
          <QrCodeScanner barcodeTypes={PRODUCT_CODES} notice={T.scanCamera} onScanned={scanned} />
        )}
        <KilButton
          height={skin.size.button.md}
          fontSize={skin.type.lead}
          variant={skin.panel.secondary}
          label={T.scanCancel}
          onTouch={() => setScan("off")}
        />
      </>
    );
  }

  return (
    <>
      <Title size={skin.type.headline} lines={2} color={skin.panel.title}>
        {T.addTitle}
      </Title>
      <FormInput
        label={T.addName}
        placeholder={skin.copy.placeholders.foodName}
        labelColor={skin.panel.ink}
        value={name}
        onChangeText={setName}
        autoFocus
      />
      <KilButton
        height={skin.size.button.sm}
        fontSize={skin.type.label}
        variant={skin.panel.secondary}
        label={T.scan}
        onTouch={() => setScan("camera")}
      />
      <ThemedText color={skin.panel.ink}>{existing ? T.addExists(existing) : T.addLine}</ThemedText>
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
          label={T.addBought}
          onTouch={() => submit("buy")}
        />
      </View>
    </>
  );
};

const ShopPanels = ({ run }: { run: ShopRun }) => (
  <>
    <ActionPanel request={run.panel === "stop" ? run.stopRequest : null} onClose={run.closePanel} />
    <BottomPanel visible={run.panel === "add"} onClose={run.closePanel} dismissible>
      {run.panel === "add" && <AddFoodForm run={run} />}
    </BottomPanel>
  </>
);

const createStyles = (s: Skin) =>
  StyleSheet.create({
    actions: {
      flexDirection: "row",
      gap: s.spacing.inline,
    },
  });

export default ShopPanels;
