import BottomPanel from "@/components/elements/BottomPanel";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import common from "@/i18n/common";
import { useSkin } from "@/providers/SkinProvider";
import useToast from "@/providers/ToastProvider";
import axios from "@/services/axios";
import { useState } from "react";
import { useKeyboardState } from "react-native-keyboard-controller";

const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
const messageOf = (error: any) => error?.response?.data?.message || common.needsConnection;

const ResetPasswordModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const skin = useSkin();
  const T = common.reset;
  const { showToast } = useToast();
  const isKeyboardOpen = useKeyboardState((state) => state.isVisible);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  const close = () => {
    setStep("email");
    setCode("");
    setPassword("");
    onClose();
  };

  const send = async () => {
    if (!email.trim()) return;
    try {
      await axios.post("/password/forgot", { email: email.trim() });
      setStep("code");
    } catch (error) {
      showToast(messageOf(error));
    }
  };

  const save = async () => {
    if (!STRONG_PASSWORD.test(password)) {
      showToast(T.weak);
      return;
    }
    try {
      await axios.post("/password/reset", { email: email.trim(), code, password });
      showToast(T.done, "info");
      close();
    } catch (error) {
      showToast(messageOf(error));
    }
  };

  return (
    <BottomPanel visible={visible} onClose={close} dismissible>
      <Title size={skin.type.headline} lines={1} color={skin.panel.title}>
        {T.title}
      </Title>
      {!(isKeyboardOpen && step === "code") && (
        <ThemedText size={skin.type.body} color={skin.panel.ink}>
          {step === "email" ? T.emailLine : T.codeLine(email.trim())}
        </ThemedText>
      )}
      {step === "email" ? (
        <FormInput label={T.email} labelColor={skin.panel.ink} type="email" value={email} onChangeText={setEmail} />
      ) : (
        <>
          <FormInput label={T.code} labelColor={skin.panel.ink} type="number" maxLength={6} value={code} onChangeText={setCode} />
          <FormInput label={T.password} labelColor={skin.panel.ink} type="password" value={password} onChangeText={setPassword} />
        </>
      )}
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
