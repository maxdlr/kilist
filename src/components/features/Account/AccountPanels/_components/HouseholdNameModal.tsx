import BottomPanel from "@/components/elements/BottomPanel";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title";
import { ThemedText } from "@/components/elements/ThemedText";
import common from "@/i18n/common";
import useHousehold from "@/providers/HouseholdProvider";
import useMark from "@/providers/MarkProvider";
import { useSkin } from "@/providers/SkinProvider";
import { FeedbackCard, useFormFeedback } from "@/components/elements/Feedback";
import { problemOf } from "@/utils/problem";
import { useState } from "react";

const NAME_LENGTH = 40;

const HouseholdNameForm = ({ current, onClose }: { current: string; onClose: () => void }) => {
  const skin = useSkin();
  const T = common.householdRename;
  const { renameHousehold } = useHousehold();
  const form = useFormFeedback(["name"] as const);
  const { mark } = useMark();
  const [name, setName] = useState(current);

  const save = async () => {
    try {
      await renameHousehold(name.trim());
      onClose();
      mark("saved", common.marks.saved);
    } catch (err) {
      form.settle(problemOf(err), common.feedback.saveFailed);
    }
  };

  return (
    <>
      <Title size={skin.type.headline} lines={2} color={skin.panel.title}>
        {T.title}
      </Title>
      <ThemedText size={skin.type.body} color={skin.panel.ink}>
        {T.line}
      </ThemedText>
      <FormInput
        label={T.label}
        placeholder={skin.copy.account.householdFallback}
        labelColor={skin.panel.ink}
        maxLength={NAME_LENGTH}
        value={name}
        onChangeText={(next) => {
          setName(next);
          form.touch("name");
        }}
        error={form.of("name")}
      />
      <FeedbackCard feedback={form.problem} collapse={skin.spacing.stack} />
      <KilButton height={skin.size.button.md} fontSize={skin.type.lead} label={skin.copy.common.save} onTouch={save} />
    </>
  );
};

const HouseholdNameModal = ({
  visible,
  current,
  onClose,
}: {
  visible: boolean;
  current: string;
  onClose: () => void;
}) => (
  <BottomPanel visible={visible} onClose={onClose} dismissible>
    {visible && <HouseholdNameForm current={current} onClose={onClose} />}
  </BottomPanel>
);

export default HouseholdNameModal;
