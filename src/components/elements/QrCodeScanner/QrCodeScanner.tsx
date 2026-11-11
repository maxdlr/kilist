import common from "@/i18n/common";
import type { Skin } from "@/skins/types";
import KilButton from "@/components/elements/KilButton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { caseFor } from "@/skins";
import { type BarcodeType, CameraView, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { StyleSheet } from "react-native";

const QR: BarcodeType[] = ["qr"];

const QrCodeScanner = ({
  onScanned,
  barcodeTypes = QR,
  notice = common.cameraNeeded,
}: {
  onScanned: (data: string) => void;
  barcodeTypes?: BarcodeType[];
  notice?: string;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <ThemedView style={styles.permission}>
        <ThemedText size={skin.type.caption} style={styles.notice}>
          {notice}
        </ThemedText>
        <KilButton label={caseFor(skin, common.allowCamera)} onTouch={requestPermission} />
      </ThemedView>
    );
  }

  return (
    <CameraView
      style={styles.camera}
      barcodeScannerSettings={{ barcodeTypes }}
      onBarcodeScanned={({ data }) => {
        if (scanned) return;
        setScanned(true);
        onScanned(data);
      }}
    />
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    camera: {
      width: "100%",
      height: s.size.scanner,
      borderRadius: s.shape.radius,
      overflow: "hidden",
    },
    notice: {
      backgroundColor: s.colors.paper,
      padding: s.spacing.small,
    },
    permission: {
      gap: s.spacing.small,
      alignItems: "center",
    },
  });

export default QrCodeScanner;
