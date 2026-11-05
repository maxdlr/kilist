import BottomPanel from "@/components/elements/BottomPanel";
import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import PremiumGate from "@/components/PremiumGate";
import { ThemedText } from "@/components/themed-text";
import { useSkinSwitch, useSkinStyles } from "@/providers/SkinProvider";
import useToast from "@/providers/ToastProvider";
import { SKINS } from "@/skins";
import type { LevelNumber, Skin,  } from "@/skins/types";
import { Pressable, StyleSheet, View } from "react-native";

const LEVELS: LevelNumber[] = [1, 2, 3, 4, 5];

const SkinOption = ({
  option,
  isCurrent,
  onPick,
}: {
  option: Skin;
  isCurrent: boolean;
  onPick: () => void;
}) => {
  const { skin } = useSkinSwitch();
  const styles = useSkinStyles(createStyles);
  const line = isCurrent ? skin.actions.primary.line : skin.colors.raised;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isCurrent }}
      accessibilityLabel={`${option.name}. ${option.tagline}`}
      onPress={onPick}
      style={[
        styles.option,
        { borderColor: line, borderWidth: skin.shape.border },
      ]}
    >
      <View style={styles.swatches}>
        {[option.colors.ground, option.actions.primary.fill]
          .concat(LEVELS.map((level) => option.colors.levels[level]))
          .map((color, index) => (
            <View
              key={index}
              style={[styles.swatch, { backgroundColor: color }]}
            />
          ))}
      </View>
      <View style={styles.optionText}>
        <ThemedText size={skin.type.lead} color={skin.colors.onGround}>
          {option.name}
        </ThemedText>
        <ThemedText size={skin.type.caption} color={skin.colors.muted}>
          {isCurrent ? skin.copy.account.skinCurrent : option.tagline}
        </ThemedText>
      </View>
    </Pressable>
  );
};

const SkinPickerModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const { skin, setSkin } = useSkinSwitch();
  const { showToast } = useToast();
  const copy = skin.copy.account;

  const pick = async (id: string) => {
    if (id === skin.id) return;
    const saved = await setSkin(id);
    if (!saved) showToast("Couldn't save your skin");
  };

  return (
    <BottomPanel visible={visible} onClose={onClose} dismissible>
      <PremiumGate
        fallback={
          <>
            <Title size={skin.type.headline} lines={2} color={skin.colors.accent}>
              {copy.skinLockedTitle}
            </Title>
            <ThemedText color={skin.colors.onGround}>
              {copy.skinLockedLine}
            </ThemedText>
          </>
        }
      >
        <Title size={skin.type.headline} lines={1} color={skin.colors.accent}>
          {copy.skinTitle}
        </Title>
        {SKINS.map((option) => (
          <SkinOption
            key={option.id}
            option={option}
            isCurrent={option.id === skin.id}
            onPick={() => pick(option.id)}
          />
        ))}
      </PremiumGate>
      <KilButton
        height={skin.size.button.md}
        fontSize={skin.type.lead}
        variant="secondary"
        label={skin.copy.common.close}
        onTouch={onClose}
      />
    </BottomPanel>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    option: {
      gap: s.spacing.inline,
      padding: s.spacing.dock,
    },
    swatches: {
      flexDirection: "row",
      height: s.size.swatch,
    },
    swatch: {
      flex: 1,
    },
    optionText: {
      gap: s.spacing.hair,
    },
  });

export default SkinPickerModal;
