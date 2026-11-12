import type { ActionPanelRequest } from "@/components/elements/ActionPanel";
import common from "@/i18n/common";
import useInventory from "@/providers/InventoryProvider";
import useMark from "@/providers/MarkProvider";
import { useSkin } from "@/providers/SkinProvider";
import { caseFor } from "@/skins";
import { FoodType } from "@/types/model";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";

const useInventoryShelf = () => {
  const skin = useSkin();
  const copy = skin.copy.inventory;
  const list = useInventory();
  const { mark } = useMark();
  const { foods, search, mutateFood, removeFoodsFromList } = list;
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isAddVisible, setIsAddVisible] = useState(false);
  const [addInitialName, setAddInitialName] = useState("");
  const [addWithScan, setAddWithScan] = useState(false);
  const [addKey, setAddKey] = useState(0);
  const { scan: scanRequested } = useLocalSearchParams<{ scan?: string }>();
  const [editingFood, setEditingFood] = useState<FoodType | null>(null);
  const [actionRequest, setActionRequest] = useState<ActionPanelRequest | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      mutateFood();
    }, [mutateFood]),
  );

  const toggleSelect = (foodId: number) => {
    setSelectedIds((prev) =>
      prev.includes(foodId)
        ? prev.filter((id) => id !== foodId)
        : [...prev, foodId],
    );
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds([]);
  };

  const closeActionPanel = useCallback(() => setActionRequest(null), []);
  const closeAdd = useCallback(() => setIsAddVisible(false), []);
  const closeEdit = useCallback(() => setEditingFood(null), []);

  const openAdd = (initialName = "", withScan = false) => {
    setEditingFood(null);
    setAddInitialName(initialName);
    setAddWithScan(withScan);
    setAddKey((key) => key + 1);
    setIsAddVisible(true);
  };

  const [handledScan, setHandledScan] = useState<string | undefined>();

  if (scanRequested !== handledScan) {
    setHandledScan(scanRequested);
    if (scanRequested) openAdd("", true);
  }

  useEffect(() => {
    if (scanRequested) router.setParams({ scan: undefined });
  }, [scanRequested]);

  const askRemove = (ids: number[], title: string) => {
    setActionRequest({
      title,
      message: copy.removeLine,
      cancelLabel: skin.copy.common.keep,
      actions: [
        {
          label: skin.copy.common.remove,
          destructive: true,
          onPress: async () => {
            const removed = await removeFoodsFromList(ids);
            exitSelectMode();
            if (removed) mark("removed", common.marks.removed(ids.length));
          },
        },
      ],
    });
  };

  const removeEditing = () => {
    if (!editingFood) return;
    const food = editingFood;
    setEditingFood(null);
    askRemove([food.id], copy.removeOne(caseFor(skin, food.name)));
  };

  const editSelected = () => {
    const food = foods?.find((entry) => entry.id === selectedIds[0]);
    if (!food) return;
    exitSelectMode();
    setEditingFood(food);
  };

  const removeSelected = () => {
    if (selectedIds.length === 0) return;
    askRemove(selectedIds, copy.removeMany(selectedIds.length));
  };

  const query = caseFor(skin, search.trim());
  const hasFoods = Boolean(foods?.length);

  const createFood: typeof list.createFood = async (data) => {
    const created = await list.createFood(data);
    if (created) mark("added", common.marks.added(data.name.trim()));
    return created;
  };

  const editFood: typeof list.editFood = async (foodId, data) => {
    const saved = await list.editFood(foodId, data);
    if (saved) mark("saved", common.marks.saved);
    return saved;
  };

  return {
    ...list,
    createFood,
    editFood,
    isLoading: list.isFoodLoading && foods === undefined,
    query,
    isEmpty: !hasFoods && !query,
    noResults: !hasFoods && Boolean(query),
    isSelectMode,
    startSelect: () => setIsSelectMode(true),
    exitSelectMode,
    selectedIds,
    toggleSelect,
    removeSelected,
    editSelected,
    isAddVisible,
    addInitialName,
    addWithScan,
    addKey,
    openAdd,
    closeAdd,
    editingFood,
    openEdit: setEditingFood,
    closeEdit,
    removeEditing,
    actionRequest,
    closeActionPanel,
  };
};

export type InventoryShelf = ReturnType<typeof useInventoryShelf>;

export default useInventoryShelf;
