import BottomPanel from "@/components/elements/BottomPanel";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title";
import { ThemedText } from "@/components/elements/ThemedText";
import common from "@/i18n/common";
import { useSkin } from "@/providers/SkinProvider";
import { FeedbackCard, Presence, useFormFeedback } from "@/components/elements/Feedback";
import { problemOf } from "@/utils/problem";
import axios from "@/services/axios";
import { useState } from "react";
import useKeyboardOpen from "@/hooks/useKeyboardOpen";

const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

const ResetPasswordModal = ({
  visible,
  onClose,
  onDone,
}: {
  visible: boolean;
  onClose: () => void;
  onDone?: () => void;
}) => {
  const skin = useSkin();
  const T = common.reset;
  const form = useFormFeedback(["email", "code", "password"] as const);
  const isKeyboardOpen = useKeyboardOpen();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  const close = () => {
    form.touch();
    setStep("email");
    setCode("");
    setPassword("");
    onClose();
  };

  const send = async () => {
    if (!email.trim()) return;
    try {
      await axios.post("/password/forgot", { email: email.trim() });
      form.touch();
      setStep("code");
    } catch (error) {
      form.settle(problemOf(error), common.feedback.saveFailed);
    }
  };

  const save = async () => {
    if (!STRONG_PASSWORD.test(password)) {
      form.fail("password", T.weak);
      return;
    }
    try {
      await axios.post("/password/reset", { email: email.trim(), code, password });
      close();
      onDone?.();
    } catch (error) {
      form.settle(problemOf(error), common.feedback.saveFailed);
    }
  };

  return (
    <BottomPanel visible={visible} onClose={close} dismissible>
      <Title size={skin.type.headline} lines={1} color={skin.panel.title}>
        {T.title}
      </Title>
      <Presence visible={!(isKeyboardOpen && step === "code")} collapse={skin.spacing.stack}>
        <ThemedText size={skin.type.body} color={skin.panel.ink}>
          {step === "email" ? T.emailLine : T.codeLine(email.trim())}
        </ThemedText>
      </Presence>
      {step === "email" ? (
        <FormInput
          placeholder={T.email}
          type="email"
          value={email}
          onChangeText={(next) => {
            setEmail(next);
            form.touch("email");
          }}
          error={form.of("email")}
        />
      ) : (
        <>
          <FormInput
            placeholder={T.code}
            type="number"
            maxLength={6}
            value={code}
            onChangeText={(next) => {
              setCode(next);
              form.touch("code");
            }}
            error={form.of("code")}
          />
          <FormInput
            placeholder={T.password}
            type="password"
            value={password}
            onChangeText={(next) => {
              setPassword(next);
              form.touch("password");
            }}
            error={form.of("password")}
          />
        </>
      )}
      <FeedbackCard feedback={form.problem} collapse={skin.spacing.stack} />
      <KilButton
        height={skin.size.button.md}
        fontSize={skin.type.lead}
        label={step === "email" ? T.send : T.save}
        onTouch={step === "email" ? send : save}
      />
      <KilButton
        height={skin.size.button.sm}
        fontSize={skin.type.label}
        variant={skin.panel.secondary}
        label={skin.copy.common.close}
        onTouch={close}
      />
    </BottomPanel>
  );
};

export default ResetPasswordModal;
