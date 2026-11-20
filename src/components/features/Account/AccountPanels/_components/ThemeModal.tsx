import BottomPanel from "@/components/elements/BottomPanel";
import ColorPicker from "@/components/elements/ColorPicker";
import KilButton, { ButtonKindOverride } from "@/components/elements/KilButton";
import { ThemedText } from "@/components/elements/ThemedText";
import Title from "@/components/elements/Title";
import common from "@/i18n/common";
import Press from "@/components/elements/Press";
import { getLang } from "@/i18n";
import { useSkin, useSkinStyles, useSkinSwitch } from "@/providers/SkinProvider";
import { findSkin } from "@/skins";
import type { LevelNumber, Skin } from "@/skins/types";
import withPressed from "@/utils/withPressed";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

const PREVIEW_EVERY_MS = 80;

type ThemeEntry = Skin["themes"][number];

const ThemeCard = ({
  skinId,
  theme,
  current,
  onPress,
}: {
  skinId: string;
  theme: ThemeEntry;
  current: boolean;
  onPress: () => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const colors = findSkin(skinId, getLang(), theme.id, theme.color).colors;
  const rows = [
    [colors.ground, colors.paper, colors.raised],
    [colors.onGround, colors.muted, colors.accent],
    [1, 2, 3, 4, 5].map((level) => colors.levels[level as LevelNumber]),
  ];

  return (
    <Press
      accessibilityRole="radio"
      accessibilityState={{ selected: current }}
      accessibilityLabel={`${theme.name}${current ? `, ${common.themeCurrent}` : ""}${
        theme.custom ? `, ${common.themeCustomEdit}` : ""
      }`}
      onPress={onPress}
      style={withPressed([
        styles.card,
        {
          borderColor: current ? skin.panel.title : skin.panel.line,
          borderWidth: current ? skin.shape.border + 1 : skin.shape.border,
        },
      ])}
    >
      <View style={styles.rows}>
        {rows.map((row, index) => (
          <View key={index} style={styles.row}>
            {row.map((color, at) => (
              <View
                key={`${index}-${at}`}
                style={[styles.swatch, index === 2 && styles.level, { backgroundColor: color, borderColor: skin.panel.line }]}
              />
            ))}
          </View>
        ))}
      </View>
      <ThemedText size={skin.type.label} color={skin.panel.ink} numberOfLines={1}>
        {theme.name}
      </ThemedText>
    </Press>
  );
};

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
          <View accessibilityRole="radiogroup" style={styles.choices}>
            {skin.themes.map((theme) => (
              <ThemeCard
                key={theme.id}
                skinId={skin.id}
                theme={theme}
                current={theme.id === skin.theme?.id}
                onPress={() => (theme.custom && theme.color ? edit(theme.color) : pick(theme.id))}
              />
            ))}
          </View>
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
    card: {
      alignItems: "center",
      borderRadius: s.shape.radius,
      flex: 1,
      gap: s.spacing.small,
      padding: s.spacing.inline,
    },
    rows: { gap: s.spacing.tight + 2 },
    row: { flexDirection: "row", gap: s.spacing.tight, justifyContent: "center" },
    swatch: {
      borderRadius: s.size.swatch / 2,
      borderWidth: s.shape.divider,
      height: s.size.swatch,
      width: s.size.swatch,
    },
    level: { height: s.size.swatch * 0.6, width: s.size.swatch * 0.6 },
  });

export default ThemeModal;
