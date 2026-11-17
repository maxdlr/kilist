import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import { ThemedText } from "@/components/elements/ThemedText";
import Title from "@/components/elements/Title";
import type { AuthFlow } from "@/hooks/screens/useAuthFlow";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";

const LoginForm = ({ flow, onForgot }: { flow: AuthFlow; onForgot: () => void }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.login;

  return (
    <View style={styles.form}>
      <View style={styles.question}>
        <Title size={skin.type.display.md} lines={2} color={skin.colors.accent}>
          {copy.loginTitle}
        </Title>
        <ThemedText size={skin.type.body} color={skin.colors.onGround}>
          {copy.loginLine}
        </ThemedText>
      </View>
      <FormInput
        autoFocus
        placeholder={copy.loginName}
        autoCapitalize="none"
        value={flow.username}
        onChangeText={flow.setUsername}
      />
      <FormInput
        placeholder={skin.copy.placeholders.password}
        type="password"
        returnKeyType="go"
        onSubmitEditing={flow.submit}
        value={flow.password}
        onChangeText={flow.setPassword}
      />
      <KilButton
        variant="ghost"
        height={skin.size.button.xs}
        fontSize={skin.type.label}
        label={common.reset.link}
        onTouch={onForgot}
        style={styles.forgot}
      />
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    form: { gap: s.spacing.inline },
    question: { gap: s.spacing.small, marginBottom: s.spacing.stack },
    forgot: { alignSelf: "flex-end" },
  });

export default LoginForm;
