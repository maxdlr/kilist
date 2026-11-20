import common from "@/i18n/common";
import type { Skin } from "@/skins/types";
import BottomPanel from "@/components/elements/BottomPanel";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import KilToggleButton from "@/components/elements/KilToggleButton";
import QrCodeScanner from "@/components/elements/QrCodeScanner";
import Title from "@/components/elements/Title";
import { HouseholdChoice } from "@/providers/AuthProvider";
import { usePanelSkin, useSkinStyles } from "@/providers/SkinProvider";
import { FeedbackCard, useFormFeedback } from "@/components/elements/Feedback";
import type { Problem } from "@/utils/problem";
import { type MutableRefObject, useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { QrCodeIcon } from "@/components/icons";

const SWAP_DURATION = 200;

type CloseGuard = MutableRefObject<() => boolean>;

const SwitchHouseholdForm = ({
  onSubmit,
  onClose,
  guardRef,
}: {
  onSubmit: (choice: HouseholdChoice) => Promise<Problem | null>;
  onClose: () => void;
  guardRef: CloseGuard;
}) => {
  const skin = usePanelSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.account;
  const login = skin.copy.login;
  const form = useFormFeedback(["joinCode", "name"] as const);

  const [choice, setChoiceValue] = useState<"join" | "create">("join");
  const [joinCode, setJoinCodeValue] = useState("");
  const [householdName, setHouseholdNameValue] = useState("");
  const setChoice = (next: "join" | "create") => {
    setChoiceValue(next);
    form.touch();
  };
  const setJoinCode = (next: string) => {
    setJoinCodeValue(next);
    form.touch("joinCode");
  };
  const setHouseholdName = (next: string) => {
    setHouseholdNameValue(next);
    form.touch("name");
  };
  const [showScanner, setShowScanner] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const isDirty = joinCode.trim() !== "" || householdName.trim() !== "";

  useEffect(() => {
    guardRef.current = () => {
      if (!isDirty || confirming) return true;
      setConfirming(true);
      return false;
    };
  }, [guardRef, isDirty, confirming]);

  const handleSubmit = async () => {
    if (choice === "join") {
      if (!joinCode) {
        form.fail("joinCode", common.householdCodeMissing);
        return;
      }
      const failed = await onSubmit({ householdChoice: "join", joinCode });
      if (form.settle(failed, common.feedback.saveFailed)) onClose();
      return;
    }

    const failed = await onSubmit({
      householdChoice: "create",
      householdName: householdName || undefined,
    });
    if (form.settle(failed, common.feedback.saveFailed)) onClose();
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
            labelColor={skin.panel.ink}
            value={householdName}
            onChangeText={setHouseholdName}
            error={form.of("name")}
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
          labelColor={skin.panel.ink}
          value={joinCode}
          onChangeText={setJoinCode}
          error={form.of("joinCode")}
          autoCapitalize="characters"
          maxLength={6}
          action={{ label: login.scan, onPress: () => setShowScanner(true), icon: QrCodeIcon }}
        />
      </Animated.View>
    );
  };

  if (confirming) {
    return (
      <>
        <Title size={skin.type.headline} lines={3} color={skin.panel.title}>
          {skin.copy.inventory.discardTitle}
        </Title>
        <View style={styles.actions}>
          <KilButton
            flex={1}
            height={skin.size.button.md}
            fontSize={skin.type.lead}
            variant={skin.panel.secondary}
            label={skin.copy.inventory.discardLeave}
            onTouch={onClose}
          />
          <KilButton
            flex={1}
            height={skin.size.button.md}
            fontSize={skin.type.lead}
            label={skin.copy.inventory.discardKeep}
            onTouch={() => setConfirming(false)}
          />
        </View>
      </>
    );
  }

  return (
    <>
      <Title size={skin.type.headline} lines={1} color={skin.panel.title}>
        {copy.switchTitle}
      </Title>

      <KilToggleButton
        value={choice}
        onChange={setChoice}
        onDark={skin.panel.ink === skin.colors.onGround}
        options={[
          { label: copy.joinExisting, value: "join" },
          { label: copy.createNew, value: "create" },
        ]}
      />

      {renderBody()}

      <FeedbackCard feedback={form.problem} collapse={skin.spacing.stack} />

      <View style={styles.actions}>
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
  onSubmit: (choice: HouseholdChoice) => Promise<Problem | null>;
  onClose: () => void;
}) => {
  const guardRef = useRef(() => true);
  const canClose = useCallback(() => guardRef.current(), []);

  return (
    <BottomPanel visible={visible} onClose={onClose} dismissible canClose={canClose}>
      <SwitchHouseholdForm onSubmit={onSubmit} onClose={onClose} guardRef={guardRef} />
    </BottomPanel>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: s.spacing.inline,
      justifyContent: "center",
    },
    scanner: {
      gap: s.spacing.tight,
    },
  });

export default SwitchHouseholdModal;
