import common from "@/i18n/common";
import type { Skin } from "@/skins/types";
import AnimatedListItem from "@/components/elements/AnimatedListItem";
import Dock from "@/components/elements/Dock/Dock";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import LoadingAnim from "@/components/elements/LoadingAnim/LoadingAnim";
import Sheet from "@/components/elements/Sheet/Sheet";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import useFoodShelf from "@/hooks/screens/useFoodShelf";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { FoodType } from "@/types/model";
import { StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FoodPanels from "./_components/FoodPanels";
import FoodRow from "./_components/FoodRow";

const FoodList = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.list;
  const insets = useSafeAreaInsets();
  const shelf = useFoodShelf();
  const {
    foods,
    isFoodLoading,
    mutateFood,
    search,
    setSearch,
    isSelectMode,
    selectedIds,
    toggleSelect,
    exitSelectMode,
    openAdd,
    query,
    isEmpty,
    noResults,
  } = shelf;

  useStatusBarStyle(
    foods?.length || search.trim() ? skin.statusBarOnGround : "dark",
  );

  if (shelf.isLoading) {
    return <LoadingAnim />;
  }

  const panels = <FoodPanels shelf={shelf} />;

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
        onEdit={shelf.openEdit}
      />
    </AnimatedListItem>
  );

  const searchField = (
    <FormInput
      accessibilityLabel={common.searchFoods}
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
              onTouch={shelf.removeSelected}
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
                  onTouch={shelf.startSelect}
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
