import useInventory, { InventoryProvider } from "@/providers/InventoryProvider";
import { useSkin } from "@/providers/SkinProvider";
import { caseFor } from "@/skins";
import type { FoodType, ListType } from "@/types/model";
import useSWR, { useSWRConfig } from "swr";
import FoodFormModal from "./FoodFormModal";

type Props = { food: FoodType | null; onClose: () => void };

const EditFoodPanel = ({ food, onClose }: Props) => {
  const { data: mainList } = useSWR<ListType>({ url: "lists/read?main=true" });
  const listIds = mainList?.id ? [Number(mainList.id)] : undefined;

  return (
    <InventoryProvider listIds={listIds}>
      <EditFoodForm food={food} onClose={onClose} />
    </InventoryProvider>
  );
};

const EditFoodForm = ({ food, onClose }: Props) => {
  const skin = useSkin();
  const { editFood } = useInventory();
  const { mutate } = useSWRConfig();

  return (
    <FoodFormModal
      visible={food !== null}
      formKey={food?.id}
      creating={false}
      title={skin.copy.inventory.editTitle(food ? caseFor(skin, food.name) : "")}
      initialName={food?.name}
      initialFrequency={food?.frequencyDays}
      onSubmit={async (data) => {
        if (!food) return false;
        const saved = await editFood(food.id, data);
        if (saved) {
          mutate((key) => typeof key === "object" && key !== null && (key as { url?: string }).url === "shop-list/preview");
        }
        return saved;
      }}
      onClose={onClose}
    />
  );
};

export default EditFoodPanel;
