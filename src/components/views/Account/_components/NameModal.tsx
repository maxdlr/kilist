import BottomPanel from "@/components/elements/BottomPanel";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import common from "@/i18n/common";
import useAuth from "@/providers/AuthProvider";
import useMark from "@/providers/MarkProvider";
import { useSkin } from "@/providers/SkinProvider";
import useToast from "@/providers/ToastProvider";
import { useState } from "react";

const NAME_LENGTH = 30;

const NameForm = ({ onClose }: { onClose: () => void }) => {
  const skin = useSkin();
  const T = common.guestRename;
  const { user, isGuest, guestName, rename } = useAuth();
  const { showToast } = useToast();
  const { mark } = useMark();
  const [name, setName] = useState(isGuest ? guestName : (user?.username ?? ""));

  const save = async () => {
    try {
      await rename(name.trim());
      onClose();
      mark("saved", common.marks.saved);
    } catch (err: any) {
      showToast(err?.response?.data?.message || common.unexpected);
    }
  };

  return (
    <>
      <Title size={skin.type.headline} lines={2} color={skin.panel.title}>
        {T.title}
      </Title>
      <ThemedText size={skin.type.body} color={skin.panel.ink}>
        {isGuest ? T.line : T.accountLine}
      </ThemedText>
      <FormInput
        label={T.label}
        placeholder={skin.copy.placeholders.username}
        labelColor={skin.panel.ink}
        maxLength={NAME_LENGTH}
        value={name}
        onChangeText={setName}
      />
      <KilButton height={skin.size.button.md} fontSize={skin.type.lead} label={skin.copy.common.save} onTouch={save} />
    </>
  );
};

const NameModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <BottomPanel visible={visible} onClose={onClose} dismissible>
    {visible && <NameForm onClose={onClose} />}
  </BottomPanel>
);

export default NameModal;
