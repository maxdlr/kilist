import axios from "@/services/axios";
import React, { createContext, ReactNode, useCallback, useMemo } from "react";
import useSWR from "swr";

export type PrizeType = {
  id: string;
  kind: "skin";
  skin: string;
  price: number;
  owned: boolean;
  wearable: boolean;
};

export type PrizeCounterType = {
  balance: number;
  premium: boolean;
  prizes: PrizeType[];
};

type TicketsContextType = {
  counter?: PrizeCounterType;
  nextPrize?: PrizeType;
  refresh: () => Promise<unknown>;
  setBalance: (balance: number) => void;
  redeem: (prizeId: string) => Promise<boolean>;
};

const TicketsContext = createContext<TicketsContextType>({
  refresh: async () => undefined,
  setBalance: () => {},
  redeem: async () => false,
});

export const TicketsProvider = ({ children }: { children: ReactNode }) => {
  const { data: counter, mutate } = useSWR<PrizeCounterType>({
    url: "/prizes",
  });

  const nextPrize = useMemo(
    () =>
      counter?.prizes
        .filter((prize) => !prize.owned)
        .sort((a, b) => a.price - b.price)[0],
    [counter],
  );

  const setBalance = useCallback(
    (balance: number) => {
      mutate((current) => (current ? { ...current, balance } : current), {
        revalidate: false,
      });
    },
    [mutate],
  );

  const redeem = useCallback(
    async (prizeId: string) => {
      try {
        const res = await axios.post<PrizeCounterType>(
          `/prizes/${prizeId}/redeem`,
        );
        await mutate(res.data, { revalidate: false });
        return true;
      } catch {
        return false;
      }
    },
    [mutate],
  );

  const value = useMemo(
    () => ({ counter, nextPrize, refresh: () => mutate(), setBalance, redeem }),
    [counter, nextPrize, mutate, setBalance, redeem],
  );

  return (
    <TicketsContext.Provider value={value}>{children}</TicketsContext.Provider>
  );
};

const useTickets = () => React.useContext(TicketsContext);

export default useTickets;
