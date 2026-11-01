import type { AxiosError } from "axios";
import axios from "@/services/axios";
import { notifyToast } from "@/services/toastBridge";
import { KilistApiError } from "@/types/api";

export const onError = (err: KilistApiError) => {
  notifyToast(err?.message || "An unexpected error occurred");
};

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
    const axiosError = error as AxiosError;
    const responseData = axiosError?.response?.data as
      | KilistApiError
      | undefined;

    // response.data may be missing entirely (e.g. a failed token refresh
    // rejecting with its own error, or a network error with no response at
    // all) — always throw a well-formed Error so SWR settles correctly
    // instead of hanging on a nullish/malformed thrown value.
    const kissError = new Error(
      responseData?.message || axiosError?.message || "Request failed",
    ) as KilistApiError;
    kissError.status = responseData?.status ?? axiosError?.response?.status ?? 0;

    if (process.env.NODE_ENV === "development") {
      console.log({
        "----- kissError -----": `${kissError.status} - ${kissError.message}`,
      });
    }
    throw kissError;
  }
};

export default fetcher;
