import type { ActionPanelRequest } from "@/components/elements/ActionPanel";
import common from "@/i18n/common";
import { aisleList, aisleOf } from "@/offline/foodNames";
import useToast from "@/providers/ToastProvider";
import axios from "@/services/axios";
import { FoodType } from "@/types/model";
import { useState } from "react";

export type AisleManagerText = {
  confirmTitle: string;
  confirmLine: (count: number) => string;
  confirmKeep: string;
  confirmSave: string;
  confirmDiscard: string;
};

export const hasKnownAisle = (food: FoodType) => {
  const aisle = aisleOf(food);
  return Boolean(aisle && aisleList().some((entry) => entry.id === aisle));
};

const useAisleManager = ({
  foods,
  text,
  onSaved,
}: {
  foods: FoodType[];
  text: AisleManagerText;
  onSaved: () => void;
}) => {
  const { showToast } = useToast();
  const [visible, setVisible] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [items, setItems] = useState<FoodType[]>([]);
  const [picks, setPicks] = useState<Record<number, string>>({});
  const [openId, setOpenId] = useState<number | null>(null);
  const unsorted = foods.filter((food) => !hasKnownAisle(food));
  const pickCount = Object.keys(picks).length;

  const open = () => {
    setItems(unsorted);
    setPicks({});
    setOpenId(null);
    setVisible(true);
  };

  const toggle = (foodId: number) => setOpenId((current) => (current === foodId ? null : foodId));

  const pick = (foodId: number, aisle: string) => {
    const next = { ...picks, [foodId]: aisle };
    setPicks(next);
    const at = items.findIndex((food) => food.id === foodId);
    const following = [...items.slice(at + 1), ...items.slice(0, at)].find((food) => !next[food.id]);
    setOpenId(following?.id ?? null);
  };

  const save = async (chosen: Record<number, string>) => {
    setVisible(false);
    setConfirming(false);
    const entries = Object.entries(chosen);
    if (entries.length === 0) return;
    const results = await Promise.allSettled(
      entries.map(([foodId, aisle]) => axios.put(`foods/edit/${foodId}`, { aisle })),
    );
    if (results.some((result) => result.status === "rejected")) showToast(common.unexpected);
    onSaved();
  };

  const discard = () => {
    setPicks({});
    setVisible(false);
  };

  const requestClose = () => {
    setVisible(false);
    if (pickCount > 0) setConfirming(true);
  };

  const confirmRequest: ActionPanelRequest | null = confirming
    ? {
        title: text.confirmTitle,
        message: text.confirmLine(pickCount),
        cancelLabel: text.confirmKeep,
        actions: [
          { label: text.confirmDiscard, destructive: true, onPress: discard },
          { label: text.confirmSave, onPress: () => save(picks) },
        ],
      }
    : null;

  const keepEditing = () => {
    setConfirming(false);
    setVisible(true);
  };

  return {
    canManage: unsorted.length > 0,
    visible,
    items,
    picks,
    openId,
    open,
    toggle,
    pick,
    done: () => save(picks),
    requestClose,
    confirmRequest,
    keepEditing,
  };
};

export type AisleManager = ReturnType<typeof useAisleManager>;

export default useAisleManager;
