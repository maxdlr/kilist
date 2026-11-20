import { KeyboardAvoided } from "@/components/elements/BackBar";
import { ShopListProvider } from "@/providers/ShopListProvider";
import { SkinScreen } from "@/skins/screens";
import { StyleSheet } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

const ShopScreen = () => {
  return (
    <ShopListProvider>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <KeyboardAvoided.Provider value>
          <SkinScreen slot="Shop" />
        </KeyboardAvoided.Provider>
      </KeyboardAvoidingView>
    </ShopListProvider>
  );
};

const styles = StyleSheet.create({ flex: { flex: 1 } });

export default ShopScreen;
