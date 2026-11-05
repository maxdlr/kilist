import type { Skin } from "@/skins/types";
import BottomPanel from "@/components/elements/BottomPanel";
import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
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
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);

  return (
    <BottomPanel visible={visible} onClose={onClose} dismissible>
      <Title size={skin.type.headline} lines={2} color={skin.colors.accent}>
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
      <ThemedText mono size={skin.type.mono} color={skin.colors.onGround} style={styles.code}>
        {joinCode}
      </ThemedText>
      <KilButton
        height={skin.size.button.md}
        fontSize={skin.type.lead}
        label={skin.copy.common.close}
        onTouch={onClose}
      />
    </BottomPanel>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    qr: {
      alignSelf: "center",
      padding: s.spacing.inline,
    },
    code: {
      textAlign: "center",
    },
  });

export default InviteQrModal;
