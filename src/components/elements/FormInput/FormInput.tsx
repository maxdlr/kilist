import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";

export type FormInputType = "text" | "password" | "email" | "number";

const typeProps: Record<
  FormInputType,
  Partial<TextInputProps>
> = {
  text: {},
  password: { secureTextEntry: true, autoCapitalize: "none" },
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

  return (
    <View style={styles.container}>
      {label && <ThemedText type="small">{label}</ThemedText>}
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.backgroundElement },
          style,
        ]}
        {...typeProps[type]}
        {...rest}
      />
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
});

export default FormInput;
