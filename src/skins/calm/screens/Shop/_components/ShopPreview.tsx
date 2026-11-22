import { FeedbackSlot } from "@/components/elements/Feedback";
import Press from "@/components/elements/Press";
import EditFoodPanel from "@/components/features/Inventory/EditFoodPanel";
import ShopPanels from "@/components/features/Shop/ShopPanels";
import useAisleManager from "@/hooks/screens/useAisleManager";
import { OTHER_AISLE, shopSections } from "@/hooks/screens/useRunAisles";
import type { ShopRun } from "@/hooks/screens/useShopRun";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import withPressed from "@/utils/withPressed";
import { useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import T from "@/skins/calm/text";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CButton, CText, DockSpacer, Dot, HelpTip, Screen } from "@/skins/calm/components";
import GLASS from "../glass";
import AisleManager from "./AisleManager";
import ShopDock from "./ShopDock";

const ShopPreview = ({ run }: { run: ShopRun }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const [touches, setTouches] = useState(0);
  const [editing, setEditing] = useState<FoodType | null>(null);
  const aisles = useAisleManager({
    foods: run.preview,
    text: {
      confirmTitle: T.shop.aislesConfirmTitle,
      confirmLine: T.shop.aislesConfirmLine,
      confirmKeep: T.shop.aislesConfirmKeep,
      confirmSave: T.shop.aislesConfirmSave,
      confirmDiscard: T.shop.aislesConfirmDiscard,
    },
    onSaved: run.refreshPreview,
  });
  const selecting = run.selected.length > 0;
  const sections = shopSections(run.preview, T.shop.otherAisle);

  return (
    <View style={styles.flex} onTouchStart={() => setTouches((count) => count + 1)}>
      <Screen
        padded={false}
        glassLook={GLASS}
        dock={
          selecting ? (
            <>
              <CButton variant="secondary" label={skin.copy.common.cancel} onPress={run.clearSelection} />
              <CButton label={common.shop.buyLater(run.selected.length)} onPress={run.buyLater} />
            </>
          ) : (
            <ShopDock run={run} label={common.shop.start} onPress={run.start} />
          )
        }
        dockMode={selecting ? "select" : "start"}
        dockDepth={selecting ? 1 : 0}
        glass
      >
        <View style={[styles.flex, styles.list]}>
          <View style={styles.head}>
            <View style={styles.titleRow}>
              <CText weight="medium" size={skin.type.display.md} accessibilityRole="header">
                {T.shop.title}
              </CText>
              {selecting ? (
                <CText size={skin.type.label} color={C.text} accessibilityLiveRegion="polite">
                  {common.shop.selected(run.selected.length)}
                </CText>
              ) : (
                <HelpTip text={T.shop.selectToEdit} accessibilityLabel={T.shop.howAria} activity={touches} />
              )}
            </View>
          </View>
          <Animated.ScrollView
            style={styles.flex}
            contentContainerStyle={styles.sections}
            refreshControl={<RefreshControl refreshing={false} onRefresh={run.refreshEmpty} tintColor={C.textSoft} />}
          >
            <FeedbackSlot place="list" collapse={skin.spacing.section} />
            {sections.map((section) => (
              <View key={section.id} style={styles.section}>
                <View style={styles.sectionHead}>
                  <CText size={skin.type.label} color={C.textSoft} accessibilityRole="header">
                    {section.label}
                  </CText>
                  {section.id === OTHER_AISLE && aisles.canManage && !selecting && (
                    <CButton
                      small
                      variant="text"
                      label={T.shop.manageAisles}
                      accessibilityLabel={T.shop.manageAislesAria}
                      onPress={aisles.open}
                    />
                  )}
                </View>
                <View style={styles.tags}>
                  {section.foods.map((food) => {
                    const picked = run.selected.includes(food.id);
                    const level = levelOf(food.inStockScore);
                    return (
                      <Press
                        key={food.id}
                        accessibilityRole="button"
                        accessibilityLabel={`${food.name}, ${skin.copy.levels[level]}`}
                        accessibilityState={{ selected: picked }}
                        onPress={() => run.toggleSelect(food)}
                        onLongPress={() => setEditing(food)}
                        accessibilityHint={T.shop.holdToEdit}
                        style={withPressed([styles.tag, picked && styles.tagPicked])}
                      >
                        <Dot color={picked ? C.onFill : skin.colors.levels[level]} />
                        <CText
                          size={skin.type.body}
                          weight={picked ? "semibold" : "regular"}
                          color={picked ? C.onFill : C.text}
                          numberOfLines={1}
                        >
                          {food.name}
                        </CText>
                      </Press>
                    );
                  })}
                </View>
              </View>
            ))}
            <DockSpacer />
          </Animated.ScrollView>
        </View>
      </Screen>
      <ShopPanels run={run} />
      <AisleManager manager={aisles} />
      <EditFoodPanel food={editing} onClose={() => setEditing(null)} />
    </View>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    list: { paddingBottom: s.spacing.stack, paddingHorizontal: s.spacing.gutter },
    head: { gap: s.spacing.inline, paddingBottom: s.spacing.section },
    titleRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
    sections: { gap: s.spacing.section },
    section: { gap: s.spacing.small },
    sectionHead: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      minHeight: s.size.button.xs,
    },
    tags: { flexDirection: "row", flexWrap: "wrap", gap: s.spacing.small },
    tag: {
      alignItems: "center",
      borderColor: C.fieldLine,
      borderRadius: s.size.toggle / 2,
      borderWidth: s.shape.border,
      flexDirection: "row",
      gap: s.spacing.small,
      paddingHorizontal: s.spacing.inline + 2,
      paddingVertical: s.spacing.small,
    },
    tagPicked: { backgroundColor: C.fill, borderColor: C.fill },
  });

export default ShopPreview;
