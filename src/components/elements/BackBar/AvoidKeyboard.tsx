import { createContext, ReactNode } from "react";
import { StyleSheet } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useBackBarOffset } from "./BackBar";

export const KeyboardAvoided = createContext(false);

const AvoidKeyboard = ({ children }: { children: ReactNode }) => (
  <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={useBackBarOffset()}>
    <KeyboardAvoided.Provider value>{children}</KeyboardAvoided.Provider>
  </KeyboardAvoidingView>
);

const styles = StyleSheet.create({ flex: { flex: 1 } });

export default AvoidKeyboard;
