import BottomPanel from "@/components/elements/BottomPanel";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import common from "@/i18n/common";
import useAuth from "@/providers/AuthProvider";
import { useSkin } from "@/providers/SkinProvider";
import useToast from "@/providers/ToastProvider";
import { useState } from "react";

const NAME_LENGTH = 30;

const GuestNameForm = ({ onClose }: { onClose: () => void }) => {
  const skin = useSkin();
  const T = common.guestRename;
  const { guestName, renameGuest } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(guestName);

  const save = async () => {
    try {
      await renameGuest(name.trim());
      onClose();
    } catch {
      showToast(common.unexpected);
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

const GuestNameModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <BottomPanel visible={visible} onClose={onClose} dismissible>
    {visible && <GuestNameForm onClose={onClose} />}
  </BottomPanel>
);

export default GuestNameModal;
