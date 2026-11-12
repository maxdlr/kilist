import withPressed from "@/utils/withPressed";
import T from "../text";
import FoodIcon from "@/components/elements/FoodIcon";
import SwipeDeck, { SwipeDeckFling, SwipeDirection } from "@/components/elements/SwipeDeck/SwipeDeck";
import SwipeGesture from "@/components/gestures/SwipeGesture";
import Intro from "@/components/views/Onboarding/_components/Intro";
import { ShopArt, SortArt } from "./IntroArt";
import { getLang } from "@/i18n";
import common from "@/i18n/common";
import { getCatalog, refreshCatalog } from "@/offline/catalog";
import { starterFoods } from "@/offline/domain";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import useToast from "@/providers/ToastProvider";
import axios from "@/services/axios";
import type { Skin } from "@/skins/types";
import { FoodBankItemType, FoodType, HouseholdWithMembersType, ListType } from "@/types/model";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import useSWR from "swr";
import { calmPalette as C } from "..";
import { CButton, CText, Screen } from "./parts";
import { CalmLoading } from "./States";


const PRACTICE_CARDS = 3;
const NUDGE = 22;
const NUDGE_MS = 420;
const NUDGE_PAUSE_MS = 900;

type Sample = { name: string; icon?: string | null };
type Answer = Sample & { direction: SwipeDirection };
const INTRO_ART = { 1: <SortArt />, 2: <ShopArt /> };

type Step = "intro" | "profile" | "practice" | "shop" | "done";

type QuestionId = "diet" | "avoid" | "drinks" | "home" | "baking";

const QUESTIONS: { id: QuestionId; single?: boolean; options: string[] }[] = [
  { id: "diet", single: true, options: ["everything", "noPork", "noMeat", "veggie"] },
  { id: "avoid", options: [] },
  { id: "drinks", options: ["coffee", "soda", "alcohol"] },
  { id: "home", options: ["baby", "cat", "dog"] },
  { id: "baking", single: true, options: ["yes", "no"] },
];

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
    ...["soda", "alcohol"].filter((drink) => !picked.drinks.includes(drink)),
    ...picked.drinks.filter((drink) => drink === "coffee"),
    ...picked.home,
    ...(picked.baking[0] === "yes" ? ["baking"] : []),
  ]),
];

const ProfilePick = ({
  listId,
  onDone,
}: {
  listId?: number;
  onDone: (added: Sample[]) => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = T.tutorial;
  const { showToast } = useToast();
  const [catalog, setCatalog] = useState(getCatalog());
  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState<Record<QuestionId, string[]>>({
    diet: ["everything"],
    avoid: [],
    drinks: [],
    home: [],
    baking: ["no"],
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (catalog?.profiles) return;
    let active = true;
    refreshCatalog(axios).then(() => {
      if (active) setCatalog(getCatalog());
    });
    return () => {
      active = false;
    };
  }, [catalog]);

  const profiles = catalog?.profiles ?? [];
  const bank: FoodBankItemType[] = catalog?.foodBanks[getLang()] ?? [];
  const chosen = profilesFrom(picked);
  const starters = profiles.length > 0 ? starterFoods(bank, chosen) : [];
  const asked = QUESTIONS[at]!;
  const question =
    asked.id === "avoid"
      ? { ...asked, options: profiles.filter((profile) => profile.ask === "avoid").map((profile) => profile.id) }
      : asked;
  const text = copy.questions[question.id];
  const isLast = at === QUESTIONS.length - 1 || profiles.length === 0;

  const pick = (id: string) =>
    setPicked((all) => {
      const current = all[question.id];
      const next = question.single ? [id] : current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id];
      return { ...all, [question.id]: next };
    });

  const finish = async () => {
    if (busy) return;
    if (starters.length === 0 || !listId) return onDone([]);
    setBusy(true);
    try {
      await axios.put("households/profiles", { profiles: chosen });
      for (const item of starters) {
        await axios.post("foods/create", { name: item.name, icon: item.icon, listId, fromOnboarding: true });
      }
      onDone(starters);
    } catch {
      showToast(common.addFailed);
      setBusy(false);
    }
  };

  return (
    <Screen
      padded={false}
      dock={
        <>
          {isLast && (
            <CText size={skin.type.label + 1} color={C.soft} style={styles.center}>
              {profiles.length > 0 ? copy.profileCount(starters.length) : copy.profileOffline}
            </CText>
          )}
          <CButton
            label={!isLast ? copy.questionNext : busy ? copy.profileAdding : copy.profileDone}
            onPress={isLast ? finish : () => setAt(at + 1)}
          />
          {at > 0 && !busy && <CButton variant="text" label={copy.questionBack} onPress={() => setAt(at - 1)} />}
        </>
      }
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.head}>
          {profiles.length > 0 && (
            <CText size={skin.type.label} color={C.soft}>
              {copy.questionAt(at + 1, QUESTIONS.length)}
            </CText>
          )}
          <CText weight="medium" size={skin.type.display.md} accessibilityRole="header">
            {profiles.length > 0 ? text.title : copy.profileTitle}
          </CText>
          <CText size={skin.type.body} color={C.soft}>
            {profiles.length > 0 ? text.line : copy.profileLine}
          </CText>
        </View>
        {profiles.length > 0 && (
          <View style={styles.options}>
            {question.options.map((id) => {
              const on = picked[question.id].includes(id);
              return (
                <Pressable
                  key={id}
                  accessibilityRole={question.single ? "radio" : "checkbox"}
                  accessibilityState={{ checked: on }}
                  onPress={() => pick(id)}
                  style={withPressed([styles.option, on && styles.optionOn])}
                >
                  <CText weight="medium" size={skin.type.body} color={on ? C.ground : C.ink}>
                    {copy.answers[id] ?? id}
                  </CText>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};

const Caption = ({ title, line, prompt }: { title: string; line?: string; prompt?: string }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);

  return (
    <View accessibilityLiveRegion="polite" style={styles.caption}>
      <CText weight="medium" size={skin.type.lead}>
        {title}
      </CText>
      {line && (
        <CText size={skin.type.body} color={C.soft}>
          {line}
        </CText>
      )}
      {prompt && <CText size={skin.type.body}>{prompt}</CText>}
    </View>
  );
};

const Practice = ({
  samples,
  onDone,
  onSkip,
}: {
  samples: Sample[];
  onDone: (answers: Answer[]) => void;
  onSkip: () => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = T.tutorial;
  const flingRef = useRef<SwipeDeckFling | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const remaining = samples.slice(answers.length);
  const current = remaining[0];
  const last = answers[answers.length - 1];

  const feedback = last
    ? last.direction === "left"
      ? { title: copy.saidOut(last.name), line: copy.saidOutLine }
      : last.direction === "right"
        ? { title: copy.saidIn(last.name), line: copy.saidInLine }
        : { title: copy.saidUnsure(last.name), line: copy.saidUnsureLine }
    : current
      ? { title: copy.promptFirst(current.name), line: copy.promptFirstLine }
      : { title: "", line: "" };
  const prompt =
    last && current
      ? answers.length === 1
        ? copy.promptRight(current.name)
        : copy.promptFree(current.name)
      : undefined;

  return (
    <Screen
      dock={
        current ? (
          <View style={styles.dockRow}>
            <CButton flex={1} variant="secondary" label={`← ${copy.out}`} onPress={() => flingRef.current?.("left")} />
            <CButton flex={1} variant="secondary" label={`${copy.have} →`} onPress={() => flingRef.current?.("right")} />
          </View>
        ) : (
          <CButton label={copy.seeList} onPress={() => onDone(answers)} />
        )
      }
    >
      <View style={styles.topRow}>
        <CText size={skin.type.label} color={C.soft}>
          {copy.practiceLabel(Math.min(answers.length + 1, samples.length), samples.length)}
        </CText>
        <CButton variant="text" label={copy.skip} onPress={onSkip} />
      </View>
      <View style={styles.deck}>
        <SwipeDeck
          items={remaining}
          keyOf={(item) => item.name}
          stamps={copy.stamps}
          allowUp
          flingRef={flingRef}
          onIntent={() => {}}
          onSwipe={(item, direction) => setAnswers((list) => [...list, { ...item, direction }])}
          background={C.ground}
          renderSheet={(item) => (
            <View style={styles.sheet}>
              <View style={styles.card}>
                <FoodIcon name={item.icon ?? undefined} size={skin.size.icon.card} />
                <CText weight="medium" size={skin.type.title} style={styles.center}>
                  {item.name}
                </CText>
              </View>
            </View>
          )}
        />
      </View>
      <Caption title={feedback.title} line={feedback.line} prompt={prompt} />
    </Screen>
  );
};

const PracticeRow = ({
  name,
  nudging,
  onBuy,
  onLater,
}: {
  name: string;
  nudging: boolean;
  onBuy: () => void;
  onLater: () => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const [buying, setBuying] = useState(true);
  const nudge = useSharedValue(0);

  useEffect(() => {
    if (!nudging) {
      nudge.set(0);
      return;
    }
    nudge.set(
      withRepeat(
        withSequence(
          withDelay(NUDGE_PAUSE_MS, withTiming(NUDGE, { duration: NUDGE_MS })),
          withTiming(0, { duration: NUDGE_MS }),
        ),
        -1,
      ),
    );
  }, [nudging, nudge]);

  const nudgeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: nudge.value }] }));

  return (
    <View
      accessible
      accessibilityLabel={name}
      accessibilityActions={[
        { name: "activate", label: T.shop.inBasket },
        { name: "later", label: T.shop.nextTime },
      ]}
      onAccessibilityAction={(event) => (event.nativeEvent.actionName === "later" ? onLater() : onBuy())}
      style={[styles.slot, { backgroundColor: buying ? C.haveIt : C.tint }]}
    >
      <View style={[styles.behind, { justifyContent: buying ? "flex-start" : "flex-end" }]}>
        <CText weight="medium" size={skin.type.label + 1} color={buying ? C.white : C.soft}>
          {buying ? T.shop.inBasket : T.shop.later}
        </CText>
      </View>
      <Animated.View style={nudgeStyle}>
        <SwipeGesture
          onSwipeRight={onBuy}
          onSwipeLeft={onLater}
          onSwipingRight={() => setBuying(true)}
          onSwipingLeft={() => setBuying(false)}
          swipeThreshold={100}
          styles={{ box: styles.swipeBox }}
        >
          <View style={styles.rowMain}>
            <CText size={skin.type.lead} style={styles.flex} numberOfLines={1}>
              {name}
            </CText>
          </View>
        </SwipeGesture>
      </Animated.View>
    </View>
  );
};

const PracticeShop = ({ answers, onDone }: { answers: Answer[]; onDone: () => void }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = T.tutorial;
  const out = answers.filter((answer) => answer.direction === "left");
  const pretend = out.length === 0;
  const rows = pretend ? answers.slice(0, 1) : out;
  const [handled, setHandled] = useState<Record<string, "bought" | "later">>({});
  const [lastAction, setLastAction] = useState<"bought" | "later" | null>(null);
  const open = rows.filter((row) => !handled[row.name]);
  const first = rows[0];

  const handle = (name: string, action: "bought" | "later") => {
    setHandled((map) => ({ ...map, [name]: action }));
    setLastAction(action);
  };

  return (
    <Screen dock={lastAction ? <CButton label={copy.shopNext} onPress={onDone} /> : undefined}>
      <View style={styles.head}>
        <CText size={skin.type.label} color={C.soft}>
          {copy.shopLabel}
        </CText>
        <CText weight="medium" size={skin.type.display.md} accessibilityRole="header">
          {copy.shopTitle(open.length)}
        </CText>
      </View>
      <View style={styles.flex}>
        {open.map((row, index) => (
          <PracticeRow
            key={row.name}
            name={row.name}
            nudging={index === 0 && !lastAction}
            onBuy={() => handle(row.name, "bought")}
            onLater={() => handle(row.name, "later")}
          />
        ))}
      </View>
      {lastAction ? (
        <Caption title={lastAction === "bought" ? copy.shopBought : copy.shopLater} />
      ) : (
        <Caption
          title={copy.shopCaption}
          line={first ? (pretend ? copy.shopPretend(first.name) : copy.shopCaptionLine(first.name)) : undefined}
        />
      )}
    </Screen>
  );
};

const Finished = ({ onStart }: { onStart: () => void }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = T.tutorial;

  return (
    <Screen
      dock={
        <>
          <CText size={skin.type.label + 1} color={C.soft} style={styles.center}>
            {copy.doneNote}
          </CText>
          <CButton label={copy.start} onPress={onStart} />
        </>
      }
    >
      <View style={styles.head}>
        <CText size={skin.type.label} color={C.soft}>
          {copy.doneLabel}
        </CText>
        <CText weight="medium" size={skin.type.display.md} accessibilityRole="header">
          {copy.doneTitle}
        </CText>
      </View>
      <View style={styles.recap}>
        {copy.doneSteps.map((line, index) => (
          <View key={line} style={[styles.recapRow, index > 0 && styles.recapDivider]}>
            <View style={styles.number}>
              <CText weight="medium" size={skin.type.label} color={C.ground}>
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
  onDone,
}: {
  withIntro: boolean;
  foodsOnly: boolean;
  onDone: (startRound: boolean) => void;
}) => {
  const copy = T.tutorial;
  const { data: mainList } = useSWR<ListType & { foods?: FoodType[] }>({ url: "lists/read?main=true" });
  const { data: household } = useSWR<HouseholdWithMembersType>({ url: "/households/me" });
  const [step, setStep] = useState<Step>(withIntro ? "intro" : "profile");
  const [added, setAdded] = useState<Sample[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);

  if (!mainList || !household) return <CalmLoading />;

  const inventory = mainList.foods ?? [];
  const joined = household.members.length > 1;
  const samples: Sample[] = [...added, ...inventory, ...copy.samples.map((name) => ({ name }))]
    .filter((item, index, list) => list.findIndex((other) => other.name === item.name) === index)
    .slice(0, PRACTICE_CARDS);

  const finish = (startRound: boolean) => {
    onDone(startRound);
  };

  if (step === "intro") {
    return (
      <Intro
        art={INTRO_ART}
        onDone={() => setStep((inventory.length > 0 || joined) && !foodsOnly ? "practice" : "profile")}
      />
    );
  }

  if (step === "profile") {
    return (
      <ProfilePick
        listId={mainList.id}
        onDone={(items) => {
          setAdded(items);
          if (foodsOnly) finish(false);
          else setStep("practice");
        }}
      />
    );
  }

  if (step === "practice") {
    return (
      <Practice
        samples={samples}
        onSkip={() => finish(false)}
        onDone={(result) => {
          setAnswers(result);
          setStep("shop");
        }}
      />
    );
  }

  if (step === "shop") return <PracticeShop answers={answers} onDone={() => setStep("done")} />;

  return <Finished onStart={() => finish(true)} />;
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    center: { textAlign: "center" },
    scroll: { gap: s.spacing.section + 4, paddingBottom: s.spacing.stack, paddingHorizontal: s.spacing.gutter },
    head: { gap: s.spacing.small },
    options: { gap: s.spacing.small + 2 },
    option: {
      borderColor: C.field,
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      justifyContent: "center",
      minHeight: s.size.button.lg,
      paddingHorizontal: s.spacing.stack,
    },
    optionOn: { backgroundColor: C.ink, borderColor: C.ink },
    topRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
    deck: { flex: 1, minHeight: 0 },
    sheet: { alignItems: "center", backgroundColor: C.ground, flex: 1, justifyContent: "center" },
    card: {
      alignItems: "center",
      aspectRatio: 0.78,
      backgroundColor: C.white,
      borderColor: C.hairline,
      borderRadius: s.panel.radius,
      borderWidth: s.shape.border,
      gap: s.spacing.stack,
      justifyContent: "center",
      maxHeight: "100%",
      padding: s.spacing.gutter,
      width: "78%",
    },
    caption: {
      backgroundColor: C.white,
      borderColor: C.hairline,
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      gap: s.spacing.tight + 2,
      padding: s.spacing.stack,
    },
    dockRow: { flexDirection: "row", gap: s.spacing.inline },
    slot: { borderTopColor: C.hairline, borderTopWidth: s.shape.divider, overflow: "hidden" },
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
    swipeBox: { backgroundColor: C.ground },
    rowMain: { alignItems: "center", flexDirection: "row", minHeight: s.size.row.shop, paddingStart: s.spacing.stack },
    recap: {
      backgroundColor: C.white,
      borderColor: C.hairline,
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
    },
    recapRow: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline + 2, padding: s.spacing.stack },
    recapDivider: { borderTopColor: C.hairline, borderTopWidth: s.shape.divider },
    number: {
      alignItems: "center",
      backgroundColor: C.ink,
      borderRadius: s.spacing.inline + 2,
      height: (s.spacing.inline + 2) * 2,
      justifyContent: "center",
      width: (s.spacing.inline + 2) * 2,
    },
  });

export default CalmTutorial;
