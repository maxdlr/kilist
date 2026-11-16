import T from "@/skins/calm/text";
import SwipeDeck, { SwipeDeckFling, SwipeDeckReturn, SwipeDirection } from "@/components/elements/SwipeDeck";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import AnimationService from "@/services/animation";
import Animated, { FadeIn, LinearTransition, useSharedValue, withTiming } from "react-native-reanimated";
import { CartIcon } from "@/components/icons";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CButton, Screen , UndoButton } from "@/skins/calm/components";
import { Sample, Answer, StepNav } from "./shared";
import StepBar from "./StepBar";
import TopBar from "./TopBar";
import Caption from "./Caption";
import BouncingArrow from "./BouncingArrow";
import PracticeSummary from "./PracticeSummary";
import PracticeCard from "./PracticeCard";

const BOX_MOVE = LinearTransition.duration(
  AnimationService.config.duration,
).easing(AnimationService.config.easing);

const BOX_FADE = FadeIn.duration(AnimationService.config.duration).easing(
  AnimationService.config.easing,
);

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
              <CartIcon
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

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    deck: { flex: 1, minHeight: 0 },
    practice: { flex: 1, gap: s.spacing.stack, minHeight: 0 },
    practiceBody: { flex: 1, gap: s.spacing.stack, minHeight: 0 },
    arrowSlot: { alignItems: "center", flex: 1, justifyContent: "center" },
  });

export default Practice;
