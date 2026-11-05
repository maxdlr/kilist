import type { Skin } from "@/skins/types";
import BottomPanel from "@/components/elements/BottomPanel";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import KilToggleButton from "@/components/elements/KilToggleButton";
import QrCodeScanner from "@/components/elements/QrCodeScanner";
import Title from "@/components/elements/Title/Title";
import { HouseholdChoice } from "@/providers/AuthProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import useToast from "@/providers/ToastProvider";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const SWAP_DURATION = 200;

const SwitchHouseholdForm = ({
  onSubmit,
  onClose,
}: {
  onSubmit: (choice: HouseholdChoice) => Promise<boolean>;
  onClose: () => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.account;
  const login = skin.copy.login;
  const { showToast } = useToast();

  const [choice, setChoice] = useState<"join" | "create">("join");
  const [joinCode, setJoinCode] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const handleSubmit = async () => {
    if (choice === "join") {
      if (!joinCode) {
        showToast("Enter a household code to join");
        return;
      }
      const success = await onSubmit({ householdChoice: "join", joinCode });
      if (success) onClose();
      return;
    }

    const success = await onSubmit({
      householdChoice: "create",
      householdName: householdName || undefined,
    });
    if (success) onClose();
  };

  const swap = {
    entering: FadeIn.duration(SWAP_DURATION),
    exiting: FadeOut.duration(SWAP_DURATION),
  };

  const renderBody = () => {
    if (choice === "create") {
      return (
        <Animated.View key="create" {...swap}>
          <FormInput
            label={login.householdName}
            placeholder={skin.copy.placeholders.householdName}
            labelColor={skin.colors.accent}
            value={householdName}
            onChangeText={setHouseholdName}
          />
        </Animated.View>
      );
    }

    if (showScanner) {
      return (
        <Animated.View key="scanner" {...swap} style={styles.scanner}>
          <QrCodeScanner
            onScanned={(data) => {
              setJoinCode(data);
              setShowScanner(false);
            }}
          />
          <KilButton
            variant="ghost"
            height={skin.size.button.xs}
            fontSize={skin.type.label}
            label={login.typeCode}
            onTouch={() => setShowScanner(false)}
          />
        </Animated.View>
      );
    }

    return (
      <Animated.View key="join" {...swap}>
        <FormInput
          label={login.householdCode}
          placeholder={skin.copy.placeholders.householdCode}
          labelColor={skin.colors.accent}
          value={joinCode}
          onChangeText={setJoinCode}
          autoCapitalize="characters"
          maxLength={6}
          action={{ label: login.scan, onPress: () => setShowScanner(true) }}
        />
      </Animated.View>
    );
  };

  return (
    <>
      <Title size={skin.type.headline} lines={1} color={skin.colors.accent}>
        {copy.switchTitle}
      </Title>

      <KilToggleButton
        value={choice}
        onChange={setChoice}
        onDark
        options={[
          { label: copy.joinExisting, value: "join" },
          { label: copy.createNew, value: "create" },
        ]}
      />

      {renderBody()}

      <View style={styles.actions}>
        <KilButton
          flex={1}
          height={skin.size.button.md}
          fontSize={skin.type.lead}
          variant="secondary"
          label={skin.copy.common.cancel}
          onTouch={onClose}
        />
        <KilButton
          flex={1}
          height={skin.size.button.md}
          fontSize={skin.type.lead}
          label={copy.switchAction}
          onTouch={handleSubmit}
        />
      </View>
    </>
  );
};

const SwitchHouseholdModal = ({
  visible,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  onSubmit: (choice: HouseholdChoice) => Promise<boolean>;
  onClose: () => void;
}) => (
  <BottomPanel visible={visible} onClose={onClose}>
    <SwitchHouseholdForm onSubmit={onSubmit} onClose={onClose} />
  </BottomPanel>
);

const createStyles = (s: Skin) =>
  StyleSheet.create({
    actions: {
      flexDirection: "row",
      gap: s.spacing.inline,
    },
    scanner: {
      gap: s.spacing.tight,
    },
  });

export default SwitchHouseholdModal;
