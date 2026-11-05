import type { Skin } from "@/skins/types";
import { ThemedText } from "@/components/themed-text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
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
  const actionColors = skin.actions.secondary;

  const sideAction =
    action ??
    (isPassword
      ? {
          label: isPasswordVisible ? "HIDE" : "SHOW",
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
              borderRadius: skin.shape.radius,
              color: skin.colors.onPaper,
              fontFamily: skin.fonts.mono,
            },
            bordered && {
              borderColor: skin.colors.onPaper,
              borderWidth: skin.shape.border + 1,
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
                backgroundColor: skin.colors.ground,
                borderColor: actionColors.line,
                borderWidth: skin.shape.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              isPassword
                ? isPasswordVisible
                  ? "Hide password"
                  : "Show password"
                : sideAction.label
            }
          >
            <ThemedText
              allowFontScaling={false}
              size={skin.type.label}
              color={actionColors.ink}
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
