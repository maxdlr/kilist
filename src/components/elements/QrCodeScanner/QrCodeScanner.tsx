import KilButton from "@/components/elements/KilButton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { StyleSheet } from "react-native";

const QrCodeScanner = ({
  onScanned,
}: {
  onScanned: (data: string) => void;
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <ThemedView style={styles.permission}>
        <ThemedText type="small">
          Camera access is needed to scan a household code.
        </ThemedText>
        <KilButton label="Allow camera" onTouch={requestPermission} />
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

const styles = StyleSheet.create({
  camera: {
    width: "100%",
    height: 220,
    borderRadius: Spacing.two,
    overflow: "hidden",
  },
  permission: {
    gap: Spacing.two,
    alignItems: "center",
  },
});

export default QrCodeScanner;
