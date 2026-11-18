import Dock from "@/components/elements/Dock";
import { DEFAULT_SCENE_GLASS, FeatheredGlass } from "@/components/elements/Glass";
import KilButton from "@/components/elements/KilButton";
import { ThemedText } from "@/components/elements/ThemedText";
import type { AuthFlow } from "@/hooks/screens/useAuthFlow";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { GlassTarget } from "@/providers/TabBarProvider";
import { googleSignInAvailable } from "@/services/googleSignIn";
import type { Skin } from "@/skins/types";
import { router } from "expo-router";
import { Fragment } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import useKeyboardOpen from "@/hooks/useKeyboardOpen";

type Link = { label: string; onTouch: () => void };

const AuthFooter = ({
  flow,
  target,
  pageFill,
  onSwitch,
  onLayout,
}: {
  flow: AuthFlow;
  target: GlassTarget;
  pageFill: string;
  onSwitch: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.login;
  const isKeyboardOpen = useKeyboardOpen();
  const googleVariant = flow.isSignup ? "secondaryOnLight" : "secondary";
  const label = flow.isSignup ? (flow.isLastStep ? copy.signupAction : copy.signupNext) : copy.loginAction;

  const links: Link[] = [
    ...(flow.isSignup && flow.step > 0 ? [{ label: copy.signupBack, onTouch: flow.back }] : []),
    { label: flow.isSignup ? copy.toLogin : copy.toSignup, onTouch: onSwitch },
    ...(flow.canLeave ? [{ label: skin.copy.guest.later, onTouch: () => router.back() }] : []),
  ];

  return (
    <View style={styles.footer} onLayout={onLayout}>
      {flow.isSignup && <FeatheredGlass target={target} look={DEFAULT_SCENE_GLASS} veil={pageFill} />}
      <Dock style={styles.dock} overKeyboard={isKeyboardOpen}>
        <KilButton
          height={skin.size.button.lg}
          fontSize={skin.type.title}
          label={label}
          onTouch={flow.submit}
          disabled={!flow.canSubmit}
        />
        {googleSignInAvailable && (!flow.isSignup || flow.step === 0) && (
          <KilButton
            variant={googleVariant}
            colors={{ ...skin.actions[googleVariant], line: skin.actions[googleVariant].ink }}
            small
            label={common.google.action}
            onTouch={flow.continueWithGoogle}
            style={styles.google}
          />
        )}
        <View style={styles.links}>
          {links.map((link, index) => (
            <Fragment key={link.label}>
              {index > 0 && (
                <ThemedText size={skin.type.label} color={skin.actions.ghost.ink} importantForAccessibility="no">
                  {"·"}
                </ThemedText>
              )}
              <KilButton
                variant="ghost"
                height={skin.size.button.xs}
                fontSize={skin.type.label}
                label={link.label}
                onTouch={link.onTouch}
              />
            </Fragment>
          ))}
        </View>
      </Dock>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    footer: { bottom: 0, left: 0, position: "absolute", right: 0 },
    dock: {
      backgroundColor: "transparent",
      gap: s.spacing.hair,
      paddingBottom: s.spacing.section,
    },
    google: { marginBottom: s.spacing.small, marginTop: s.spacing.stack },
    links: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: s.spacing.tight,
      justifyContent: "center",
    },
  });

export default AuthFooter;
