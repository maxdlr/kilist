import type { AxiosError } from "axios";
import axios from "@/services/axios";
import { KilistApiError } from "@/types/apiTypes";

export const onError = (err: AxiosError) =>
  err?.response?.data as KilistApiError;

const fetcher = async ({
  url,
  params,
}: {
  url: string;
  params: Record<any, any>;
}) => {
  try {
    if (!url) return null;
    const res = await axios.get(url, { params });
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
