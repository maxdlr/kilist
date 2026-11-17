import { useEffect, useState } from "react";
import { AppState } from "react-native";

const useResumeCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let last = AppState.currentState;
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active" && last !== "active") setCount((value) => value + 1);
      last = next;
    });
    return () => subscription.remove();
  }, []);

  return count;
};

export default useResumeCount;
