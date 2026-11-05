import type { Skin } from "@/skins/types";
import KilButton from "@/components/elements/KilButton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { StyleSheet } from "react-native";

const QrCodeScanner = ({
  onScanned,
}: {
  onScanned: (data: string) => void;
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
          Camera access is needed to scan a household code.
        </ThemedText>
        <KilButton label="ALLOW CAMERA" onTouch={requestPermission} />
      </ThemedView>
    );
  }

  return (
    <CameraView
      style={styles.camera}
      barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
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
