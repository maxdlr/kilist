import ActionRow from "@/components/elements/ActionRow";
import BottomPanel from "@/components/elements/BottomPanel";
import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import common from "@/i18n/common";
import { deviceLang, Lang, LANGS, LANGUAGE_NAMES } from "@/i18n";
import { useLanguage } from "@/providers/LanguageProvider";
import { useSkin } from "@/providers/SkinProvider";
import useToast from "@/providers/ToastProvider";
import { View } from "react-native";

const LanguageModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const skin = useSkin();
  const { choice, setLanguage } = useLanguage();
  const { showToast } = useToast();
  const options: { value: Lang | null; label: string }[] = [
    { value: null, label: common.languageAuto(LANGUAGE_NAMES[deviceLang()]) },
    ...LANGS.map((lang) => ({ value: lang, label: LANGUAGE_NAMES[lang] })),
  ];

  const pick = async (value: Lang | null) => {
    onClose();
    if (value === choice) return;
    if (!(await setLanguage(value))) showToast(common.unexpected);
  };

  return (
    <BottomPanel visible={visible} onClose={onClose} dismissible>
      <Title size={skin.type.headline} lines={1} color={skin.panel.title}>
        {common.language}
      </Title>
      <View accessibilityRole="radiogroup">
        {options.map((option) => (
          <ActionRow
            key={option.value ?? "auto"}
            label={`${option.value === choice ? "● " : "○ "}${option.label}`}
            onPress={() => pick(option.value)}
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

export default LanguageModal;
