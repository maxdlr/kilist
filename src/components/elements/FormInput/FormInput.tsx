import KilButton from "@/components/elements/KilButton";
import { EyeClosedIcon, EyeIcon, type Icon } from "@/components/icons";
import common from "@/i18n/common";
import type { ActionKind, Skin } from "@/skins/types";
import { ThemedText } from "@/components/elements/ThemedText";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { PanelScrollContext } from "@/components/elements/BottomPanel/panelScroll";
import { FieldMessage, useNudge, type FieldError } from "@/components/elements/Feedback";
import AnimationService from "@/services/animation";
import { useContext, useEffect, useState, type ComponentRef, type Ref } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { TextInput as PanelTextInput } from "react-native-gesture-handler";
import {
  Platform,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

export type FormInputType = "text" | "password" | "email" | "number";

const typeProps: Record<FormInputType, Partial<TextInputProps>> = {
  text: {},
  password: { autoCapitalize: "none", autoCorrect: false, spellCheck: false },
  email: {
    keyboardType: "email-address",
    autoCapitalize: "none",
    autoComplete: "email",
  },
  number: { keyboardType: "numeric" },
};

const FormInput = ({
  label,
  labelColor,
  bordered = false,
  type = "text",
  action,
  style,
  ref,
  error,
  ...rest
}: {
  error?: FieldError | string | null;
  ref?: Ref<ComponentRef<typeof TextInput>>;
  label?: string;
  labelColor?: string;
  bordered?: boolean;
  type?: FormInputType;
  action?: { label: string; onPress: () => void; icon: Icon; variant?: ActionKind };
  style?: TextInputProps["style"];
} & Omit<TextInputProps, "style" | "secureTextEntry" | "keyboardType">) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const panel = useContext(PanelScrollContext);
  const Input = panel ? PanelTextInput : TextInput;
  const isPassword = type === "password";
  const pill = skin.shape.pill === true;
  const radius = pill ? skin.size.input / 2 : skin.shape.radius;
  const failure = typeof error === "string" ? { message: error, attempt: 1 } : (error ?? null);
  const ring = useSharedValue(failure ? 1 : 0);
  const nudge = useNudge(failure?.attempt ?? 0);
  const look = skin.feedback.field;

  const failing = Boolean(failure);

  useEffect(() => {
    ring.set(withTiming(failing ? 1 : 0, AnimationService.feedback.tint));
  }, [failing, ring]);

  const ringStyle = useAnimatedStyle(() => ({ opacity: ring.value }));

  const sideAction =
    action ??
    (isPassword
      ? {
          label: isPasswordVisible ? common.hidePassword : common.showPassword,
          onPress: () => setIsPasswordVisible((visible) => !visible),
          icon: isPasswordVisible ? EyeClosedIcon : EyeIcon,
          variant: "secondary" as ActionKind,
        }
      : undefined);

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText allowFontScaling={true} size={skin.type.label} color={labelColor}>
          {label}
        </ThemedText>
      )}
      <Animated.View style={[styles.row, nudge]}>
        <View style={styles.field}>
        <Input
          {...(panel && { block: panel.pan })}
          ref={ref}
          accessibilityLabel={label ?? rest.placeholder}
          placeholderTextColor={skin.colors.placeholder}
          style={[
            styles.input,
            {
              backgroundColor: skin.colors.paper,
              borderColor: skin.colors.fieldLine ?? skin.colors.onPaper,
              borderWidth: bordered
                ? Math.max(skin.shape.fieldBorder, skin.shape.border + 1)
                : skin.shape.fieldBorder,
              borderBottomLeftRadius: radius,
              borderTopLeftRadius: radius,
              borderBottomRightRadius: radius,
              borderTopRightRadius: radius,
              color: skin.colors.onPaper,
              fontFamily: skin.fonts.mono,
            },
            pill && styles.pillInput,
            style,
          ]}
          {...typeProps[type]}
          {...(isPassword && {
            secureTextEntry: !isPasswordVisible,
            keyboardType:
              isPasswordVisible && Platform.OS === "android"
                ? "visible-password"
                : "default",
          })}
          {...rest}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: look.fill,
              borderColor: look.line,
              borderRadius: radius,
              borderWidth: Math.max(look.width, skin.shape.fieldBorder),
            },
            ringStyle,
          ]}
        />
        </View>
        {sideAction && (
          <KilButton
            height={skin.size.input}
            variant={sideAction.variant ?? "primary"}
            accessibilityLabel={sideAction.label}
            icon={(color) => <sideAction.icon size={skin.size.icon.action} color={color} />}
            onTouch={sideAction.onPress}
          />
        )}
      </Animated.View>
      <FieldMessage message={failure?.message} collapse={skin.spacing.hair} />
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    container: {
      gap: s.spacing.hair,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.small,
    },
    field: { flex: 1, minWidth: 0 },
    input: {
      fontSize: s.type.mono,
      height: s.size.input,
      minWidth: 0,
      paddingHorizontal: s.spacing.inline,
    },
    pillInput: { paddingHorizontal: s.spacing.stack + 2 },
  });

export default FormInput;
