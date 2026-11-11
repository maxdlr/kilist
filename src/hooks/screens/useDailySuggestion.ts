import axios from "@/services/axios";
import { FoodBankItemType, ListType } from "@/types/model";
import { useEffect, useRef, useState } from "react";

const useDailySuggestion = (roundDone: boolean) => {
  const [item, setItem] = useState<FoodBankItemType | null>(null);
  const asked = useRef(false);
  const [wasDone, setWasDone] = useState(roundDone);

  if (wasDone !== roundDone) {
    setWasDone(roundDone);
    if (!roundDone) setItem(null);
  }

  useEffect(() => {
    if (!roundDone) {
      asked.current = false;
      return;
    }
    if (asked.current) return;
    asked.current = true;
    let active = true;
    axios
      .get<FoodBankItemType | null>("suggestions/next", {
        params: { tzOffset: new Date().getTimezoneOffset() },
      })
      .then(({ data }) => {
        if (active && data?.name) setItem(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [roundDone]);

  const answer = async (accept: boolean) => {
    const current = item;
    setItem(null);
    if (!current) return;
    try {
      if (!accept) {
        await axios.post("suggestions/decline", { name: current.name });
        return;
      }
      const { data: list } = await axios.get<ListType>("lists/read?main=true");
      if (!list?.id) return;
      await axios.post("foods/create", {
        name: current.name,
        icon: current.icon,
        listId: list.id,
        fromOnboarding: true,
        needed: true,
      });
    } catch {
      return;
    }
  };

  return { item, answer };
};

export type DailySuggestion = ReturnType<typeof useDailySuggestion>;

export default useDailySuggestion;
