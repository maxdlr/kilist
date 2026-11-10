import BottomPanel from "@/components/elements/BottomPanel";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import common from "@/i18n/common";
import useAuth from "@/providers/AuthProvider";
import { useSkin } from "@/providers/SkinProvider";
import useToast from "@/providers/ToastProvider";
import { syncNow } from "@/offline/engine";
import axios from "@/services/axios";
import { UserType } from "@/types/model";
import { useState } from "react";

const messageOf = (error: any) => error?.response?.data?.message || common.needsConnection;

const EmailCodeModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const skin = useSkin();
  const T = common.emailCode;
  const { user, mutateUser } = useAuth();
  const { showToast } = useToast();
  const [code, setCode] = useState("");

  const confirm = async () => {
    try {
      await axios.post<UserType>("/me/email/confirm", { code });
      await syncNow().catch(() => {});
      await mutateUser();
      setCode("");
      showToast(T.done, "info");
      onClose();
    } catch (error) {
      showToast(messageOf(error));
    }
  };

  const resend = async () => {
    try {
      await axios.post("/me/email/code", {});
      showToast(T.sent, "info");
    } catch (error) {
      showToast(messageOf(error));
    }
  };

  return (
    <BottomPanel visible={visible} onClose={onClose} dismissible>
      <Title size={skin.type.headline} lines={1} color={skin.panel.title}>
        {T.title}
      </Title>
      <ThemedText size={skin.type.body} color={skin.panel.ink}>
        {T.line(user?.email ?? "")}
      </ThemedText>
      <FormInput
        label={T.code}
        labelColor={skin.panel.ink}
        type="number"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />
      <KilButton height={skin.size.button.md} fontSize={skin.type.lead} label={T.confirm} onTouch={confirm} />
      <KilButton
        height={skin.size.button.sm}
        fontSize={skin.type.label}
        variant={skin.panel.secondary}
        label={T.resend}
        onTouch={resend}
      />
    </BottomPanel>
  );
};

export default EmailCodeModal;
