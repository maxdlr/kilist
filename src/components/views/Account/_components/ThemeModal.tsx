import ActionRow from "@/components/elements/ActionRow";
import BottomPanel from "@/components/elements/BottomPanel";
import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import common from "@/i18n/common";
import { useSkinSwitch } from "@/providers/SkinProvider";
import { View } from "react-native";

const ThemeModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const { skin, setTheme } = useSkinSwitch();

  const pick = (id: string) => {
    onClose();
    if (id !== skin.theme?.id) setTheme(id);
  };

  return (
    <BottomPanel visible={visible} onClose={onClose} dismissible>
      <Title size={skin.type.headline} lines={1} color={skin.panel.title}>
        {common.theme}
      </Title>
      <View accessibilityRole="radiogroup">
        {skin.themes.map((theme) => (
          <ActionRow
            key={theme.id}
            label={`${theme.id === skin.theme?.id ? "● " : "○ "}${theme.name}`}
            onPress={() => pick(theme.id)}
            onPanel
          />
        ))}
      </View>
      <KilButton
        height={skin.size.button.md}
        fontSize={skin.type.lead}
        variant={skin.panel.secondary}
        label={skin.copy.common.close}
        onTouch={onClose}
      />
    </BottomPanel>
  );
};

export default ThemeModal;
