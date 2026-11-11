import { ShopListProvider } from "@/providers/ShopListProvider";
import { SkinScreen } from "@/skins/screens";
import { StyleSheet } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

const ShopScreen = () => {
  return (
    <ShopListProvider>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <SkinScreen slot="Shop" />
      </KeyboardAvoidingView>
    </ShopListProvider>
  );
};

const styles = StyleSheet.create({ flex: { flex: 1 } });

export default ShopScreen;
