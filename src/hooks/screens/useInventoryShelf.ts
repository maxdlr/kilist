import type { ActionPanelRequest } from "@/components/elements/ActionPanel";
import common from "@/i18n/common";
import useInventory from "@/providers/InventoryProvider";
import { useReportFeedback } from "@/providers/FeedbackStore";
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
  const report = useReportFeedback();
  const { foods, search, mutateFood, removeFoodsFromList } = list;
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [deleteIds, setDeleteIds] = useState<number[]>([]);
  const [isAddVisible, setIsAddVisible] = useState(false);
  const [addInitialName, setAddInitialName] = useState("");
  const [addKey, setAddKey] = useState(0);
  const { add: addRequested } = useLocalSearchParams<{ add?: string }>();
  const [editingFood, setEditingFood] = useState<FoodType | null>(null);
  const [actionRequest, setActionRequest] = useState<ActionPanelRequest | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      mutateFood();
    }, [mutateFood]),
  );

  const toggleDelete = (foodId: number) => {
    setDeleteIds((prev) =>
      prev.includes(foodId)
        ? prev.filter((id) => id !== foodId)
        : [...prev, foodId],
    );
  };

  const exitDeleteMode = () => {
    setIsDeleteMode(false);
    setDeleteIds([]);
  };

  const closeActionPanel = useCallback(() => setActionRequest(null), []);
  const closeAdd = useCallback(() => setIsAddVisible(false), []);
  const closeEdit = useCallback(() => setEditingFood(null), []);

  const openAdd = (initialName = "") => {
    setEditingFood(null);
    setAddInitialName(initialName);
    setAddKey((key) => key + 1);
    setIsAddVisible(true);
  };

  const [handledAdd, setHandledAdd] = useState<string | undefined>();

  if (addRequested !== handledAdd) {
    setHandledAdd(addRequested);
    if (addRequested) openAdd();
  }

  useEffect(() => {
    if (addRequested) router.setParams({ add: undefined });
  }, [addRequested]);

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
            const failed = await removeFoodsFromList(ids);
            exitDeleteMode();
            if (!failed) {
              mark("removed", common.marks.removed(ids.length));
              return;
            }
            report("inventory", {
              tone: "error",
              title: common.feedback.removeFailed(ids.length),
              body: failed.message,
              action: { label: common.feedback.retry, onPress: () => askRemove(ids, title) },
            });
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

  const confirmDelete = () => {
    if (deleteIds.length === 0) return;
    askRemove(deleteIds, copy.removeMany(deleteIds.length));
  };

  const query = caseFor(skin, search.trim());
  const hasFoods = Boolean(foods?.length);

  const createFood: typeof list.createFood = async (data) => {
    const failed = await list.createFood(data);
    if (!failed) mark("added", common.marks.added(data.name.trim()));
    return failed;
  };

  const editFood: typeof list.editFood = async (foodId, data) => {
    const failed = await list.editFood(foodId, data);
    if (!failed) mark("saved", common.marks.saved);
    return failed;
  };

  return {
    ...list,
    createFood,
    editFood,
    saveDetails: list.editFood,
    isLoading: list.isFoodLoading && foods === undefined,
    query,
    isEmpty: !hasFoods && !query,
    noResults: !hasFoods && Boolean(query),
    isDeleteMode,
    startDelete: () => setIsDeleteMode(true),
    exitDeleteMode,
    deleteIds,
    toggleDelete,
    confirmDelete,
    isAddVisible,
    addInitialName,
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
