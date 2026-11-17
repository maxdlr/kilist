import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import KilToggleButton from "@/components/elements/KilToggleButton";
import QrCodeScanner from "@/components/elements/QrCodeScanner";
import { ThemedText } from "@/components/elements/ThemedText";
import Title from "@/components/elements/Title";
import { QrCodeIcon } from "@/components/icons";
import type { AuthFlow, SignupStepId } from "@/hooks/screens/useAuthFlow";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { fieldInset, signupSheet, swapAnimation } from "./authLook";
import PasswordRules from "./PasswordRules";

const SignupStep = ({ flow }: { flow: AuthFlow }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.login;
  const { ink } = signupSheet(skin);
  const [scanning, setScanning] = useState(false);
  const { stepId, householdChoice } = flow;
  const creating = householdChoice === "create";

  const question: Record<SignupStepId, { title: string; line: string }> = {
    name: { title: copy.nameTitle, line: copy.nameLine },
    email: { title: copy.emailTitle, line: copy.emailLine },
    password: { title: copy.passwordTitle, line: copy.passwordLine },
    household: creating
      ? { title: copy.householdNewTitle, line: copy.householdNewLine }
      : { title: copy.householdJoinTitle, line: copy.householdJoinLine },
  };
  const nextOnSubmit = { returnKeyType: "next", submitBehavior: "submit", onSubmitEditing: flow.submit } as const;

  return (
    <>
      <ThemedText size={skin.type.label} color={ink} style={styles.stepLabel}>
        {copy.signupStep(flow.step + 1, flow.stepCount)}
      </ThemedText>

      <Animated.View
        key={stepId === "household" ? `household-${householdChoice}` : stepId}
        {...swapAnimation}
        style={styles.step}
      >
        <View style={styles.question}>
          <Title size={skin.type.display.md} lines={2} color={ink}>
            {question[stepId].title}
          </Title>
          <ThemedText size={skin.type.body} color={ink}>
            {question[stepId].line}
          </ThemedText>
        </View>

        {stepId === "name" && (
          <>
            <FormInput
              autoFocus
              placeholder={skin.copy.placeholders.username}
              autoCapitalize="none"
              maxLength={flow.nameLimits?.max}
              value={flow.username}
              onChangeText={flow.setUsername}
              {...nextOnSubmit}
            />
            {flow.nameLimits && (
              <ThemedText size={skin.type.label} color={ink} style={styles.note}>
                {common.nameLength(flow.nameLimits.min, flow.nameLimits.max)}
              </ThemedText>
            )}
          </>
        )}

        {stepId === "email" && (
          <FormInput
            autoFocus
            placeholder={skin.copy.placeholders.email}
            type="email"
            value={flow.email}
            onChangeText={flow.setEmail}
            {...nextOnSubmit}
          />
        )}

        {stepId === "password" && (
          <>
            <FormInput
              autoFocus
              placeholder={skin.copy.placeholders.password}
              type="password"
              value={flow.password}
              onChangeText={flow.setPassword}
            />
            <FormInput
              placeholder={skin.copy.placeholders.confirm}
              type="password"
              value={flow.confirmPassword}
              onChangeText={flow.setConfirmPassword}
              {...nextOnSubmit}
            />
            <PasswordRules
              rules={flow.passwordRules}
              showMatch={flow.confirmPassword.length > 0}
              match={flow.passwordsMatch}
              ink={ink}
            />
          </>
        )}
      </Animated.View>

      {stepId === "household" && (
        <>
          <KilToggleButton
            value={householdChoice}
            onChange={flow.setHouseholdChoice}
            options={[
              { label: copy.createHousehold, value: "create" },
              { label: copy.joinHousehold, value: "join" },
            ]}
          />
          {creating && (
            <Animated.View key="create" {...swapAnimation}>
              <FormInput
                placeholder={skin.copy.placeholders.householdName}
                value={flow.householdName}
                onChangeText={flow.setHouseholdName}
              />
            </Animated.View>
          )}
          {!creating && !scanning && (
            <Animated.View key="join" {...swapAnimation}>
              <FormInput
                placeholder={skin.copy.placeholders.householdCode}
                value={flow.joinCode}
                onChangeText={flow.setJoinCode}
                autoCapitalize="characters"
                maxLength={6}
                action={{ label: copy.scan, onPress: () => setScanning(true), icon: QrCodeIcon }}
              />
            </Animated.View>
          )}
          {!creating && scanning && (
            <Animated.View key="scanner" {...swapAnimation} style={styles.scanner}>
              <QrCodeScanner
                onScanned={(data) => {
                  flow.setJoinCode(data);
                  setScanning(false);
                }}
              />
              <KilButton
                height={skin.size.button.sm}
                fontSize={skin.type.label}
                label={copy.typeCode}
                variant="secondaryOnLight"
                onTouch={() => setScanning(false)}
              />
            </Animated.View>
          )}
        </>
      )}
    </>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    stepLabel: { opacity: 0.7 },
    step: { gap: s.spacing.inline },
    question: { gap: s.spacing.small, marginBottom: s.spacing.stack },
    note: { opacity: 0.7, paddingHorizontal: fieldInset(s) },
    scanner: { gap: s.spacing.inline },
  });

export default SignupStep;
