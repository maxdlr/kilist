import KilButton from "@/components/elements/KilButton";
import { EyeClosedIcon, EyeIcon, type Icon } from "@/components/icons";
import common from "@/i18n/common";
import type { ActionKind, Skin } from "@/skins/types";
import { ThemedText } from "@/components/elements/ThemedText";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { useState } from "react";
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
  ...rest
}: {
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
  const isPassword = type === "password";
  const pill = skin.shape.pill === true;
  const radius = pill ? skin.size.input / 2 : skin.shape.radius;

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
        {sideAction && (
          <KilButton
            height={skin.size.input}
            variant={sideAction.variant ?? "primary"}
            accessibilityLabel={sideAction.label}
            icon={(color) => <sideAction.icon size={skin.size.icon.action} color={color} />}
            onTouch={sideAction.onPress}
          />
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
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.small,
    },
    input: {
      flex: 1,
      fontSize: s.type.mono,
      height: s.size.input,
      minWidth: 0,
      paddingHorizontal: s.spacing.inline,
    },
    pillInput: { paddingHorizontal: s.spacing.stack + 2 },
  });

export default FormInput;
