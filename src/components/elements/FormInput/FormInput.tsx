import { ThemedText } from "@/components/themed-text";
import { Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { EyeIcon, EyeSlashIcon } from "react-native-heroicons/solid";

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
  type = "text",
  style,
  ...rest
}: {
  label?: string;
  type?: FormInputType;
  style?: TextInputProps["style"];
} & Omit<TextInputProps, "style" | "secureTextEntry" | "keyboardType">) => {
  const theme = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const ToggleIcon = isPasswordVisible ? EyeSlashIcon : EyeIcon;

  return (
    <View style={styles.container}>
      {label && <ThemedText type="small">{label}</ThemedText>}
      <View>
        <TextInput
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            isPassword && styles.passwordInput,
            {
              color: theme.text,
              backgroundColor: theme.backgroundElement,
              fontFamily: Fonts.sans,
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
        {isPassword && (
          <Pressable
            onPress={() => setIsPasswordVisible((visible) => !visible)}
            style={styles.toggle}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              isPasswordVisible ? "Hide password" : "Show password"
            }
          >
            <ToggleIcon size={22} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  input: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    fontSize: 16,
  },
  passwordInput: {
    paddingRight: Spacing.six,
  },
  toggle: {
    position: "absolute",
    right: Spacing.three,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
});

export default FormInput;
