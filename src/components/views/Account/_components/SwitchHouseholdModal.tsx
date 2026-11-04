import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import KilToggleButton from "@/components/elements/KilToggleButton";
import QrCodeScanner from "@/components/elements/QrCodeScanner";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { HouseholdChoice } from "@/providers/AuthProvider";
import useToast from "@/providers/ToastProvider";
import { useState } from "react";
import { Modal, StyleSheet } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

const SwitchHouseholdModal = ({
  visible,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  onSubmit: (choice: HouseholdChoice) => Promise<boolean>;
  onClose: () => void;
}) => {
  const theme = useTheme();
  const { showToast } = useToast();

  // Modal unmounts its children when hidden, so these reset on each reopen.
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

  // Each swappable block fades in/out on mount/unmount; a shared transition
  // duration keeps the crossfade and the card's resize visually in sync.
  const SWAP_DURATION = 200;

  const renderBody = () => {
    if (choice === "create") {
      return (
        <Animated.View
          key="create"
          entering={FadeIn.duration(SWAP_DURATION)}
          exiting={FadeOut.duration(SWAP_DURATION)}
        >
          <FormInput
            label="Household name (optional)"
            value={householdName}
            onChangeText={setHouseholdName}
          />
        </Animated.View>
      );
    }

    if (showScanner) {
      return (
        <Animated.View
          key="scanner"
          entering={FadeIn.duration(SWAP_DURATION)}
          exiting={FadeOut.duration(SWAP_DURATION)}
          style={{ gap: Spacing.two }}
        >
          <QrCodeScanner
            onScanned={(data) => {
              setJoinCode(data);
              setShowScanner(false);
            }}
          />
          <ThemedText type="link" onPress={() => setShowScanner(false)}>
            Enter code manually instead
          </ThemedText>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        key="join"
        entering={FadeIn.duration(SWAP_DURATION)}
        exiting={FadeOut.duration(SWAP_DURATION)}
        style={{ gap: Spacing.two }}
      >
        <FormInput
          label="Household code"
          value={joinCode}
          onChangeText={setJoinCode}
          autoCapitalize="characters"
          maxLength={6}
        />
        <ThemedText type="link" onPress={() => setShowScanner(true)}>
          Scan QR code instead
        </ThemedText>
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior="padding"
        automaticOffset
      >
        <Animated.View
          layout={LinearTransition.duration(SWAP_DURATION)}
          style={[styles.card, { backgroundColor: theme.background }]}
        >
          <ThemedText type="smallBold">Switch household</ThemedText>

          <KilToggleButton
            value={choice}
            onChange={setChoice}
            options={[
              { label: "Join existing", value: "join" },
              { label: "Create new", value: "create" },
            ]}
          />

          {renderBody()}

          <ThemedView style={styles.actions}>
            <KilButton label="Cancel" onTouch={onClose} />
            <KilButton label="Switch" onTouch={handleSubmit} />
          </ThemedView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: Spacing.four,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.three,
  },
  actions: {
    display: "flex",
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.two,
  },
});

export default SwitchHouseholdModal;
