import Press from "@/components/elements/Press";
import withPressed from "@/utils/withPressed";
import T from "../text";
import FoodIcon from "@/components/elements/FoodIcon";
import SwipeDeck, {
  SwipeDeckFling,
  SwipeDeckReturn,
  SwipeDirection,
} from "@/components/elements/SwipeDeck/SwipeDeck";
import SwipeGesture from "@/components/gestures/SwipeGesture";
import Intro from "@/components/views/Onboarding/_components/Intro";
import { ShopArt, SortArt } from "./IntroArt";
import { getLang } from "@/i18n";
import common from "@/i18n/common";
import { getCatalog, refreshCatalog } from "@/offline/catalog";
import { starterFoods } from "@/offline/domain";
import { foodKey } from "@/offline/foodNames";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import useToast from "@/providers/ToastProvider";
import axios from "@/services/axios";
import type { Skin } from "@/skins/types";
import {
  FoodBankItemType,
  FoodType,
  HouseholdWithMembersType,
  ListType,
} from "@/types/model";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import AnimationService from "@/services/animation";
import Animated, {
  Easing,
  FadeIn,
  LinearTransition,
  type SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  ArrowDownIcon,
  ChevronLeftIcon,
  ShoppingCartIcon,
  XMarkIcon,
} from "react-native-heroicons/outline";
import useSWR, { useSWRConfig } from "swr";
import { calmColors, useCalmColors } from "./colors";
import { CardPads, CButton, CText, Screen } from "./parts";
import { CalmLoading } from "./States";
import { UndoButton } from "./Play";
import { useDeckCardLook } from "./deckCard";

const PRACTICE_CARDS = 3;
const SHOP_ROWS = 2;
const BOX_MOVE = LinearTransition.duration(
  AnimationService.config.duration,
).easing(AnimationService.config.easing);
const BOX_FADE = FadeIn.duration(AnimationService.config.duration).easing(
  AnimationService.config.easing,
);
const NUDGE = 180;
const NUDGE_MS = 1000;
const NUDGE_PAUSE_MS = 900;

type Sample = { name: string; icon?: string | null };
type Answer = Sample & { direction: SwipeDirection };
const INTRO_ART = { 1: <SortArt />, 2: <ShopArt /> };

type Step = "intro" | "profile" | "practice" | "shop" | "done";

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

const StepBar = ({
  progress,
  label,
  now,
  max,
}: {
  progress: SharedValue<number>;
  label: string;
  now: number;
  max: number;
}) => {
  const styles = useSkinStyles(createStyles);
  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(1, progress.value)) * 100}%`,
  }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max, now }}
      style={styles.barTrack}
    >
      <Animated.View style={[styles.barFill, fillStyle]} />
    </View>
  );
};

export type StepNav = { onBack?: () => void; onExit?: () => void };

const TopBar = ({ onBack, onExit, children }: StepNav & { children?: ReactNode }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const icon = (Icon: typeof XMarkIcon) => (
    <Icon size={skin.size.icon.action} color={C.textSoft} strokeWidth={1.8} />
  );

  return (
    <View style={styles.topBar}>
      {onBack && (
        <Press
          accessibilityRole="button"
          accessibilityLabel={T.tutorial.questionBack}
          hitSlop={skin.spacing.small}
          onPress={onBack}
          style={withPressed(styles.topIcon)}
        >
          {icon(ChevronLeftIcon)}
        </Press>
      )}
      <View style={styles.topMiddle}>{children}</View>
      {onExit && (
        <Press
          accessibilityRole="button"
          accessibilityLabel={T.close}
          hitSlop={skin.spacing.small}
          onPress={onExit}
          style={withPressed(styles.topIcon)}
        >
          {icon(XMarkIcon)}
        </Press>
      )}
    </View>
  );
};

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
      <ScrollView
        key={index}
        style={{ width }}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.head}>
          <CText
            weight="medium"
            size={skin.type.display.md}
            accessibilityRole="header"
          >
            {refine
              ? copy.refineTitle
              : reviewing
                ? copy.reviewTitle
                : online
                  ? text.title
                  : copy.profileTitle}
          </CText>
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
      </ScrollView>
    );
  };

  return (
    <Screen
      padded={false}
      dock={
        <>
          {isLast && (
            <CText
              size={skin.type.label + 1}
              color={C.textSoft}
              style={[styles.center, styles.full]}
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
      {(paged || onBack || onExit) && (
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

const hintHeight = (s: Skin) => Math.round(s.type.label * 1.38);
const captionGap = (s: Skin) => s.spacing.tight + 2;

const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const Named = ({
  text,
  names,
  size,
  color,
}: {
  text: string;
  names: string[];
  size: number;
  color?: string;
}) => {
  const wanted = names.filter(Boolean);
  if (wanted.length === 0) return <>{text}</>;
  const pattern = new RegExp(`(${wanted.map(escaped).join("|")})`, "gi");
  return (
    <>
      {text.split(pattern).map((part, index) =>
        index % 2 === 1 ? (
          <CText key={index} weight="bold" size={size} color={color}>
            {part}
          </CText>
        ) : (
          part
        ),
      )}
    </>
  );
};

const Caption = ({
  title,
  line,
  hint,
  names = [],
}: {
  title: string;
  line?: string;
  hint?: SwipeDirection | null;
  names?: string[];
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const hintColor: Record<SwipeDirection, string> = {
    left: C.negative,
    up: C.textSoft,
    right: C.positive,
  };
  const withHint = hint !== undefined;
  const [shownHint, setShownHint] = useState<SwipeDirection | null>(
    hint ?? null,
  );
  if (hint && hint !== shownHint) setShownHint(hint);
  const shown = useSharedValue(hint ? 1 : 0);
  const shift = (hintHeight(skin) + captionGap(skin)) / 2;

  useEffect(() => {
    shown.set(withTiming(hint ? 1 : 0, AnimationService.config));
  }, [hint, shown]);

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withHint ? (1 - shown.value) * shift : 0 }],
  }));
  const hintStyle = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateY: (1 - shown.value) * shift }],
  }));

  return (
    <View accessibilityLiveRegion="polite" style={styles.caption}>
      <Animated.View style={titleStyle}>
        <CText weight="medium" size={skin.type.lead} style={styles.center}>
          <Named text={title} names={names} size={skin.type.lead} />
        </CText>
      </Animated.View>
      {withHint && (
        <Animated.View style={[styles.hintLine, hintStyle]}>
          {shownHint && (
            <CText
              weight="bold"
              size={skin.type.label}
              color={hintColor[shownHint]}
              style={styles.center}
            >
              {T.intent[shownHint]}
            </CText>
          )}
        </Animated.View>
      )}
      {line && (
        <CText size={skin.type.body} color={C.textSoft} style={styles.center}>
          <Named
            text={line}
            names={names}
            size={skin.type.body}
            color={C.textSoft}
          />
        </CText>
      )}
    </View>
  );
};

const ARROW_BOUNCE = 20;
const ARROW_SWING = {
  duration: 1000,
  easing: Easing.bezier(0.5, 0, 0.5, 1),
};

const BouncingArrow = () => {
  const skin = useSkin();
  const C = useCalmColors();
  const reduced = useReducedMotion();
  const drop = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    drop.set(
      withRepeat(
        withSequence(
          withTiming(ARROW_BOUNCE, ARROW_SWING),
          withTiming(0, ARROW_SWING),
        ),
        -1,
      ),
    );
  }, [reduced, drop]);

  const dropStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: drop.value }],
  }));

  return (
    <Animated.View style={dropStyle}>
      <ArrowDownIcon
        size={skin.size.icon.action}
        color={C.text}
        strokeWidth={1.8}
      />
    </Animated.View>
  );
};

const PracticeSummary = ({ answers }: { answers: Answer[] }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const copy = T.tutorial;
  const namesOf = (direction: SwipeDirection) =>
    answers
      .filter((answer) => answer.direction === direction)
      .map((answer) => answer.name);
  const sentences = [
    { names: namesOf("left"), say: copy.summaryOut },
    { names: namesOf("right"), say: copy.summaryIn },
    { names: namesOf("up"), say: copy.summaryUnsure },
  ]
    .filter((group) => group.names.length > 0)
    .map((group) => group.say(group.names));

  return (
    <View accessibilityLiveRegion="polite" style={styles.summary}>
      <CText
        weight="medium"
        size={skin.type.display.md}
        style={[styles.center, styles.summaryTitle]}
        accessibilityRole="header"
      >
        {copy.summaryTitle}
      </CText>
      <View style={styles.bullets}>
        {sentences.map((sentence) => (
          <View key={sentence} style={styles.bullet}>
            <CText size={skin.type.body} color={C.text}>
              {"•"}
            </CText>
            <CText size={skin.type.body} color={C.text} style={styles.flex}>
              <Named
                text={sentence}
                names={answers.map((answer) => answer.name)}
                size={skin.type.body}
                color={C.text}
              />
            </CText>
          </View>
        ))}
      </View>
      <CText
        weight="medium"
        size={skin.type.body}
        color={C.text}
        style={[styles.center, styles.summaryEnd]}
      >
        {copy.summaryEnd}
      </CText>
    </View>
  );
};

const PracticeCard = ({
  item,
  behind,
  intent,
  onFling,
}: {
  item: Sample;
  behind: boolean;
  intent: SwipeDirection | null;
  onFling?: (direction: SwipeDirection) => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const look = useDeckCardLook(behind);

  return (
    <View style={styles.sheet}>
      <Animated.View style={[styles.card, look.cardStyle]}>
        <Animated.View style={[styles.flex, look.contentStyle]}>
          <View style={styles.cardBody}>
            <FoodIcon
              name={item.icon ?? undefined}
              size={skin.size.icon.card}
            />
            <CText weight="bold" size={skin.type.title} style={styles.center}>
              {item.name}
            </CText>
          </View>
          <CardPads labels intent={intent} onFling={onFling} />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const Practice = ({
  samples,
  initialAnswers = [],
  onDone,
  onSkip,
  onBack,
  onExit,
}: StepNav & {
  samples: Sample[];
  initialAnswers?: Answer[];
  onDone: (answers: Answer[]) => void;
  onSkip: () => void;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const copy = T.tutorial;
  const flingRef = useRef<SwipeDeckFling | null>(null);
  const [answers, setAnswers] = useState<Answer[]>(initialAnswers);
  const [intent, setIntent] = useState<SwipeDirection | null>(null);
  const practiced = useSharedValue(0);
  const [returning, setReturning] = useState<SwipeDeckReturn>(null);
  const undoLast = () => {
    const last = answers[answers.length - 1];
    if (!last) return;
    setReturning({ key: last.name, direction: last.direction });
    setAnswers((list) => list.slice(0, -1));
  };

  useEffect(() => {
    practiced.set(
      withTiming(
        answers.length / Math.max(1, samples.length),
        AnimationService.config,
      ),
    );
  }, [practiced, answers.length, samples.length]);

  const remaining = samples.slice(answers.length);
  const current = remaining[0];

  return (
    <Screen
      dock={
        current ? undefined : (
          <CButton
            label={copy.seeList}
            onPress={() => onDone(answers)}
            icon={(color) => (
              <ShoppingCartIcon
                size={skin.size.icon.action}
                color={color}
                strokeWidth={1.8}
              />
            )}
          />
        )
      }
    >
      <View style={styles.practice}>
        <TopBar onBack={onBack} onExit={onExit}>
          <UndoButton enabled={answers.length > 0} onPress={undoLast} />
          <View style={styles.flex}>
            <StepBar
              progress={practiced}
              label={copy.practiceLabel(
                Math.min(answers.length + 1, samples.length),
                samples.length,
              )}
              now={answers.length}
              max={samples.length}
            />
          </View>
          {!onExit && <CButton variant="text" label={copy.skip} onPress={onSkip} />}
        </TopBar>
        <View style={styles.practiceBody}>
          {!current && <View style={styles.flex} />}
          <Animated.View layout={BOX_MOVE}>
            {current ? (
              <Caption
                title={copy.promptFirst(current.name)}
                hint={intent}
                names={[current.name]}
              />
            ) : (
              <Animated.View entering={BOX_FADE}>
                <PracticeSummary answers={answers} />
              </Animated.View>
            )}
          </Animated.View>
          {!current && (
            <Animated.View entering={BOX_FADE} style={styles.arrowSlot}>
              <BouncingArrow />
            </Animated.View>
          )}
          {current && (
            <View style={styles.deck}>
              <SwipeDeck
                items={remaining}
                keyOf={(item) => item.name}
                stamps={{}}
                allowUp
                returnFrom={returning}
                flingRef={flingRef}
                onIntent={setIntent}
                onSwipe={(item, direction) =>
                  setAnswers((list) => [...list, { ...item, direction }])
                }
                background={C.ground}
                renderSheet={(item, depth) => (
                  <PracticeCard
                    item={item}
                    behind={depth > 0}
                    intent={depth === 0 ? intent : null}
                    onFling={
                      depth === 0
                        ? (direction) => flingRef.current?.(direction)
                        : undefined
                    }
                  />
                )}
              />
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
};

const PracticeRow = ({
  name,
  nudging,
  nudgeTo = 1,
  onBuy,
  onLater,
}: {
  name: string;
  nudging: boolean;
  nudgeTo?: 1 | -1;
  onBuy: () => void;
  onLater: () => void;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const nudge = useSharedValue(0);
  const drag = useSharedValue(0);

  useEffect(() => {
    if (!nudging) {
      nudge.set(0);
      return;
    }
    nudge.set(
      withRepeat(
        withSequence(
          withDelay(NUDGE_PAUSE_MS, withTiming(NUDGE * nudgeTo, { duration: NUDGE_MS , easing: AnimationService.config.easing
          })),
          withTiming(0, { duration: NUDGE_MS , easing: AnimationService.config.easing
          }),
        ),
        -1,
      ),
    );
  }, [nudging, nudge, nudgeTo]);

  const nudgeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: nudge.value }],
  }));
  const laterStyle = useAnimatedStyle(() => ({
    opacity: drag.value + nudge.value < 0 ? 1 : 0,
  }));

  return (
    <View
      accessible
      accessibilityLabel={name}
      accessibilityActions={[
        { name: "activate", label: T.shop.inBasket },
        { name: "later", label: T.shop.nextTime },
      ]}
      onAccessibilityAction={(event) =>
        event.nativeEvent.actionName === "later" ? onLater() : onBuy()
      }
      style={styles.slot}
    >
      <View style={[styles.behind, styles.behindBuy]}>
        <CText weight="medium" size={skin.type.label + 1} color={C.onPositive}>
          {T.shop.inBasket}
        </CText>
      </View>
      <Animated.View style={[styles.behind, styles.behindLater, laterStyle]}>
        <CText weight="medium" size={skin.type.label + 1} color={C.textSoft}>
          {T.shop.later}
        </CText>
      </Animated.View>
      <Animated.View style={nudgeStyle}>
        <SwipeGesture
          onSwipeRight={onBuy}
          onSwipeLeft={onLater}
          translation={drag}
          swipeThreshold={100}
          styles={{ box: styles.swipeBox }}
        >
          <View style={styles.rowMain}>
            <CText
              weight="bold"
              size={skin.type.lead}
              style={styles.flex}
              numberOfLines={1}
            >
              {name}
            </CText>
          </View>
        </SwipeGesture>
      </Animated.View>
    </View>
  );
};

const PracticeShop = ({
  answers,
  spares,
  onDone,
  onBack,
  onExit,
}: StepNav & {
  answers: Answer[];
  spares: Sample[];
  onDone: () => void;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const copy = T.tutorial;
  const out = answers.filter((answer) => answer.direction === "left");
  const rows = [...out, ...spares, ...answers].filter(
    (item, index, list) => list.findIndex((other) => other.name === item.name) === index,
  ).slice(0, SHOP_ROWS);
  const [handled, setHandled] = useState<Record<string, "bought" | "later">>(
    {},
  );
  const [lastAction, setLastAction] = useState<"bought" | "later" | null>(null);
  const open = rows.filter((row) => !handled[row.name]);
  const did = Object.values(handled);
  const expected: "bought" | "later" | null = !did.includes("bought")
    ? "bought"
    : !did.includes("later")
      ? "later"
      : null;
  const finished = expected === null || open.length === 0;

  const left = useRef(false);

  useEffect(() => {
    if (!finished || left.current) return;
    left.current = true;
    onDone();
  }, [finished, onDone]);

  const handle = (name: string, action: "bought" | "later") => {
    setHandled((map) => ({ ...map, [name]: action }));
    setLastAction(action);
  };

  return (
    <Screen>
      <TopBar onBack={onBack} onExit={onExit} />
      <View style={styles.head}>
        <CText size={skin.type.label} color={C.textSoft}>
          {copy.shopLabel}
        </CText>
        <CText
          weight="medium"
          size={skin.type.display.md}
          accessibilityRole="header"
        >
          {copy.shopTitle(open.length)}
        </CText>
      </View>
      <View style={styles.flex}>
        {open.map((row, index) => (
          <PracticeRow
            key={row.name}
            name={row.name}
            nudging={index === 0 && !finished}
            nudgeTo={expected === "later" ? -1 : 1}
            onBuy={() => handle(row.name, "bought")}
            onLater={() => handle(row.name, "later")}
          />
        ))}
        {!finished && (
          <View style={styles.rowHint}>
            <CText weight="medium" size={skin.type.display.md} accessibilityRole="header">
              {expected === "later" ? copy.shopLaterTitle : copy.shopSwipeTitle}
            </CText>
            <CText size={skin.type.body} color={C.textSoft}>
              {expected === "later" ? copy.shopLaterHint : copy.shopSwipeHint}
            </CText>
          </View>
        )}
      </View>
      {lastAction === "bought" && <Caption title={copy.shopBought} />}
    </Screen>
  );
};

const Finished = ({ onStart, onBack, onExit }: StepNav & { onStart: () => void }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const copy = T.tutorial;

  return (
    <Screen
      dock={
        onExit ? undefined : (
          <>
            <CText
              size={skin.type.label + 1}
              color={C.textSoft}
              style={styles.center}
            >
              {copy.doneNote}
            </CText>
            <CButton label={copy.start} onPress={onStart} />
          </>
        )
      }
    >
      <TopBar onBack={onBack} onExit={onExit} />
      <View style={styles.head}>
        <CText size={skin.type.label} color={C.textSoft}>
          {copy.doneLabel}
        </CText>
        <CText
          weight="medium"
          size={skin.type.display.md}
          accessibilityRole="header"
        >
          {copy.doneTitle}
        </CText>
      </View>
      <View style={styles.recap}>
        {copy.doneSteps.map((line, index) => (
          <View
            key={line}
            style={[styles.recapRow, index > 0 && styles.recapDivider]}
          >
            <View style={styles.number}>
              <CText weight="medium" size={skin.type.label} color={C.onFill}>
                {String(index + 1)}
              </CText>
            </View>
            <CText size={skin.type.body} style={styles.flex}>
              {line}
            </CText>
          </View>
        ))}
      </View>
    </Screen>
  );
};

const CalmTutorial = ({
  withIntro,
  foodsOnly,
  refine = false,
  onDone,
  onExit,
}: {
  withIntro: boolean;
  foodsOnly: boolean;
  refine?: boolean;
  onDone: (startRound: boolean) => void;
  onExit?: () => void;
}) => {
  const copy = T.tutorial;
  const { data: mainList } = useSWR<ListType & { foods?: FoodType[] }>({
    url: "lists/read?main=true",
  });
  const { data: household } = useSWR<HouseholdWithMembersType>({
    url: "/households/me",
  });
  const [step, setStep] = useState<Step>(withIntro ? "intro" : "profile");
  const [trail, setTrail] = useState<Step[]>([]);
  const [added, setAdded] = useState<Sample[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);

  if (!mainList || !household) return <CalmLoading />;

  const inventory = mainList.foods ?? [];
  const joined = household.members.length > 1;
  const candidates: Sample[] = [
    ...added,
    ...inventory,
    ...copy.samples.map((name) => ({ name })),
  ].filter(
    (item, index, list) =>
      list.findIndex((other) => other.name === item.name) === index,
  );
  const samples = candidates.slice(0, PRACTICE_CARDS);
  const spares = candidates.slice(PRACTICE_CARDS, PRACTICE_CARDS + SHOP_ROWS);

  const finish = (startRound: boolean) => {
    onDone(startRound);
  };

  const go = (next: Step, canReturn = true) => {
    setTrail((list) => (canReturn ? [...list, step] : []));
    setStep(next);
  };
  const previous = trail[trail.length - 1];
  const back = previous
    ? () => {
        setTrail((list) => list.slice(0, -1));
        setStep(previous);
      }
    : undefined;
  const nav = { onBack: back, onExit };

  if (refine)
    return (
      <ProfilePick
        listId={mainList.id}
        owned={inventory}
        onDone={() => finish(false)}
        onExit={onExit}
      />
    );

  if (step === "intro") {
    return (
      <Intro
        art={INTRO_ART}
        onExit={onExit}
        onDone={() =>
          go(
            (inventory.length > 0 || joined) && !foodsOnly
              ? "practice"
              : "profile",
          )
        }
      />
    );
  }

  if (step === "profile") {
    return (
      <ProfilePick
        listId={mainList.id}
        {...nav}
        onDone={(items) => {
          setAdded(items);
          if (foodsOnly) finish(false);
          else go("practice", false);
        }}
      />
    );
  }

  if (step === "practice") {
    return (
      <Practice
        samples={samples}
        initialAnswers={answers}
        {...nav}
        onSkip={() => finish(false)}
        onDone={(result) => {
          setAnswers(result);
          go("shop");
        }}
      />
    );
  }

  if (step === "shop")
    return (
      <PracticeShop
        answers={answers}
        spares={spares}
        {...nav}
        onDone={() => go("done")}
      />
    );

  return <Finished {...nav} onStart={() => finish(true)} />;
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
    pageActions: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
    },
    topRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.stack,
      justifyContent: "space-between",
    },
    barRow: {
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.gutter,
    },
    barTrack: {
      backgroundColor: C.line,
      borderRadius: 2,
      height: 4,
      overflow: "hidden",
    },
    barFill: { backgroundColor: C.fill, borderRadius: 2, height: "100%" },
    deck: { flex: 1, minHeight: 0 },
    sheet: {
      backgroundColor: C.ground,
      flex: 1,
      paddingBottom: s.spacing.stack,
      paddingTop: s.spacing.small,
    },
    hintLine: { height: hintHeight(s), justifyContent: "center" },
    practice: { flex: 1, gap: s.spacing.stack, minHeight: 0 },
    card: {
      backgroundColor: C.card,
      borderColor: C.line,
      borderRadius: s.size.button.lg / 2 + s.spacing.inline,
      borderWidth: s.shape.border,
      flex: 1,
    },
    cardBody: {
      alignItems: "center",
      flex: 1,
      gap: s.spacing.stack,
      justifyContent: "center",
      padding: s.spacing.gutter,
    },
    practiceBody: { flex: 1, gap: s.spacing.stack, minHeight: 0 },
    summary: { gap: s.spacing.stack, paddingHorizontal: s.spacing.small },
    rowHint: { gap: s.spacing.tight, paddingTop: s.spacing.section },
    topBar: { alignItems: "center", flexDirection: "row", gap: s.spacing.stack, minHeight: s.size.button.xs },
    topMiddle: { alignItems: "center", flex: 1, flexDirection: "row", gap: s.spacing.stack },
    topIcon: { justifyContent: "center", minHeight: s.size.button.xs },
    summaryTitle: { paddingBottom: s.spacing.section },
    bullets: { gap: s.spacing.small },
    bullet: { flexDirection: "row", gap: s.spacing.small },
    summaryEnd: { paddingTop: s.spacing.stack },
    arrowSlot: { alignItems: "center", flex: 1, justifyContent: "center" },
    caption: {
      backgroundColor: C.card,
      borderColor: C.line,
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      gap: captionGap(s),
      padding: s.spacing.stack,
    },
    slot: {
      borderTopColor: C.line,
      borderTopWidth: s.shape.divider,
      overflow: "hidden",
    },
    behind: {
      alignItems: "center",
      bottom: 0,
      flexDirection: "row",
      left: 0,
      paddingHorizontal: s.spacing.stack,
      position: "absolute",
      right: 0,
      top: 0,
    },
    behindBuy: { backgroundColor: C.positive, justifyContent: "flex-start" },
    behindLater: { backgroundColor: C.tint, justifyContent: "flex-end" },
    swipeBox: { backgroundColor: C.ground },
    rowMain: {
      alignItems: "center",
      flexDirection: "row",
      minHeight: s.size.row.shop,
      paddingStart: s.spacing.stack,
    },
    recap: {
      backgroundColor: C.card,
      borderColor: C.line,
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
    },
    recapRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.inline + 2,
      padding: s.spacing.stack,
    },
    recapDivider: { borderTopColor: C.line, borderTopWidth: s.shape.divider },
    number: {
      alignItems: "center",
      backgroundColor: C.fill,
      borderRadius: s.spacing.inline + 2,
      height: (s.spacing.inline + 2) * 2,
      justifyContent: "center",
      width: (s.spacing.inline + 2) * 2,
    },
  });

export default CalmTutorial;
