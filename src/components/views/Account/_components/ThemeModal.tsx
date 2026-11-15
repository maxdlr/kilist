import BottomPanel from "@/components/elements/BottomPanel";
import KilButton from "@/components/elements/KilButton";
import { ButtonKindOverride } from "@/components/elements/KilButton/KilButton";
import Title from "@/components/elements/Title/Title";
import common from "@/i18n/common";
import { useSkinStyles, useSkinSwitch } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";

const ThemeModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const { skin, setTheme } = useSkinSwitch();
  const styles = useSkinStyles(createStyles);

  const pick = (id: string) => {
    onClose();
    if (id !== skin.theme?.id) setTheme(id);
  };

  return (
    <BottomPanel visible={visible} onClose={onClose} dismissible>
      <Title size={skin.type.headline} lines={1} color={skin.panel.title}>
        {common.theme}
      </Title>
      <ButtonKindOverride.Provider value={null}>
        <View accessibilityRole="radiogroup" style={styles.choices}>
          {skin.themes.map((theme) => (
            <KilButton
              key={theme.id}
              height={skin.size.button.md}
              fontSize={skin.type.lead}
              variant={theme.id === skin.theme?.id ? "primary" : skin.panel.secondary}
              label={theme.name}
              accessibilityLabel={`${theme.name}${theme.id === skin.theme?.id ? `, ${common.themeCurrent}` : ""}`}
              onTouch={() => pick(theme.id)}
              style={styles.choice}
            />
          ))}
        </View>
      </ButtonKindOverride.Provider>
    </BottomPanel>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    choices: { flexDirection: "row", flexWrap: "wrap", gap: s.spacing.small },
    choice: { alignSelf: "auto", flex: 1 },
  });

export default ThemeModal;
