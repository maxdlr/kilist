import Press from "@/components/elements/Press";
import withPressed from "@/utils/withPressed";
import T from "@/skins/calm/text";
import { getLang } from "@/i18n";
import common from "@/i18n/common";
import { getCatalog, refreshCatalog } from "@/offline/catalog";
import { starterFoods } from "@/offline/domain";
import { foodKey } from "@/offline/foodNames";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import useToast from "@/providers/ToastProvider";
import axios from "@/services/axios";
import type { Skin } from "@/skins/types";
import { FoodBankItemType, FoodType } from "@/types/model";
import { useEffect, useState } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { useSWRConfig } from "swr";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CButton, CText, GlassScrollView, Screen } from "@/skins/calm/components";
import { XmarkIcon } from "@/components/icons";
import { Sample, StepNav } from "./shared";
import StepBar from "./StepBar";
import TopBar from "./TopBar";

type QuestionId =
  | "diet"
  | "avoid"
  | "drinks"
  | "home"
  | "kids"
  | "baking"
  | "extras";

const QUESTIONS: { id: QuestionId; single?: boolean; options: string[] }[] = [
  {
    id: "diet",
    single: true,
    options: ["everything", "noPork", "noMeat", "veggie"],
  },
  { id: "avoid", options: [] },
  {
    id: "drinks",
    options: ["coffee", "tea", "soda", "beer", "wine", "spirits"],
  },
  {
    id: "home",
    options: ["cat", "dog", "bird", "rabbit", "rodent", "aquarium"],
  },
  { id: "kids", single: true, options: ["yes", "no"] },
  { id: "baking", single: true, options: ["yes", "no"] },
  { id: "extras", options: ["bathroom", "cleaning", "dishwasher"] },
];

const ALCOHOL = ["beer", "wine", "spirits"];

const DIETS: Record<string, string[]> = {
  everything: [],
  noPork: ["pork"],
  noMeat: ["meat", "pork"],
  veggie: ["meat", "pork", "fish", "shellfish"],
};

const profilesFrom = (picked: Record<QuestionId, string[]>) => [
  ...new Set([
    ...(DIETS[picked.diet[0] ?? "everything"] ?? []),
    ...picked.avoid,
    ...(picked.drinks.includes("soda") ? [] : ["soda"]),
    ...(ALCOHOL.some((drink) => picked.drinks.includes(drink))
      ? []
      : ["alcohol"]),
    ...picked.drinks.filter((drink) => drink !== "soda"),
    ...picked.home,
    ...(picked.kids[0] === "yes" ? ["kids"] : []),
    ...(picked.baking[0] === "yes" ? ["baking"] : []),
    ...picked.extras,
  ]),
];

const ProfilePick = ({
  listId,
  owned,
  onDone,
  onBack,
  onExit,
}: StepNav & {
  listId?: number;
  owned?: FoodType[];
  onDone: (added: Sample[]) => void;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const copy = T.tutorial;
  const { showToast } = useToast();
  const [catalog, setCatalog] = useState(getCatalog());
  const { mutate } = useSWRConfig();
  const refine = owned !== undefined;
  const [at, setAt] = useState(refine ? QUESTIONS.length : 0);
  const [picked, setPicked] = useState<Record<QuestionId, string[]>>({
    diet: ["everything"],
    avoid: [],
    drinks: [],
    home: [],
    kids: [],
    baking: [],
    extras: [],
  });
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const pager = useAnimatedRef<Animated.ScrollView>();
  const filled = useSharedValue(0);
  const { width } = useWindowDimensions();

  useEffect(() => {
    let active = true;
    refreshCatalog(axios).then(() => {
      if (active) setCatalog(getCatalog());
    });
    return () => {
      active = false;
    };
  }, []);

  const profiles = catalog?.profiles ?? [];
  const bank: FoodBankItemType[] = catalog?.foodBanks[getLang()] ?? [];
  const chosen = profilesFrom(picked);
  const ownedByKey = new Map(
    (owned ?? []).map((food) => [foodKey(food.name), food]),
  );
  const ownedOf = (item: FoodBankItemType) =>
    ownedByKey.get(foodKey(item.name));
  const suggested = new Set(
    (refine
      ? bank.filter(ownedOf)
      : profiles.length > 0
        ? starterFoods(bank, chosen)
        : []
    ).map((item) => item.name),
  );
  const isOn = (item: FoodBankItemType) =>
    overrides[item.name] ?? suggested.has(item.name);
  const selected = bank.filter(isOn);
  const toAdd = selected.filter((item) => !ownedOf(item));
  const toRemove = bank
    .filter((item) => !isOn(item))
    .flatMap((item) => ownedOf(item) ?? []);
  const online = profiles.length > 0;
  const pages = refine
    ? [QUESTIONS.length]
    : online
      ? [...QUESTIONS.keys(), QUESTIONS.length]
      : [0];
  const page = Math.max(0, pages.indexOf(at));
  const isLast = page === pages.length - 1;
  const canBack = page > 0 && !busy;
  const paged = pages.length > 1;
  const exitInTitle = !paged && !onBack && Boolean(onExit);

  useEffect(() => {
    filled.set((page + 1) / pages.length);
  }, [filled, page, pages.length]);

  const onPagerScroll = useAnimatedScrollHandler(
    (event) => {
      filled.set((event.contentOffset.x / width + 1) / pages.length);
    },
    [width, pages.length],
  );

  const questionAt = (index: number) => {
    const asked = QUESTIONS[Math.min(index, QUESTIONS.length - 1)]!;
    return asked.id === "avoid"
      ? {
          ...asked,
          options: profiles
            .filter((profile) => profile.ask === "avoid")
            .map((profile) => profile.id),
        }
      : asked;
  };

  const goTo = (target: number) => {
    const next = Math.max(0, Math.min(pages.length - 1, target));
    pager.current?.scrollTo({ x: width * next, animated: true });
    setAt(pages[next]!);
  };

  const onPageEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    const target = pages[Math.max(0, Math.min(pages.length - 1, next))]!;
    if (target !== at) setAt(target);
  };

  const pick = (
    questionId: QuestionId,
    single: boolean | undefined,
    id: string,
  ) =>
    setPicked((all) => {
      const current = all[questionId];
      const next = single
        ? [id]
        : current.includes(id)
          ? current.filter((entry) => entry !== id)
          : [...current, id];
      return { ...all, [questionId]: next };
    });

  const finish = async () => {
    if (busy) return;
    if (profiles.length === 0 || !listId) return onDone([]);
    setBusy(true);
    try {
      if (!refine) await axios.put("households/profiles", { profiles: chosen });
      for (const item of toAdd) {
        await axios.post("foods/create", {
          name: item.name,
          icon: item.icon,
          listId,
          fromOnboarding: true,
        });
      }
      if (toRemove.length > 0) {
        await axios.put(`lists/${listId}/remove-foods`, {
          foodIds: toRemove.map((food) => food.id),
        });
      }
      if (refine) await mutate(() => true);
      onDone(selected);
    } catch {
      showToast(common.addFailed);
      setBusy(false);
    }
  };

  const renderPage = (index: number) => {
    const reviewing = online && index === QUESTIONS.length;
    const question = questionAt(index);
    const text = copy.questions[question.id];

    return (
      <GlassScrollView
        key={index}
        style={{ width }}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.head}>
          <View style={styles.titleRow}>
            <CText
              weight="medium"
              size={skin.type.display.md}
              accessibilityRole="header"
              style={styles.title}
            >
              {refine
                ? copy.refineTitle
                : reviewing
                  ? copy.reviewTitle
                  : online
                    ? text.title
                    : copy.profileTitle}
            </CText>
            {exitInTitle && (
              <Press
                accessibilityRole="button"
                accessibilityLabel={T.close}
                hitSlop={skin.spacing.small}
                onPress={onExit}
                style={withPressed(styles.exit)}
              >
                <XmarkIcon size={skin.size.icon.action} color={C.textSoft} strokeWidth={1.8} />
              </Press>
            )}
          </View>
          <CText size={skin.type.body} color={C.textSoft}>
            {refine && reviewing
              ? copy.refineLine
              : reviewing
                ? copy.reviewLine
                : online
                  ? text.line
                  : copy.profileLine}
          </CText>
        </View>
        {reviewing && (
          <View style={styles.chips}>
            {bank.map((item) => {
              const on = isOn(item);
              return (
                <Press
                  key={item.name}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  disabled={busy}
                  onPress={() =>
                    setOverrides((all) => ({ ...all, [item.name]: !on }))
                  }
                  style={withPressed([styles.chip, on && styles.optionOn])}
                >
                  <CText
                    weight="medium"
                    size={skin.type.body}
                    color={on ? C.onFill : C.text}
                  >
                    {item.name}
                  </CText>
                </Press>
              );
            })}
          </View>
        )}
        {online && !reviewing && (
          <View style={styles.options}>
            {question.options.map((id) => {
              const on = picked[question.id].includes(id);
              return (
                <Press
                  key={id}
                  accessibilityRole={question.single ? "radio" : "checkbox"}
                  accessibilityState={{ checked: on }}
                  onPress={() => pick(question.id, question.single, id)}
                  style={withPressed([styles.option, on && styles.optionOn])}
                >
                  <CText
                    weight="medium"
                    size={skin.type.body}
                    color={on ? C.onFill : C.text}
                  >
                    {copy.answers[id] ?? id}
                  </CText>
                </Press>
              );
            })}
          </View>
        )}
      </GlassScrollView>
    );
  };

  return (
    <Screen
      padded={false}
      glass
      dock={
        <>
          {isLast && (
            <CText
              size={skin.type.label + 1}
              color={C.text}
              style={[styles.center, styles.full, styles.dockNote]}
            >
              {profiles.length === 0
                ? copy.profileOffline
                : refine
                  ? copy.refineCount(toAdd.length, toRemove.length)
                  : copy.profileCount(selected.length)}
            </CText>
          )}
          <CButton
            label={
              !isLast
                ? copy.questionNext
                : busy
                  ? copy.profileAdding
                  : copy.profileDone
            }
            onPress={isLast ? finish : () => goTo(page + 1)}
          />
        </>
      }
    >
      {!exitInTitle && (paged || onBack || onExit) && (
        <View style={styles.barRow}>
          <TopBar onBack={canBack ? () => goTo(page - 1) : busy ? undefined : onBack} onExit={onExit}>
            {paged && (
              <StepBar
                progress={filled}
                label={copy.questionAt(
                  Math.min(page + 1, QUESTIONS.length),
                  QUESTIONS.length,
                )}
                now={page + 1}
                max={pages.length}
              />
            )}
          </TopBar>
        </View>
      )}
      <Animated.ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        scrollEnabled={!busy && paged}
        showsHorizontalScrollIndicator={false}
        onScroll={onPagerScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onPageEnd}
        style={styles.flex}
      >
        {pages.map(renderPage)}
      </Animated.ScrollView>
    </Screen>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    center: { textAlign: "center" },
    scroll: {
      gap: s.spacing.section + 4,
      paddingBottom: s.spacing.stack,
      paddingHorizontal: s.spacing.gutter,
    },
    head: { gap: s.spacing.small },
    options: { gap: s.spacing.small + 2 },
    option: {
      borderColor: C.fieldLine,
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      justifyContent: "center",
      minHeight: s.size.button.lg,
      paddingHorizontal: s.spacing.stack,
    },
    optionOn: { backgroundColor: C.fill, borderColor: C.fill },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: s.spacing.small },
    chip: {
      borderColor: C.fieldLine,
      borderRadius: s.size.toggle / 2,
      borderWidth: s.shape.border,
      justifyContent: "center",
      minHeight: s.size.toggle,
      paddingHorizontal: s.spacing.stack,
    },
    full: { width: "100%" },
    dockNote: { paddingTop: s.spacing.inline },
    titleRow: { alignItems: "center", flexDirection: "row", gap: s.spacing.stack },
    title: { flexShrink: 1 },
    exit: { justifyContent: "center", marginLeft: "auto", minHeight: s.size.button.xs },
    barRow: {
      paddingHorizontal: s.spacing.gutter,
    },
  });

export default ProfilePick;
