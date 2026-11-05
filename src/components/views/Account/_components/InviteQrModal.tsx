import BottomPanel from "@/components/elements/BottomPanel";
import KilButton from "@/components/elements/KilButton";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, View } from "react-native";
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
    <BottomPanel visible={visible} onClose={onClose} dismissible>
      <View style={styles.content}>
        <ThemedText type="subtitle">Scan to join</ThemedText>
        <QRCode
          value={joinCode}
          size={200}
          color={theme.text}
          backgroundColor={theme.background}
        />
        <ThemedText type="smallBold">{joinCode}</ThemedText>
        <KilButton label="Close" onTouch={onClose} />
      </View>
    </BottomPanel>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    gap: Spacing.three,
  },
});

export default InviteQrModal;
