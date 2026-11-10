import useAuth from "@/providers/AuthProvider";
import axios from "@/services/axios";
import React, { createContext, ReactNode, useCallback, useMemo } from "react";
import useSWR from "swr";

export type PrizeType = {
  id: string;
  kind: "skin";
  skin: string;
  price: number;
  accountOnly?: boolean;
  owned: boolean;
  wearable: boolean;
};

export type PrizeCounterType = {
  balance: number;
  reserved?: number;
  premium: boolean;
  prizes: PrizeType[];
};

export const fundsFor = (counter: PrizeCounterType | undefined, prize: Pick<PrizeType, "accountOnly">) =>
  Math.max(0, (counter?.balance ?? 0) - (prize.accountOnly ? counter?.reserved ?? 0 : 0));

type TicketsContextType = {
  counter?: PrizeCounterType;
  nextPrize?: PrizeType;
  nextPrizeFunds: number;
  refresh: () => Promise<unknown>;
  setBalance: (balance: number) => void;
  redeem: (prizeId: string) => Promise<boolean>;
};

const TicketsContext = createContext<TicketsContextType>({
  nextPrizeFunds: 0,
  refresh: async () => undefined,
  setBalance: () => {},
  redeem: async () => false,
});

export const TicketsProvider = ({ children }: { children: ReactNode }) => {
  const { data: counter, mutate } = useSWR<PrizeCounterType>({
    url: "/prizes",
  });

  const { isGuest } = useAuth();
  const nextPrize = useMemo(
    () =>
      counter?.prizes
        .filter((prize) => !prize.owned && !(isGuest && prize.accountOnly))
        .sort((a, b) => a.price - b.price)[0],
    [counter, isGuest],
  );
  const nextPrizeFunds = nextPrize ? fundsFor(counter, nextPrize) : counter?.balance ?? 0;

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
    () => ({ counter, nextPrize, nextPrizeFunds, refresh: () => mutate(), setBalance, redeem }),
    [counter, nextPrize, nextPrizeFunds, mutate, setBalance, redeem],
  );

  return (
    <TicketsContext.Provider value={value}>{children}</TicketsContext.Provider>
  );
};

const useTickets = () => React.useContext(TicketsContext);

export default useTickets;
