import common from "@/i18n/common";
import type { Skin } from "@/skins/types";
import Dock from "@/components/elements/Dock/Dock";
import FoodIcon from "@/components/elements/FoodIcon";
import KilButton from "@/components/elements/KilButton";
import LoadingAnim from "@/components/elements/LoadingAnim/LoadingAnim";
import SwipeDeck, {
  deckButtonColors,
  SwipeDeckFling,
  SwipeDirection,
} from "@/components/elements/SwipeDeck/SwipeDeck";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import useAxios from "@/hooks/useAxios";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { caseFor } from "@/skins";
import useToast from "@/providers/ToastProvider";
import { FoodBankItemType, ListType } from "@/types/model";
import { useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useSWR from "swr";
import Intro from "./_components/Intro";
import ManualAddForm from "./_components/ManualAddForm";

const pad = (value: number) => String(value).padStart(2, "0");

const Onboarding = ({ onDone, intro = false }: { onDone: () => void; intro?: boolean }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.onboarding;
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const flingRef = useRef<SwipeDeckFling | null>(null);
  const [intent, setIntent] = useState<SwipeDirection | null>(null);
  const [showIntro, setShowIntro] = useState(intro);

  const { data: mainList, isLoading: isListLoading } = useSWR<ListType>({
    url: "lists/read?main=true",
  });
  const { data: bank, isLoading } = useSWR<FoodBankItemType[]>({
    url: "/food-bank/browse",
  });

  const { postData: postCreateFood } = useAxios("foods/create");

  const [swipedNames, setSwipedNames] = useState<Set<string>>(new Set());

  const remaining = useMemo(
    () => (bank ?? []).filter((item) => !swipedNames.has(item.name)),
    [bank, swipedNames],
  );

  const sheets = skin.colors.sheets;
  const total = bank?.length ?? 0;
  const position = total - remaining.length;
  useStatusBarStyle(
    remaining.length > 0 &&
      sheets[position % sheets.length]!.fill === skin.colors.ground
      ? skin.statusBarOnGround
      : "dark",
  );

  const addFood = async (data: { name: string; description?: string }) => {
    if (!mainList?.id) {
      showToast(common.inventoryNotReady);
      return false;
    }
    const res = await postCreateFood({
      ...data,
      listId: mainList.id,
      fromOnboarding: true,
    });
    if (res.error) {
      showToast(res.error.message || common.addFailed);
      return false;
    }
    return true;
  };

  const handleSwipe = async (
    item: FoodBankItemType,
    direction: SwipeDirection,
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

  if (showIntro) {
    return <Intro onDone={() => setShowIntro(false)} />;
  }

  if (isLoading || isListLoading) {
    return <LoadingAnim />;
  }

  if (remaining.length === 0) {
    return <ManualAddForm onAdd={addFood} onFinish={onDone} />;
  }

  return (
    <View style={styles.flex}>
      <SwipeDeck
        items={remaining}
        keyOf={(item) => item.name}
        stamps={{ right: copy.stampAdd, left: copy.stampSkip }}
        flingRef={flingRef}
        onIntent={setIntent}
        onSwipe={handleSwipe}
        renderSheet={(item, depth) => {
          const sheetPosition = position + depth;
          const { fill, ink } = sheets[sheetPosition % sheets.length]!;

          return (
            <View
              style={[
                styles.sheet,
                { backgroundColor: fill, paddingTop: insets.top + skin.spacing.top },
              ]}
            >
              <ThemedText size={skin.type.body} color={ink}>
                {copy.meta(pad(sheetPosition + 1), pad(total))}
              </ThemedText>
              <View style={styles.body}>
                <FoodIcon name={item.icon} size={skin.size.icon.card} />
                <Title size={skin.type.display.lg} lines={1} color={ink}>
                  {caseFor(skin, item.name)}
                </Title>
                <Title size={skin.type.lead} lines={3} color={ink} header={false}>
                  {copy.taunts[sheetPosition % copy.taunts.length]!}
                </Title>
              </View>
            </View>
          );
        }}
      />

      <Dock>
        <View style={styles.buttons}>
          <KilButton
            flex={1}
            height={skin.size.button.lg}
            label={copy.skip}
            accessibilityLabel={common.skipFood}
            colors={deckButtonColors(skin, intent, "left")}
            onTouch={() => flingRef.current?.("left")}
          />
          <KilButton
            flex={1}
            height={skin.size.button.lg}
            label={copy.add}
            accessibilityLabel={common.addFood}
            colors={deckButtonColors(skin, intent, "right")}
            onTouch={() => flingRef.current?.("right")}
          />
        </View>
        <KilButton
          variant="ghost"
          height={skin.size.button.xs}
          fontSize={skin.type.label}
          label={copy.skipAll}
          onTouch={() =>
            setSwipedNames(new Set((bank ?? []).map((b) => b.name)))
          }
        />
      </Dock>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    sheet: {
      flex: 1,
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.gutter,
    },
    body: {
      flex: 1,
      gap: s.spacing.inline,
      justifyContent: "center",
      alignItems: "center",
    },
    buttons: {
      flexDirection: "row",
      gap: s.spacing.inline,
    },
  });

export default Onboarding;
