import type { AxiosError } from "axios";
import axios from "@/services/axios";
import { KilistApiError } from "@/types/api";

export const onError = (err: AxiosError) =>
  err?.response?.data as KilistApiError;

const fetcher = async ({
  url,
  query,
}: {
  url: string;
  query: Record<any, any>;
}) => {
  try {
    if (!url) return null;
    const res = await axios.get(url, { params: query });
    return res?.data;
  } catch (error) {
    const kissError: KilistApiError = (error as AxiosError)?.response
      ?.data as KilistApiError;
    if (process.env.NODE_ENV === "development") {
      console.log({
        "----- kissError -----": `${kissError?.status} - ${kissError?.message}`,
      });
    }
    throw kissError;
  }
};

export default fetcher;
