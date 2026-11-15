import common from "@/i18n/common";
import BottomPanel from "@/components/elements/BottomPanel";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";

const FONTS = ["Anton", "Bungee", "Inter", "Press Start 2P", "Space Grotesk", "Space Mono"];

const CreditsModal = ({
  visible,
  onClose,
  onOpenIcons,
}: {
  visible: boolean;
  onClose: () => void;
  onOpenIcons: () => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.account;

  return (
    <BottomPanel visible={visible} onClose={onClose} dismissible>
      <Title size={skin.type.headline} lines={1} color={skin.panel.title}>
        {copy.creditsTitle}
      </Title>
      <View style={styles.group}>
        <ThemedText size={skin.type.caption} color={skin.panel.ink}>
          {copy.creditsIcons}
        </ThemedText>
        <ThemedText
          accessibilityRole="link"
          size={skin.type.body}
          color={skin.panel.ink}
          style={styles.link}
          onPress={onOpenIcons}
        >
          {common.creditsIcons}
        </ThemedText>
      </View>
      <View style={styles.group}>
        <ThemedText size={skin.type.caption} color={skin.panel.ink}>
          {common.creditsProductsLabel}
        </ThemedText>
        <ThemedText size={skin.type.body} color={skin.panel.ink}>
          {common.creditsProducts}
        </ThemedText>
      </View>
      <View style={styles.group}>
        <ThemedText size={skin.type.caption} color={skin.panel.ink}>
          {copy.creditsFonts}
        </ThemedText>
        <ThemedText size={skin.type.body} color={skin.panel.ink}>
          {FONTS.join(" · ")}
        </ThemedText>
        <ThemedText size={skin.type.caption} color={skin.panel.ink}>
          {copy.creditsLicense}
        </ThemedText>
      </View>
    </BottomPanel>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    group: { gap: s.spacing.small },
    link: { textDecorationLine: "underline" },
  });

export default CreditsModal;
