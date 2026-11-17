import type { GlassSettings } from "@/components/elements/Glass";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { FadeIn, FadeInDown, FadeOut, FadeOutDown } from "react-native-reanimated";

const SWAP_DURATION = 200;
const HINT_SLIDE = 8;
const { easing } = AnimationService.config;

export const swapAnimation = {
  entering: FadeIn.duration(SWAP_DURATION).easing(easing),
  exiting: FadeOut.duration(SWAP_DURATION).easing(easing),
};

export const hintAnimation = {
  entering: FadeInDown.duration(AnimationService.enter.duration)
    .easing(AnimationService.easeOut)
    .withInitialValues({ transform: [{ translateY: HINT_SLIDE }] }),
  exiting: FadeOutDown.duration(AnimationService.exit.duration).easing(AnimationService.easeOut),
};

export const AUTH_FOOTER_GLASS: Partial<GlassSettings> = {
  blur: 30,
  androidReduction: 4,
  veil: 0.2,
};

export const signupSheet = (skin: Skin) =>
  skin.colors.signup ?? { fill: skin.colors.alert, ink: skin.colors.onAlert };

export const fieldInset = (s: Skin) => (s.shape.pill ? s.spacing.stack + 2 : s.spacing.inline);
