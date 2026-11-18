import BottomPanel from "@/components/elements/BottomPanel";
import { ThemedText } from "@/components/elements/ThemedText";
import Title from "@/components/elements/Title";
import { usePanelSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
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
  const skin = usePanelSkin();
  const styles = useSkinStyles(createStyles);

  return (
    <BottomPanel visible={visible} onClose={onClose} dismissible>
      <Title size={skin.type.headline} lines={2} color={skin.panel.title}>
        {skin.copy.account.qrTitle}
      </Title>
      <View style={[styles.qr, { backgroundColor: skin.colors.paper }]}>
        <QRCode
          value={joinCode}
          size={skin.size.qr}
          color={skin.colors.onPaper}
          backgroundColor={skin.colors.paper}
        />
      </View>
      <ThemedText
        mono
        size={skin.type.headline}
        color={skin.panel.ink}
        style={styles.code}
      >
        {joinCode}
      </ThemedText>
    </BottomPanel>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    qr: {
      alignSelf: "center",
      padding: s.spacing.inline,
      borderRadius: 10,
    },
    code: {
      textAlign: "center",
    },
  });

export default InviteQrModal;
