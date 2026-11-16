import ActionPanel from "@/components/elements/ActionPanel";
import BottomPanel from "@/components/elements/BottomPanel";
import LevelPicker from "@/components/elements/LevelPicker";
import Title from "@/components/elements/Title/Title";
import type { ShopRun } from "@/hooks/screens/useShopRun";
import { useSkin } from "@/providers/SkinProvider";
import { caseFor } from "@/skins";
import { levelOf } from "@/utils/scoreUtils";

const FoodLevelPanel = ({ run }: { run: ShopRun }) => {
  const skin = useSkin();
  const food = run.levelFood;

  return (
    <>
      <BottomPanel visible={food !== null} onClose={run.closeLevel} dismissible>
        {food && (
          <>
            <Title size={skin.type.headline} lines={2} color={skin.panel.title}>
              {caseFor(skin, food.name)}
            </Title>
            <LevelPicker
              label={skin.copy.inventory.status}
              value={levelOf(food.inStockScore)}
              onChange={run.pickLevel}
            />
          </>
        )}
      </BottomPanel>
      <ActionPanel request={run.leaveRequest} onClose={run.closeLeave} />
    </>
  );
};

export default FoodLevelPanel;
