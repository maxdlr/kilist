import common from "@/i18n/common";
import type { Skin } from "@/skins/types";
import { ThemedText } from "@/components/themed-text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { caseFor } from "@/skins";
import { useState } from "react";
import {
  Platform,
  Pressable,
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
  ...rest
}: {
  label?: string;
  labelColor?: string;
  bordered?: boolean;
  type?: FormInputType;
  action?: { label: string; onPress: () => void };
  style?: TextInputProps["style"];
} & Omit<TextInputProps, "style" | "secureTextEntry" | "keyboardType">) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const attached = skin.actions.attached;
  const radius = skin.shape.radius;

  const sideAction =
    action ??
    (isPassword
      ? {
          label: caseFor(skin, isPasswordVisible ? common.hide : common.show),
          onPress: () => setIsPasswordVisible((visible) => !visible),
        }
      : undefined);

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText allowFontScaling={true} size={skin.type.label} color={labelColor}>
          {label}
        </ThemedText>
      )}
      <View style={styles.row}>
        <TextInput
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
              borderBottomRightRadius: sideAction ? 0 : radius,
              borderTopRightRadius: sideAction ? 0 : radius,
              color: skin.colors.onPaper,
              fontFamily: skin.fonts.mono,
            },
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
        {sideAction && (
          <Pressable
            onPress={sideAction.onPress}
            style={[
              styles.action,
              {
                backgroundColor: attached.fill,
                borderColor: attached.line,
                borderWidth: skin.shape.border,
                borderBottomRightRadius: radius,
                borderTopRightRadius: radius,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              isPassword
                ? isPasswordVisible
                  ? common.hidePassword
                  : common.showPassword
                : sideAction.label
            }
          >
            <ThemedText
              allowFontScaling={false}
              size={skin.type.label}
              color={attached.ink}
            >
              {sideAction.label}
            </ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    container: {
      gap: s.spacing.hair,
    },
    row: {
      flexDirection: "row",
    },
    input: {
      flex: 1,
      fontSize: s.type.mono,
      height: s.size.input,
      minWidth: 0,
      paddingHorizontal: s.spacing.inline,
    },
    action: {
      alignItems: "center",
      height: s.size.input,
      justifyContent: "center",
      paddingHorizontal: s.spacing.inline,
    },
  });

export default FormInput;
