import ActionPanel from "@/components/elements/ActionPanel";
import BottomPanel from "@/components/elements/BottomPanel";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import NameSuggestions from "@/components/elements/NameSuggestions";
import ProductScanner from "@/components/elements/ProductScanner";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import type { ShopAddAction, ShopRun } from "@/hooks/screens/useShopRun";
import type { ScanResult } from "@/hooks/useProductScan";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import useToast from "@/providers/ToastProvider";
import type { Skin } from "@/skins/types";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

const LOOKUP_DELAY_MS = 250;

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
      <KilButton
        height={skin.size.button.md}
        fontSize={skin.type.lead}
        variant={hasName ? skin.panel.secondary : "primary"}
        label={T.scan}
        onTouch={() => setScanning(true)}
      />
      <FormInput
        label={T.addName}
        placeholder={skin.copy.placeholders.foodName}
        labelColor={skin.panel.ink}
        value={name}
        onChangeText={setName}
      />
      <NameSuggestions query={name} onPick={setName} />
      {!run.isStarted ? (
        <>
          <ThemedText color={skin.panel.ink}>{T.addListLine}</ThemedText>
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
