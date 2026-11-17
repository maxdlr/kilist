import { useState } from "react";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import { useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const useKeyboardOpen = () => {
  const { progress } = useReanimatedKeyboardAnimation();
  const [open, setOpen] = useState(false);

  useAnimatedReaction(
    () => progress.value > 0.5,
    (now, before) => {
      if (now !== before) scheduleOnRN(setOpen, now);
    },
  );

  return open;
};

export default useKeyboardOpen;
