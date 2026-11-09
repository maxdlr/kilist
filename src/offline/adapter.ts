import axios, { type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { getSyncStatus, householdChanged, requestSync, signedIn, signedOut, syncNow } from "./engine";
import {
  cacheKeyOf,
  isCachedRead,
  isOnlineAction,
  matchLocal,
  offlineRaceView,
  overlayRace,
  queueRaceAnswer,
  raceAnswerMatch,
  raceCacheKey,
  raceRead,
  type Request,
} from "./routes";
import { hasSession, loadCached, pendingCount, saveCached } from "./store";

const READ_TIMEOUT_MS = 8000;

const network = axios.getAdapter(axios.defaults.adapter);

const parseBody = (data: unknown) => {
  if (typeof data !== "string") return data ?? {};
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
};

const toRequest = (config: InternalAxiosRequestConfig): Request => {
  const [rawPath = "", rawQuery = ""] = (config.url ?? "").split("?");
  const query: Record<string, any> = { ...(config.params ?? {}) };
  for (const [key, value] of new URLSearchParams(rawQuery)) query[key] = value;
  return {
    method: (config.method ?? "get").toLowerCase(),
    path: rawPath.replace(/^\/+/, ""),
    query,
    body: parseBody(config.data),
  };
};

const respond = (config: InternalAxiosRequestConfig, data: unknown, status = 200): AxiosResponse => ({
  data: data === undefined ? null : JSON.parse(JSON.stringify(data ?? null)),
  status,
  statusText: "OK",
  headers: {},
  config,
  request: {},
});

const isNetworkFailure = (error: any) => !error?.response;

const fromNetwork = (config: InternalAxiosRequestConfig) =>
  network({ ...config, timeout: config.timeout || READ_TIMEOUT_MS });

const cachedRead = async (config: InternalAxiosRequestConfig, request: Request) => {
  const key = cacheKeyOf(request.path, request.query);
  const saved = loadCached<unknown>(key);
  if (!getSyncStatus().online && saved !== undefined) return respond(config, saved);
  try {
    const response = await fromNetwork(config);
    const data = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
    saveCached(key, data);
    return response;
  } catch (error) {
    if (isNetworkFailure(error) && saved !== undefined) return respond(config, saved);
    throw error;
  }
};

const readRace = async (config: InternalAxiosRequestConfig, request: Request) => {
  const key = raceCacheKey(request.query.tzOffset);
  if (getSyncStatus().online) {
    if (pendingCount() > 0) await syncNow();
    try {
      const response = await fromNetwork(config);
      const data = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
      saveCached(key, data);
      return respond(config, overlayRace(data));
    } catch (error) {
      if (!isNetworkFailure(error)) throw error;
    }
  }
  return respond(config, offlineRaceView(request.query.tzOffset));
};

const answerRace = async (
  config: InternalAxiosRequestConfig,
  request: Request,
  raceId: number,
) => {
  const tzOffset = new Date().getTimezoneOffset();
  if (raceId > 0 && getSyncStatus().online) {
    try {
      const response = await fromNetwork(config);
      requestSync();
      return response;
    } catch (error) {
      if (!isNetworkFailure(error)) throw error;
    }
  }
  return respond(config, queueRaceAnswer(raceId, request.body, tzOffset), 201);
};

const onlineAction = async (config: InternalAxiosRequestConfig, request: Request) => {
  await syncNow();
  const response = await network(config);
  if (request.path === "logout" || request.path === "users/delete") {
    signedOut();
  } else if (request.path === "households/switch") {
    await householdChanged();
  } else {
    await syncNow();
  }
  return response;
};

const passthrough = async (config: InternalAxiosRequestConfig, request: Request) => {
  const response = await network(config);
  if (request.method === "get" && request.path === "me") {
    const data = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
    if (data?.id) signedIn(data.id);
  }
  return response;
};

export const offlineAdapter: AxiosAdapter = async (config) => {
  if ((config as any).network) return network(config);

  const request = toRequest(config);
  if (!hasSession()) return passthrough(config, request);

  const local = matchLocal(request);
  if (local) {
    const data = local.handler(request, local.match);
    if (data !== undefined) return respond(config, data);
    return network(config);
  }
  if (raceRead(request)) return readRace(config, request);
  const answer = raceAnswerMatch(request);
  if (answer) return answerRace(config, request, Number(answer[1]));
  if (isCachedRead(request)) return cachedRead(config, request);
  if (isOnlineAction(request)) return onlineAction(config, request);
  return network(config);
};
