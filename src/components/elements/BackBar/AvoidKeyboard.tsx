import { ReactNode } from "react";
import { StyleSheet } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useBackBarOffset } from "./BackBar";

const AvoidKeyboard = ({ children }: { children: ReactNode }) => (
  <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={useBackBarOffset()}>
    {children}
  </KeyboardAvoidingView>
);

const styles = StyleSheet.create({ flex: { flex: 1 } });

export default AvoidKeyboard;
