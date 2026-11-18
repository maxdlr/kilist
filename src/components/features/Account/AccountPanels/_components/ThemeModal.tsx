import BottomPanel from "@/components/elements/BottomPanel";
import ColorPicker from "@/components/elements/ColorPicker";
import KilButton, { ButtonKindOverride } from "@/components/elements/KilButton";
import { ThemedText } from "@/components/elements/ThemedText";
import Title from "@/components/elements/Title";
import common from "@/i18n/common";
import { useSkinStyles, useSkinSwitch } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

const PREVIEW_EVERY_MS = 80;

const ThemeModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const { skin, setTheme, previewColor, setCustomColor } = useSkinSwitch();
  const styles = useSkinStyles(createStyles);
  const [editing, setEditing] = useState<string | null>(null);
  const picked = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPreview = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => stopPreview, []);

  const pick = (id: string) => {
    onClose();
    if (id !== skin.theme?.id) setTheme(id);
  };

  const edit = (color: string) => {
    picked.current = color;
    setEditing(color);
    previewColor(color);
  };

  const preview = (color: string) => {
    picked.current = color;
    if (timer.current) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      if (picked.current) previewColor(picked.current);
    }, PREVIEW_EVERY_MS);
  };

  const cancel = () => {
    stopPreview();
    setEditing(null);
    previewColor(null);
  };

  const apply = () => {
    stopPreview();
    if (picked.current) setCustomColor(picked.current);
    setEditing(null);
    onClose();
  };

  const close = () => {
    if (editing) cancel();
    onClose();
  };

  return (
    <BottomPanel visible={visible} onClose={close} veil={!editing} dismissible>
      {editing ? (
        <>
          <View style={styles.head}>
            <Title size={skin.type.headline} lines={1} color={skin.panel.title}>
              {common.themeCustomTitle}
            </Title>
            <ThemedText size={skin.type.body} color={skin.panel.ink}>
              {common.themeCustomLine}
            </ThemedText>
          </View>
          <ColorPicker
            initial={editing}
            onChange={preview}
            hueLabel={common.themeHue}
            shadeLabel={common.themeShade}
          />
          <ButtonKindOverride.Provider value={null}>
            <View style={styles.choices}>
              <KilButton
                height={skin.size.button.md}
                fontSize={skin.type.lead}
                variant={skin.panel.secondary}
                label={skin.copy.common.cancel}
                onTouch={cancel}
                style={styles.choice}
              />
              <KilButton
                height={skin.size.button.md}
                fontSize={skin.type.lead}
                label={common.themeCustomApply}
                onTouch={apply}
                style={styles.choice}
              />
            </View>
          </ButtonKindOverride.Provider>
        </>
      ) : (
        <>
          <Title size={skin.type.headline} lines={1} color={skin.panel.title}>
            {common.theme}
          </Title>
          <ButtonKindOverride.Provider value={null}>
            <View accessibilityRole="radiogroup" style={styles.choices}>
              {skin.themes.map((theme) => {
                const current = theme.id === skin.theme?.id;
                return (
                  <KilButton
                    key={theme.id}
                    height={skin.size.button.md}
                    fontSize={skin.type.lead}
                    variant={current ? "primary" : skin.panel.secondary}
                    label={theme.name}
                    accessibilityLabel={`${theme.name}${current ? `, ${common.themeCurrent}` : ""}${
                      theme.custom ? `, ${common.themeCustomEdit}` : ""
                    }`}
                    onTouch={() => (theme.custom && theme.color ? edit(theme.color) : pick(theme.id))}
                    style={styles.choice}
                  />
                );
              })}
            </View>
          </ButtonKindOverride.Provider>
        </>
      )}
    </BottomPanel>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    head: { gap: s.spacing.tight },
    choices: { flexDirection: "row", flexWrap: "wrap", gap: s.spacing.small },
    choice: { alignSelf: "auto", flex: 1 },
  });

export default ThemeModal;
