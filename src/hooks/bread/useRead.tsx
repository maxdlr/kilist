"use client";

import type { KRes, Model } from "@kissnotes/types";
import { useState } from "react";
import useSWR from "swr";

const useRead = <T extends Model>(
  model: string,
  modelParams: Partial<T>,
  fetchIf: boolean = true,
) => {
  const [loading, setLoading] = useState(true);
  const params: Partial<T> = Object.entries(modelParams).reduce(
    (acc: Partial<T>, [key, value]: [string, T[keyof T]]) => {
      if (modelParams[key as keyof Partial<T>]) {
        acc[key as keyof T] = value;
      }
      return acc;
    },
    {} as Partial<T>,
  );

  const url = fetchIf ? `/${model}/read` : null;

  const { data, error, mutate, isValidating } = useSWR<KRes<T>>(
    {
      url,
      params,
    },
    {
      onSuccess: () => setLoading(false),
      onError: () => setLoading(false),
    },
  );
  return { data, error, loading, mutate, isValidating };
};

export default useRead;
