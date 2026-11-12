import KilButton from "@/components/elements/KilButton";
import QrCodeScanner from "@/components/elements/QrCodeScanner";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import useProductScan, { type ScanResult } from "@/hooks/useProductScan";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import type { BarcodeType } from "expo-camera";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

const PRODUCT_CODES: BarcodeType[] = ["ean13", "ean8", "upc_a", "upc_e"];

const ProductScanner = ({
  onFound,
  onCancel,
}: {
  onFound: (result: ScanResult) => void;
  onCancel: () => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const T = common.shop;
  const findProduct = useProductScan();
  const [searching, setSearching] = useState(false);
  const [warning, setWarning] = useState<ScanResult | null>(null);

  const scanned = async (barcode: string) => {
    setSearching(true);
    const result = await findProduct(barcode);
    setSearching(false);
    if (!result) onCancel();
    else if (result.conflicts.length > 0) setWarning(result);
    else onFound(result);
  };

  if (warning) {
    return (
      <>
        <Title size={skin.type.headline} lines={2} color={skin.panel.title}>
          {T.scanWarnTitle(warning.name)}
        </Title>
        <ThemedText color={skin.panel.ink}>
          {T.scanWarnLine(warning.conflicts.map((tag) => T.scanTags[tag] ?? tag))}
        </ThemedText>
        <View style={styles.actions}>
          <KilButton
            flex={1}
            height={skin.size.button.md}
            fontSize={skin.type.lead}
            variant={skin.panel.secondary}
            label={T.scanWarnAdd}
            onTouch={() => onFound(warning)}
          />
          <KilButton
            flex={1}
            height={skin.size.button.md}
            fontSize={skin.type.lead}
            label={T.scanWarnSkip}
            onTouch={onCancel}
          />
        </View>
      </>
    );
  }

  return (
    <>
      <Title size={skin.type.headline} lines={2} color={skin.panel.title}>
        {T.scan}
      </Title>
      <ThemedText color={skin.panel.ink}>{searching ? T.scanSearching : T.scanLine}</ThemedText>
      {!searching && <QrCodeScanner barcodeTypes={PRODUCT_CODES} notice={T.scanCamera} onScanned={scanned} />}
      <KilButton
        height={skin.size.button.md}
        fontSize={skin.type.lead}
        variant={skin.panel.secondary}
        label={T.scanCancel}
        onTouch={onCancel}
      />
    </>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    actions: {
      flexDirection: "row",
      gap: s.spacing.inline,
    },
  });

export default ProductScanner;
