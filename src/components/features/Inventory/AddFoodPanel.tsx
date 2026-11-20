import common from "@/i18n/common";
import useInventory, { InventoryProvider } from "@/providers/InventoryProvider";
import useMark from "@/providers/MarkProvider";
import { useSkin } from "@/providers/SkinProvider";
import { ListType } from "@/types/model";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import FoodFormModal from "./FoodFormModal";

const AddFoodPanel = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const { data: mainList } = useSWR<ListType>({ url: "lists/read?main=true" });
  const listIds = mainList?.id ? [Number(mainList.id)] : undefined;

  return (
    <InventoryProvider listIds={listIds}>
      <AddFoodForm visible={visible} onClose={onClose} />
    </InventoryProvider>
  );
};

const AddFoodForm = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const skin = useSkin();
  const { createFood } = useInventory();
  const { mark } = useMark();
  const { mutate } = useSWRConfig();
  const [opened, setOpened] = useState(0);
  const [wasVisible, setWasVisible] = useState(visible);

  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setOpened((count) => count + 1);
  }

  const add: typeof createFood = async (data) => {
    const failed = await createFood(data);
    if (failed) return failed;
    mark("added", common.marks.added(data.name.trim()));
    mutate((key) => typeof key === "object" && key !== null && (key as { url?: string }).url === "shop-list/preview");
    return null;
  };

  return (
    <FoodFormModal
      visible={visible}
      formKey={`add-${opened}`}
      scannable
      title={skin.copy.inventory.addTitle}
      initialName=""
      onSubmit={add}
      onClose={onClose}
    />
  );
};

export default AddFoodPanel;
