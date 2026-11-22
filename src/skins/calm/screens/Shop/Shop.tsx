import { FeedbackSlot } from "@/components/elements/Feedback";
import ShopPanels from "@/components/features/Shop/ShopPanels";
import useShopRun from "@/hooks/screens/useShopRun";
import { useSkin } from "@/providers/SkinProvider";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import T from "@/skins/calm/text";
import { CButton } from "@/skins/calm/components";
import { CalmLoading, CalmMessage } from "../States";
import ShopPreview from "./_components/ShopPreview";
import ShopRunView from "./_components/ShopRunView";
import GLASS from "./glass";

const CalmShop = () => {
  const skin = useSkin();
  const [result, setResult] = useState<{ bought: number; left: number } | null>(null);
  const run = useShopRun({
    onSaved: (bought) => setResult({ bought, left: Math.max(0, run.total - bought) }),
  });

  const close = () => {
    setResult(null);
    run.reset();
  };

  if (result) {
    return (
      <CalmMessage
        glassLook={GLASS}
        mark="done"
        title={T.done}
        line={T.shop.result(result.bought, result.left)}
        dock={<CButton label={T.shop.closeRun} onPress={close} />}
      />
    );
  }

  if (run.isLoading) return <CalmLoading />;

  if (!run.isStarted && !run.isEmpty) return <ShopPreview run={run} />;

  if (run.isEmpty) {
    return (
      <View style={styles.flex}>
        <CalmMessage
          glassLook={GLASS}
          title={skin.copy.shop.emptyTitle}
          line={skin.copy.shop.emptyLine}
          onRefresh={run.refreshEmpty}
        >
          <FeedbackSlot place="list" />
        </CalmMessage>
        <ShopPanels run={run} />
      </View>
    );
  }

  return <ShopRunView run={run} />;
};

const styles = StyleSheet.create({ flex: { flex: 1 } });

export default CalmShop;
