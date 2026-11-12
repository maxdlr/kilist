import Press from "@/components/elements/Press";
import FoodPicture from "@/components/elements/FoodIcon/FoodPicture";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import FoodPanels from "@/components/views/Inventory/_components/FoodPanels";
import useInventoryShelf from "@/hooks/screens/useInventoryShelf";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { router } from "expo-router";
import { FlatList, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { arcadePalette as P } from "..";
import Ground from "./Ground";
import { shadowOf } from "./parts";
import { ArcadeLoading } from "./States";
import { arcadeText as T } from "./text";

const PER_SHELF = 3;
const TURNS = ["-2deg", "1.5deg", "-1deg", "2deg", "-1.5deg", "1deg"];

const Plank = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return <View style={[styles.plank, { boxShadow: shadowOf(skin, 0, P.plankShadow) }]} />;
};

const Tile = ({
  food,
  turn,
  selecting,
  selected,
  onPress,
}: {
  food: FoodType;
  turn: string;
  selecting: boolean;
  selected: boolean;
  onPress: () => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const level = levelOf(food.inStockScore);
  const label = skin.copy.levels[level];

  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={`${food.name}, ${label}`}
      accessibilityState={selecting ? { selected } : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: skin.colors.levels[level],
          boxShadow: shadowOf(skin, pressed ? -4 : -1),
          transform: [{ rotateZ: turn }, { translateY: pressed ? 3 : 0 }],
        },
      ]}
    >
      {food.icon || food.imageUrl ? (
        <FoodPicture food={food} size={skin.size.button.sm} />
      ) : (
        <View style={styles.initial}>
          <ThemedText size={skin.type.lead} color={P.navy}>
            {food.name.charAt(0)}
          </ThemedText>
        </View>
      )}
      <ThemedText numberOfLines={1} size={skin.type.caption} color={P.navy}>
        {food.name}
      </ThemedText>
      <ThemedText numberOfLines={1} size={skin.type.caption - 4} color={P.navy}>
        {label}
      </ThemedText>
      {selecting && (
        <View style={[styles.check, selected && { backgroundColor: P.navy }]}>
          {selected && (
            <Svg width={skin.spacing.stack} height={skin.spacing.stack} viewBox="0 0 24 24" fill="none">
              <Path d="M5 12l4 4 10-10" stroke={P.white} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          )}
        </View>
      )}
    </Press>
  );
};

const ArcadeInventory = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const shelf = useInventoryShelf();
  const { foods, query, isEmpty, noResults, isSelectMode, selectedIds } = shelf;

  if (shelf.isLoading) return <ArcadeLoading />;

  const shelves: FoodType[][] = [];
  (foods ?? []).forEach((food, index) => {
    if (index % PER_SHELF === 0) shelves.push([]);
    shelves[shelves.length - 1]!.push(food);
  });

  const count = foods?.length ?? 0;
  const half = { flex: 1, height: skin.size.button.md, fontSize: skin.type.body };

  const actions = isSelectMode ? (
    <>
      <KilButton {...half} variant="secondary" label={skin.copy.common.cancel} onTouch={shelf.exitSelectMode} />
      <KilButton {...half} label={T.removeCount(selectedIds.length)} onTouch={shelf.removeSelected} />
    </>
  ) : noResults ? (
    <>
      <KilButton {...half} variant="secondary" label={T.clearSearch} onTouch={() => shelf.setSearch("")} />
      <KilButton {...half} label={T.addQuery(query)} onTouch={() => shelf.openAdd(shelf.search.trim())} />
    </>
  ) : isEmpty ? (
    <>
      <KilButton {...half} variant="secondary" label={skin.copy.inventory.addOwn} onTouch={() => shelf.openAdd()} />
      <KilButton {...half} label={T.suggested} onTouch={() => router.push("/onboarding")} />
    </>
  ) : (
    <>
      <KilButton {...half} variant="secondary" label={skin.copy.inventory.select} onTouch={shelf.startSelect} />
      <KilButton {...half} label={skin.copy.inventory.add} onTouch={() => shelf.openAdd()} />
    </>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <Ground
        padded={false}
        dock={
          <>
            {!isEmpty && !isSelectMode && (
              <FormInput
                accessibilityLabel={T.searchShelf}
                placeholder={T.searchShelf}
                value={shelf.search}
                onChangeText={shelf.setSearch}
              />
            )}
            <View style={styles.actions}>{actions}</View>
          </>
        }
      >
        <View style={styles.titleRow}>
          <Title size={skin.type.display.sm} lines={1} color={P.white} style={styles.flex}>
            {T.shelf}
          </Title>
          <ThemedText size={skin.type.label} color={P.lilac}>
            {T.foodCount(count)}
          </ThemedText>
        </View>

        {noResults ? (
          <View style={styles.message}>
            <Plank />
            <Title size={skin.type.title} lines={3} color={P.white} textStyle={styles.center}>
              {T.notOnShelf(query)}
            </Title>
            <ThemedText size={skin.type.label} color={P.white} style={styles.center}>
              {T.notOnShelfLine}
            </ThemedText>
          </View>
        ) : isEmpty ? (
          <View style={styles.message}>
            <Plank />
            <Plank />
            <Plank />
            <Title size={skin.type.title} lines={2} color={P.white} textStyle={styles.center}>
              {T.emptyShelf}
            </Title>
            <ThemedText size={skin.type.label} color={P.white} style={styles.center}>
              {T.emptyShelfLine}
            </ThemedText>
          </View>
        ) : (
          <FlatList
            style={styles.flex}
            contentContainerStyle={styles.shelves}
            data={shelves}
            keyExtractor={(row) => String(row[0]!.id)}
            onRefresh={shelf.mutateFood}
            refreshing={shelf.isFoodLoading}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: row, index: rowIndex }) => (
              <View>
                <View style={styles.row}>
                  {row.map((food, index) => (
                    <View key={food.id} style={styles.slot}>
                      <Tile
                        food={food}
                        turn={TURNS[(rowIndex * PER_SHELF + index) % TURNS.length]!}
                        selecting={isSelectMode}
                        selected={selectedIds.includes(food.id)}
                        onPress={() =>
                          isSelectMode ? shelf.toggleSelect(food.id) : shelf.openEdit(food)
                        }
                      />
                    </View>
                  ))}
                  {Array.from({ length: PER_SHELF - row.length }, (_, index) => (
                    <View key={`gap-${index}`} style={styles.slot} />
                  ))}
                </View>
                <Plank />
              </View>
            )}
          />
        )}
      </Ground>
      <FoodPanels shelf={shelf} />
    </KeyboardAvoidingView>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: {
      flex: 1,
      minWidth: 0,
    },
    center: {
      textAlign: "center",
    },
    titleRow: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: s.spacing.inline,
      paddingHorizontal: s.spacing.section,
    },
    shelves: {
      gap: s.spacing.gutter,
      paddingBottom: s.spacing.inline,
      paddingHorizontal: s.spacing.section,
      paddingTop: s.spacing.tight,
    },
    row: {
      flexDirection: "row",
      gap: s.spacing.inline,
      paddingHorizontal: s.spacing.tight + 2,
    },
    slot: {
      flex: 1,
    },
    tile: {
      alignItems: "center",
      borderColor: P.navy,
      borderRadius: s.shape.radius - 2,
      borderWidth: s.shape.border,
      gap: s.spacing.hair,
      height: s.size.icon.card - s.spacing.gutter - s.spacing.small - 6,
      justifyContent: "flex-end",
      paddingHorizontal: s.spacing.tight + 2,
      paddingVertical: s.spacing.small,
    },
    initial: {
      alignItems: "center",
      backgroundColor: P.white,
      borderColor: P.navy,
      borderRadius: s.size.button.sm,
      borderWidth: s.shape.border,
      height: s.size.button.sm - 2,
      justifyContent: "center",
      width: s.size.button.sm - 2,
    },
    check: {
      alignItems: "center",
      backgroundColor: P.white,
      borderColor: P.navy,
      borderRadius: s.size.check,
      borderWidth: s.shape.border,
      height: s.size.check + 2,
      justifyContent: "center",
      position: "absolute",
      right: -s.spacing.small - 1,
      top: -s.spacing.small - 1,
      width: s.size.check + 2,
    },
    plank: {
      backgroundColor: P.plank,
      borderColor: P.navy,
      borderRadius: s.spacing.small,
      borderWidth: s.shape.border,
      height: s.spacing.inline,
      marginTop: s.spacing.small,
    },
    message: {
      flex: 1,
      gap: s.spacing.section,
      justifyContent: "center",
      paddingHorizontal: s.spacing.section,
    },
    actions: {
      flexDirection: "row",
      gap: s.spacing.inline,
    },
  });

export default ArcadeInventory;
