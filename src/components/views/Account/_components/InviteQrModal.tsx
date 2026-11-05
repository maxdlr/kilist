import KilButton from "@/components/elements/KilButton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Modal, Pressable, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";

const InviteQrModal = ({
  visible,
  joinCode,
  onClose,
}: {
  visible: boolean;
  joinCode: string;
  onClose: () => void;
}) => {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable>
          <ThemedView style={styles.card}>
            <ThemedText type="subtitle" style={{ color: "white" }}>
              Scan to join
            </ThemedText>
            <ThemedView
              style={{
                padding: Spacing.four,
                backgroundColor: theme.background,
              }}
            >
              <QRCode
                value={joinCode}
                size={200}
                color={theme.text}
                backgroundColor={theme.background}
              />
            </ThemedView>
            <ThemedText type="smallBold">{joinCode}</ThemedText>
            <KilButton label="Close" onTouch={onClose} />
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: Spacing.four,
  },
  card: {
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.three,
  },
});

export default InviteQrModal;
