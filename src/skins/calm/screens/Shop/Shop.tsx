import { FeedbackSlot } from "@/components/elements/Feedback";
import ShopPanels from "@/components/features/Shop/ShopPanels";
import useShopRun from "@/hooks/screens/useShopRun";
import { useSkin } from "@/providers/SkinProvider";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { CalmLoading, CalmMessage } from "../States";
import ShopListView from "./_components/ShopListView";
import TripRecap from "./_components/TripRecap";
import { tripSummary, type TripSummary } from "./useShopView";

const CalmShop = () => {
  const skin = useSkin();
  const [recap, setRecap] = useState<TripSummary | null>(null);
  const run = useShopRun({ onSaved: () => setRecap(tripSummary(run)) });

  if (recap) {
    return (
      <TripRecap
        summary={recap}
        onClose={() => {
          setRecap(null);
          run.reset();
        }}
      />
    );
  }

  if (run.isLoading) return <CalmLoading />;

  if (run.isEmpty) {
    return (
      <View style={styles.flex}>
        <CalmMessage title={skin.copy.shop.emptyTitle} line={skin.copy.shop.emptyLine} onRefresh={run.refreshEmpty}>
          <FeedbackSlot place="list" />
        </CalmMessage>
        <ShopPanels run={run} />
      </View>
    );
  }

  return <ShopListView run={run} />;
};

const styles = StyleSheet.create({ flex: { flex: 1 } });

export default CalmShop;
