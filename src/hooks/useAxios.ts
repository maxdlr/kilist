import common from "@/i18n/common";
import axios from "@/services/axios";
import { KilistResponseError } from "@/types/api";
import { isCancel, type AxiosRequestConfig } from "axios";
import { useEffect, useRef } from "react";

type RequestConfig = Omit<
  AxiosRequestConfig,
  "url" | "method" | "data" | "signal"
>;

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
  const controllersRef = useRef(new Set<AbortController>());

  useEffect(() => {
    const controllers = controllersRef.current;
    return () => controllers.forEach((controller) => controller.abort());
  }, []);

  const request = async <TRes, TBody = unknown>(
    method: "get" | "post" | "put" | "patch" | "delete",
    data?: TBody,
    config?: RequestConfig,
  ): Promise<RequestResult<TRes>> => {
    const controller = new AbortController();
    controllersRef.current.add(controller);

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
      if (isCancel(err)) {
        return { data: undefined, error: undefined, status: undefined };
      }

      const error: KilistResponseError = (err as any)?.response?.data ?? {
        message: common.unexpected,
      };

      return {
        data: undefined,
        error,
        status: (err as any)?.response?.status,
      };
    } finally {
      controllersRef.current.delete(controller);
    }
  };

  const getData = <TRes>(
    config?: RequestConfig,
  ) => request<TRes>("get", undefined, config);

  const postData = <TRes, TBody = unknown>(
    data: TBody,
    config?: RequestConfig,
  ) => request<TRes, TBody>("post", data, config);

  const putData = <TRes, TBody = unknown>(
    data: TBody,
    config?: RequestConfig,
  ) => request<TRes, TBody>("put", data, config);

  const patchData = <TRes, TBody = unknown>(
    data: TBody,
    config?: RequestConfig,
  ) => request<TRes, TBody>("patch", data, config);

  const deleteData = <TRes>(
    config?: RequestConfig,
  ) => request<TRes>("delete", undefined, config);

  return { getData, postData, putData, patchData, deleteData };
};

export default useAxios;
