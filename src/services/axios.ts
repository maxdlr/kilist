import axios, {
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

const baseURL = process.env.EXPO_PUBLIC_API_URL;
const isDev = process.env.NODE_ENV === "development";

const MAX_REFRESH_ATTEMPTS = 3;
const REFRESH_COUNT_KEY = "auth_refresh_count";

const getRefreshCount = () =>
  parseInt(sessionStorage.getItem(REFRESH_COUNT_KEY) ?? "0", 10);
const incrementRefreshCount = () =>
  sessionStorage.setItem(REFRESH_COUNT_KEY, String(getRefreshCount() + 1));
const resetRefreshCount = () => sessionStorage.removeItem(REFRESH_COUNT_KEY);

let isRefreshing = false;
let refreshSubscribers: Array<() => void> = [];

const subscribeToRefresh = (cb: () => void) => {
  refreshSubscribers.push(cb);
};

const flushRefreshSubscribers = () => {
  refreshSubscribers.forEach((cb) => {
    cb();
  });
  refreshSubscribers = [];
};

const instance = axios.create({
  withCredentials: true,
  baseURL,
});

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => config,
  (error: unknown) => Promise.reject(error),
);

instance.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const status = error.response?.status;
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if ([403, 404].includes(status ?? 0)) {
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshCount = getRefreshCount();
      const canRefresh = isDev || refreshCount < MAX_REFRESH_ATTEMPTS;

      if (!canRefresh) return Promise.reject(error);

      if (isRefreshing) {
        // Queue this request to replay once the in-flight refresh completes
        return new Promise<AxiosResponse>((resolve) => {
          subscribeToRefresh(() => resolve(instance(originalRequest)));
        });
      }

      isRefreshing = true;
      if (!isDev) incrementRefreshCount();

      try {
        await instance.post("/refresh");
        resetRefreshCount();
        flushRefreshSubscribers();
        return instance(originalRequest);
      } catch (refreshError) {
        refreshSubscribers = [];
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default instance;
