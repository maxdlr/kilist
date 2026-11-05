import KilButton from "@/components/elements/KilButton";
import LoadingAnim from "@/components/elements/LoadingAnim/LoadingAnim";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import useAxios from "@/hooks/useAxios";
import useToast from "@/providers/ToastProvider";
import { FoodBankItemType, ListType } from "@/types/model";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import useSWR from "swr";
import ManualAddForm from "./_components/ManualAddForm";
import OnboardingSwipeCard from "./_components/OnboardingSwipeCard";

/**
 * Post-signup onboarding: swipe through food-bank suggestions (right = add to
 * the main list, left = skip), then once the deck is empty, auto-advance to a
 * manual add form. Finishing hands off to the provided onDone callback.
 */
const Onboarding = ({ onDone }: { onDone: () => void }) => {
  const theme = useTheme();
  const { showToast } = useToast();

  const { data: mainList, isLoading: isListLoading } = useSWR<ListType>({
    url: "lists/read?main=true",
  });
  const { data: bank, isLoading } = useSWR<FoodBankItemType[]>({
    url: "/food-bank/browse",
  });

  const { postData: postCreateFood } = useAxios("foods/create");

  // Track which bank items have been swiped away so the deck shrinks locally
  // without refetching after every swipe.
  const [swipedNames, setSwipedNames] = useState<Set<string>>(new Set());

  const remaining = useMemo(
    () => (bank ?? []).filter((item) => !swipedNames.has(item.name)),
    [bank, swipedNames],
  );

  const addFood = async (data: { name: string; description?: string }) => {
    if (!mainList?.id) {
      showToast("Your list isn't ready yet, try again in a moment");
      return false;
    }
    const res = await postCreateFood({
      ...data,
      listId: mainList.id,
      fromOnboarding: true,
    });
    if (res.error) {
      showToast(res.error.message || "Couldn't add that item");
      return false;
    }
    return true;
  };

  const handleSwipe = async (
    item: FoodBankItemType,
    direction: "left" | "right",
  ) => {
    setSwipedNames((prev) => new Set(prev).add(item.name));

    if (direction !== "right") return;

    const added = await addFood({
      name: item.name,
      description: item.description,
    });
    if (!added) {
      setSwipedNames((prev) => {
        const next = new Set(prev);
        next.delete(item.name);
        return next;
      });
    }
  };

  if (isLoading || isListLoading) {
    return (
      <View style={styles.centered}>
        <LoadingAnim colorScale={theme.confirm} />
      </View>
    );
  }

  const inSwipePhase = remaining.length > 0;

  return (
    <ThemedView style={styles.container}>
      {inSwipePhase ? (
        <>
          <ThemedText type="subtitle" style={styles.heading}>
            Stock your list
          </ThemedText>
          <ThemedText type="small" style={styles.heading}>
            Swipe right to add, left to skip.
          </ThemedText>

          <View style={styles.deck}>
            {/* Render only the top few cards, topmost last so it sits on top. */}
            {remaining
              .slice(0, 3)
              .map((item, index) => ({ item, index }))
              .reverse()
              .map(({ item, index }) => (
                <OnboardingSwipeCard
                  key={item.name}
                  item={item}
                  index={index}
                  onSwipe={handleSwipe}
                />
              ))}
          </View>

          <KilButton label="Skip to adding my own" onTouch={() => setSwipedNames(new Set((bank ?? []).map((b) => b.name)))} />
        </>
      ) : (
        <ManualAddForm onAdd={addFood} onFinish={onDone} />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
    paddingVertical: Spacing.five,
    gap: Spacing.three,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    textAlign: "center",
    paddingHorizontal: Spacing.four,
  },
  deck: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Onboarding;
