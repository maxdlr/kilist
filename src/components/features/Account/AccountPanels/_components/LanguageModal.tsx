import BottomPanel from "@/components/elements/BottomPanel";
import KilButton, { ButtonKindOverride } from "@/components/elements/KilButton";
import Title from "@/components/elements/Title";
import common from "@/i18n/common";
import { Lang, LANGS, LANGUAGE_NAMES } from "@/i18n";
import { useLanguage } from "@/providers/LanguageProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FeedbackCard, type Feedback } from "@/components/elements/Feedback";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

const LanguageModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { choice, setLanguage } = useLanguage();
  const [problem, setProblem] = useState<Feedback | null>(null);
  const options: { value: Lang | null; label: string }[] = [
    { value: null, label: common.languagePhone },
    ...LANGS.map((lang) => ({ value: lang, label: LANGUAGE_NAMES[lang] })),
  ];

  const close = () => {
    setProblem(null);
    onClose();
  };

  const pick = async (value: Lang | null) => {
    if (value === choice) return close();
    if (await setLanguage(value)) return close();
    setProblem({ tone: "error", title: common.feedback.saveFailed, body: common.feedback.flippedBack });
  };

  return (
    <BottomPanel visible={visible} onClose={close} dismissible>
      <Title size={skin.type.headline} lines={1} color={skin.panel.title}>
        {common.language}
      </Title>
      <ButtonKindOverride.Provider value={null}>
        <View accessibilityRole="radiogroup" style={styles.choices}>
          {options.map((option) => (
            <KilButton
              key={option.value ?? "auto"}
              height={skin.size.button.md}
              fontSize={skin.type.lead}
              variant={option.value === choice ? "primary" : skin.panel.secondary}
              label={option.label}
              accessibilityLabel={`${option.label}${option.value === choice ? `, ${common.languageCurrent}` : ""}`}
              onTouch={() => pick(option.value)}
              style={styles.choice}
            />
          ))}
        </View>
      </ButtonKindOverride.Provider>
      <FeedbackCard feedback={problem} collapse={skin.spacing.stack} />
    </BottomPanel>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    choices: { flexDirection: "row", gap: s.spacing.small },
    choice: { alignSelf: "auto", flex: 1 },
  });

export default LanguageModal;
