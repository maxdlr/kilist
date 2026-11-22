import { PlusIcon, UndoIcon } from "@/components/icons";
import type { ShopRun } from "@/hooks/screens/useShopRun";
import common from "@/i18n/common";
import { useSkin } from "@/providers/SkinProvider";
import { CButton } from "@/skins/calm/components";

const ShopDock = ({
  run,
  label,
  onPress,
  onUndo,
}: {
  run: ShopRun;
  label: string;
  onPress: () => void;
  onUndo?: () => void;
}) => {
  const skin = useSkin();
  return (
    <>
      {onUndo && (
        <CButton
          variant="secondary"
          accessibilityLabel={common.shop.undo}
          onPress={onUndo}
          disabled={!run.canUndo}
          icon={(color) => <UndoIcon size={skin.size.icon.action} color={color} strokeWidth={1.8} />}
        />
      )}
      <CButton
        variant="secondary"
        accessibilityLabel={common.shop.add}
        onPress={run.openAdd}
        icon={(color) => <PlusIcon size={skin.size.icon.action} color={color} strokeWidth={1.8} />}
      />
      <CButton label={label} onPress={onPress} />
    </>
  );
};

export default ShopDock;
