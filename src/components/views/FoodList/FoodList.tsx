import type { Skin } from "@/skins/types";
import ActionPanel, {
  ActionPanelRequest,
} from "@/components/elements/ActionPanel";
import AnimatedListItem from "@/components/elements/AnimatedListItem";
import Dock from "@/components/elements/Dock/Dock";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import LoadingAnim from "@/components/elements/LoadingAnim/LoadingAnim";
import Sheet from "@/components/elements/Sheet/Sheet";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import useFoodList from "@/providers/FoodListProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { caseFor } from "@/skins";
import { FoodType } from "@/types/model";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FoodFormModal from "./_components/FoodFormModal";
import FoodRow from "./_components/FoodRow";

const FoodList = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.list;
  const insets = useSafeAreaInsets();
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isAddVisible, setIsAddVisible] = useState(false);
  const [addInitialName, setAddInitialName] = useState("");
  const [editingFood, setEditingFood] = useState<FoodType | null>(null);
  const [actionRequest, setActionRequest] = useState<ActionPanelRequest | null>(
    null,
  );

  const {
    foods,
    isFoodLoading,
    mutateFood,
    search,
    setSearch,
    createFood,
    editFood,
    removeFoodsFromList,
  } = useFoodList();

  useStatusBarStyle(
    foods?.length || search.trim() ? skin.statusBarOnGround : "dark",
  );

  useFocusEffect(
    useCallback(() => {
      mutateFood();
    }, [mutateFood]),
  );

  const toggleSelect = (foodId: number) => {
    setSelectedIds((prev) =>
      prev.includes(foodId)
        ? prev.filter((id) => id !== foodId)
        : [...prev, foodId],
    );
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds([]);
  };

  const closeActionPanel = useCallback(() => setActionRequest(null), []);
  const closeAdd = useCallback(() => setIsAddVisible(false), []);
  const closeEdit = useCallback(() => setEditingFood(null), []);

  const openAdd = (initialName = "") => {
    setEditingFood(null);
    setAddInitialName(initialName);
    setIsAddVisible(true);
  };

  const askRemove = (ids: number[], title: string) => {
    setActionRequest({
      title,
      message: copy.removeLine,
      cancelLabel: skin.copy.common.keep,
      actions: [
        {
          label: skin.copy.common.remove,
          destructive: true,
          onPress: async () => {
            await removeFoodsFromList(ids);
            exitSelectMode();
          },
        },
      ],
    });
  };

  const handleRemoveEditing = () => {
    if (!editingFood) return;
    const food = editingFood;
    setEditingFood(null);
    askRemove([food.id], copy.removeOne(caseFor(skin, food.name)));
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    askRemove(selectedIds, copy.removeMany(selectedIds.length));
  };

  if (isFoodLoading && foods === undefined) {
    return <LoadingAnim />;
  }

  const query = caseFor(skin, search.trim());
  const hasFoods = Boolean(foods?.length);
  const isEmpty = !hasFoods && !query;
  const noResults = !hasFoods && Boolean(query);

  const panels = (
    <>
      <ActionPanel request={actionRequest} onClose={closeActionPanel} />

      <FoodFormModal
        visible={isAddVisible}
        formKey={`add-${addInitialName}`}
        title={copy.addTitle}
        initialName={addInitialName}
        onSubmit={createFood}
        onClose={closeAdd}
      />

      <FoodFormModal
        visible={editingFood !== null}
        formKey={editingFood?.id}
        title={copy.editTitle(editingFood ? caseFor(skin, editingFood.name) : "")}
        initialName={editingFood?.name}
        initialDescription={editingFood?.description}
        onSubmit={async (data) => {
          if (!editingFood) return false;
          return editFood(editingFood.id, data);
        }}
        onRemove={handleRemoveEditing}
        onClose={closeEdit}
      />
    </>
  );

  if (isEmpty) {
    return (
      <KeyboardAvoidingView style={styles.flex} behavior="height">
        <Sheet
          fill={skin.colors.accent}
          dock={
            <Dock>
              <KilButton
                fontSize={skin.type.title}
                label={copy.addSuggested}
                href="/onboarding"
              />
              <KilButton
                variant="secondary"
                height={skin.size.button.md}
                fontSize={skin.type.lead}
                label={copy.addOwn}
                onTouch={() => openAdd()}
              />
            </Dock>
          }
        >
          <ThemedText size={skin.type.body}>{copy.emptyLabel}</ThemedText>
          <Title size={skin.type.display.lg}>{copy.emptyTitle}</Title>
          <ThemedText size={skin.type.body}> </ThemedText>
        </Sheet>
        {panels}
      </KeyboardAvoidingView>
    );
  }

  const renderItem = ({ item }: { item: FoodType }) => (
    <AnimatedListItem key={item.id}>
      <FoodRow
        food={item}
        isSelectMode={isSelectMode}
        isSelected={selectedIds.includes(item.id)}
        onToggleSelect={toggleSelect}
        onEdit={setEditingFood}
      />
    </AnimatedListItem>
  );

  const searchField = (
    <FormInput
      accessibilityLabel="Search your foods"
      placeholder={copy.search}
      value={search}
      onChangeText={setSearch}
    />
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="height">
      <View style={[styles.root, { backgroundColor: skin.colors.ground }]}>
        <View style={[styles.header, { paddingTop: insets.top + skin.spacing.top }]}>
          <Title size={skin.type.display.sm} lines={1} color={skin.colors.onGround}>
            {copy.title}
          </Title>
        </View>

        {noResults ? (
          <View
            style={[styles.noResults, { backgroundColor: skin.colors.alert }]}
          >
            <Title size={skin.type.display.md} lines={4} color={skin.colors.onAlert}>
              {copy.noResults(query)}
            </Title>
          </View>
        ) : (
          <Animated.FlatList
            style={styles.flex}
            data={foods}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            onRefresh={mutateFood}
            refreshing={isFoodLoading}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {isSelectMode ? (
          <Dock row>
            <KilButton
              flex={1}
              height={skin.size.button.md}
              fontSize={skin.type.lead}
              variant="secondary"
              label={skin.copy.common.cancel}
              onTouch={exitSelectMode}
            />
            <KilButton
              flex={1}
              height={skin.size.button.md}
              fontSize={skin.type.lead}
              variant="danger"
              label={copy.deleteSelected(selectedIds.length)}
              onTouch={handleDeleteSelected}
            />
          </Dock>
        ) : (
          <Dock>
            {searchField}
            {noResults ? (
              <KilButton
                height={skin.size.button.md}
                label={copy.addQuery}
                onTouch={() => openAdd(search.trim())}
              />
            ) : (
              <View style={styles.actions}>
                <KilButton
                  flex={1}
                  height={skin.size.button.md}
                  fontSize={skin.type.lead}
                  variant="secondary"
                  label={copy.select}
                  onTouch={() => setIsSelectMode(true)}
                />
                <KilButton
                  flex={1}
                  height={skin.size.button.md}
                  fontSize={skin.type.lead}
                  label={copy.add}
                  onTouch={() => openAdd()}
                />
              </View>
            )}
          </Dock>
        )}
      </View>

      {panels}
    </KeyboardAvoidingView>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    root: {
      flex: 1,
    },
    header: {
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.gutter,
    },
    noResults: {
      flex: 1,
      justifyContent: "center",
      padding: s.spacing.gutter,
    },
    actions: {
      flexDirection: "row",
      gap: s.spacing.inline,
    },
  });

export default FoodList;
