import axios from "@/services/axios";
import { KilistResponseError } from "@/types/api";
import { FetchRequestInit } from "expo/fetch";
import { useEffect, useRef } from "react";

interface RequestResult<TRes> {
  data: TRes | undefined;
  error: KilistResponseError | undefined;
  status: number | undefined;
}

/**
 * Imperative HTTP hook. Each call returns its own result — no shared state.
 * Aborts in-flight requests on unmount.
 */
const useAxios = (url: string) => {
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  const request = async <TRes, TBody = unknown>(
    method: "get" | "post" | "put" | "patch" | "delete",
    data?: TBody,
    config?: Omit<FetchRequestInit, "url" | "method" | "data" | "signal">,
  ): Promise<RequestResult<TRes>> => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await axios.request<TRes>({
        method,
        url,
        data,
        signal: controller.signal,
        ...config,
      });

      return { data: response.data, error: undefined, status: response.status };
    } catch (err: unknown) {
      if (!!err && (err as any).statusText !== "ERR_CANCELED") {
        const error: KilistResponseError = (err as any).response?.data ?? {
          message: "An unexpected error occurred",
        };

        return {
          data: undefined,
          error,
          status: (err as any).response?.status,
        };
      }

      return { data: undefined, error: undefined, status: undefined };
    }
  };

  const getData = <TRes>(
    config?: Omit<FetchRequestInit, "url" | "method" | "data" | "signal">,
  ) => request<TRes>("get", undefined, config);

  const postData = <TRes, TBody = unknown>(
    data: TBody,
    config?: Omit<FetchRequestInit, "url" | "method" | "data" | "signal">,
  ) => request<TRes, TBody>("post", data, config);

  const putData = <TRes, TBody = unknown>(
    data: TBody,
    config?: Omit<FetchRequestInit, "url" | "method" | "data" | "signal">,
  ) => request<TRes, TBody>("put", data, config);

  const patchData = <TRes, TBody = unknown>(
    data: TBody,
    config?: Omit<FetchRequestInit, "url" | "method" | "data" | "signal">,
  ) => request<TRes, TBody>("patch", data, config);

  const deleteData = <TRes>(
    config?: Omit<FetchRequestInit, "url" | "method" | "data" | "signal">,
  ) => request<TRes>("delete", undefined, config);

  return { getData, postData, putData, patchData, deleteData };
};

export default useAxios;
