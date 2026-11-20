import BottomPanel from "@/components/elements/BottomPanel";
import FormInput from "@/components/elements/FormInput";
import KilButton, { ButtonKindOverride } from "@/components/elements/KilButton";
import Title from "@/components/elements/Title";
import { ThemedText } from "@/components/elements/ThemedText";
import common from "@/i18n/common";
import useAuth from "@/providers/AuthProvider";
import { useSkin } from "@/providers/SkinProvider";
import { ActionNote, FeedbackCard, useFormFeedback } from "@/components/elements/Feedback";
import useMark from "@/providers/MarkProvider";
import { problemOf } from "@/utils/problem";
import { syncNow } from "@/offline/engine";
import axios from "@/services/axios";
import { UserType } from "@/types/model";
import { useEffect, useState } from "react";

const RESEND_WAIT_S = 30;

const EmailCodeModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const skin = useSkin();
  const T = common.emailCode;
  const { user, mutateUser } = useAuth();
  const { mark } = useMark();
  const form = useFormFeedback(["code"] as const);
  const [code, setCodeValue] = useState("");
  const [sent, setSent] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((left) => left - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const setCode = (next: string) => {
    setCodeValue(next);
    form.touch("code");
  };

  const confirm = async () => {
    try {
      await axios.post<UserType>("/me/email/confirm", { code });
      await syncNow().catch(() => {});
      await mutateUser();
      setCodeValue("");
      onClose();
      mark("done", T.done);
    } catch (error) {
      form.settle(problemOf(error), common.feedback.saveFailed);
    }
  };

  const send = async () => {
    try {
      await axios.post("/me/email/code", {});
      form.touch();
      if (sent) setWait(RESEND_WAIT_S);
      setSent(true);
    } catch (error) {
      form.settle(problemOf(error), common.feedback.saveFailed);
    }
  };

  return (
    <BottomPanel visible={visible} onClose={onClose} dismissible>
      <Title size={skin.type.headline} lines={1} color={skin.panel.title}>
        {T.title}
      </Title>
      <ThemedText size={skin.type.body} color={skin.panel.ink}>
        {sent ? T.line(user?.email ?? "") : T.sendLine(user?.email ?? "")}
      </ThemedText>
      {sent ? (
        <>
          <FormInput
            label={T.code}
            labelColor={skin.panel.ink}
            type="number"
            maxLength={6}
            value={code}
            onChangeText={setCode}
            error={form.of("code")}
          />
          <FeedbackCard feedback={form.problem} collapse={skin.spacing.stack} />
          <KilButton height={skin.size.button.md} fontSize={skin.type.lead} label={T.confirm} onTouch={confirm} />
          <ActionNote reason={wait > 0 ? common.feedback.codeSent(wait) : null} collapse={skin.spacing.stack} />
          <KilButton
            height={skin.size.button.sm}
            fontSize={skin.type.label}
            variant={skin.panel.secondary}
            label={T.resend}
            onTouch={send}
            disabled={wait > 0}
          />
        </>
      ) : (
        <>
          <FeedbackCard feedback={form.problem} collapse={skin.spacing.stack} />
          <KilButton height={skin.size.button.md} fontSize={skin.type.lead} label={T.send} onTouch={send} />
          <ButtonKindOverride.Provider value={null}>
            <KilButton
              height={skin.size.button.sm}
              fontSize={skin.type.label}
              variant="ghost"
              label={T.haveCode}
              onTouch={() => setSent(true)}
            />
          </ButtonKindOverride.Provider>
        </>
      )}
    </BottomPanel>
  );
};

export default EmailCodeModal;
