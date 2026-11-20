import BottomPanel from "@/components/elements/BottomPanel";
import { ActionNote, FeedbackCard } from "@/components/elements/Feedback";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import { ThemedText } from "@/components/elements/ThemedText";
import Title from "@/components/elements/Title";
import type { AuthFlow } from "@/hooks/screens/useAuthFlow";
import common from "@/i18n/common";
import { useSkin } from "@/providers/SkinProvider";

const JoinCodePanel = ({ flow }: { flow: AuthFlow }) => {
  const skin = useSkin();
  const T = common.emailGate;

  return (
    <BottomPanel visible={flow.joinStep} onClose={() => {}}>
      <Title size={skin.type.headline} lines={2} color={skin.panel.title}>
        {T.joinTitle}
      </Title>
      <ThemedText size={skin.type.body} color={skin.panel.ink}>
        {flow.codeSent ? T.joinLine(flow.email) : T.joinSendLine(flow.email)}
      </ThemedText>
      {flow.codeSent ? (
        <>
          <FormInput
            placeholder={common.emailCode.code}
            type="number"
            maxLength={6}
            value={flow.emailCode}
            onChangeText={flow.setEmailCode}
            error={flow.fieldError("code")}
          />
          <FeedbackCard feedback={flow.joinStep ? flow.problem : null} collapse={skin.spacing.stack} />
          <KilButton
            height={skin.size.button.md}
            fontSize={skin.type.lead}
            label={common.emailCode.confirm}
            onTouch={() => flow.finishJoin(true)}
          />
          <KilButton
            height={skin.size.button.sm}
            fontSize={skin.type.label}
            variant={skin.panel.secondary}
            label={common.emailCode.resend}
            onTouch={flow.sendCode}
            disabled={flow.resendWait > 0}
          />
          <ActionNote
            reason={flow.resendWait > 0 ? common.feedback.codeSent(flow.resendWait) : null}
            collapse={skin.spacing.stack}
          />
        </>
      ) : (
        <>
          <FeedbackCard feedback={flow.joinStep ? flow.problem : null} collapse={skin.spacing.stack} />
          <KilButton
            height={skin.size.button.md}
            fontSize={skin.type.lead}
            label={common.emailCode.send}
            onTouch={flow.sendCode}
          />
        </>
      )}
      <KilButton
        height={skin.size.button.sm}
        fontSize={skin.type.label}
        variant={skin.panel.secondary}
        label={T.joinSkip}
        onTouch={() => flow.finishJoin(false)}
      />
    </BottomPanel>
  );
};

export default JoinCodePanel;
