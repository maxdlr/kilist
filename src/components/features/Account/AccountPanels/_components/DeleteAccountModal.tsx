import BottomPanel from "@/components/elements/BottomPanel";
import FormInput from "@/components/elements/FormInput";
import KilButton, { ButtonKindOverride } from "@/components/elements/KilButton";
import Title from "@/components/elements/Title";
import { ThemedText } from "@/components/elements/ThemedText";
import common from "@/i18n/common";
import useAuth from "@/providers/AuthProvider";
import { useSkin } from "@/providers/SkinProvider";
import { router } from "expo-router";
import { useState } from "react";

const sameName = (typed: string, username: string) =>
  username.length > 0 && typed.trim().toLowerCase() === username.trim().toLowerCase();

const DeleteForm = ({ onClose }: { onClose: () => void }) => {
  const skin = useSkin();
  const copy = skin.copy.account;
  const { user, deleteAccount } = useAuth();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = sameName(typed, user?.username ?? "") && !busy;

  const remove = async () => {
    if (!ready) return;
    setBusy(true);
    const success = await deleteAccount();
    setBusy(false);
    if (!success) return;
    onClose();
    router.replace("/");
  };

  return (
    <>
      <Title size={skin.type.headline} lines={2} color={skin.panel.title}>
        {copy.deleteTitle}
      </Title>
      <ThemedText size={skin.type.body} color={skin.panel.ink}>
        {copy.deleteLine}
      </ThemedText>
      <FormInput
        label={common.deleteAccount.typeName}
        labelColor={skin.panel.ink}
        autoCapitalize="none"
        autoCorrect={false}
        value={typed}
        onChangeText={setTyped}
      />
      <ButtonKindOverride.Provider value={null}>
        <KilButton
          height={skin.size.button.md}
          fontSize={skin.type.lead}
          variant="danger"
          label={copy.deleteAction}
          disabled={!ready}
          onTouch={remove}
        />
        <KilButton
          height={skin.size.button.sm}
          fontSize={skin.type.label}
          variant={skin.panel.secondary}
          label={copy.deleteKeep}
          onTouch={onClose}
        />
      </ButtonKindOverride.Provider>
    </>
  );
};

const DeleteAccountModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <BottomPanel visible={visible} onClose={onClose} dismissible>
    {visible && <DeleteForm onClose={onClose} />}
  </BottomPanel>
);

export default DeleteAccountModal;
