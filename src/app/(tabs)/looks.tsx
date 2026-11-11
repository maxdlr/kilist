import BackBar from "@/components/elements/BackBar/BackBar";
import LooksShowcase from "@/components/views/Account/_components/LooksShowcase";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { ScrollView, StyleSheet } from "react-native";

const LooksScreen = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  useStatusBarStyle(skin.statusBarOnGround);

  return (
    <BackBar>
      <ScrollView style={{ backgroundColor: skin.colors.ground }} contentContainerStyle={styles.content}>
        <LooksShowcase titleColor={skin.colors.onGround} />
      </ScrollView>
    </BackBar>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    content: {
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.gutter,
      paddingTop: s.spacing.stack,
    },
  });

export default LooksScreen;
