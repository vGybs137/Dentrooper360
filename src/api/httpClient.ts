import axios, {
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import { API_BASE_URL, API_TIMEOUT_MS } from "@/constants/api";
import {
  attachAccessToken,
  toRejectedError,
  unwrapEnvelope,
} from "@/helpers/httpClient";

const REDACTED_KEYS = new Set([
  "authorization",
  "password",
  "access_token",
  "refresh_token",
  "token",
]);

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

if (__DEV__) {
  console.log("[api] client ready", {
    baseURL: API_BASE_URL,
    timeoutMs: API_TIMEOUT_MS,
  });
}

httpClient.interceptors.request.use(async (config) => {
  const next = await attachAccessToken(config);
  logRequest(next);
  return next;
});

httpClient.interceptors.response.use(
  (response) => {
    logResponse(response);
    return unwrapEnvelope(response);
  },
  (error) => {
    logError(error);
    return toRejectedError(error);
  },
);

function logRequest(config: InternalAxiosRequestConfig): void {
  if (!__DEV__) {
    return;
  }

  console.log("[api] request", {
    method: (config.method ?? "get").toUpperCase(),
    url: getRequestUrl(config),
    skipAuth: Boolean(config.skipAuth),
    hasAuth: hasAuthorizationHeader(config),
    data: redact(config.data),
  });
}

function logResponse(response: AxiosResponse): void {
  if (!__DEV__) {
    return;
  }

  console.log("[api] response", {
    method: (response.config.method ?? "get").toUpperCase(),
    url: getRequestUrl(response.config),
    status: response.status,
    data: redact(response.data),
  });
}

function logError(error: unknown): void {
  if (!__DEV__) {
    return;
  }

  if (!axios.isAxiosError(error)) {
    console.log("[api] error", error);
    return;
  }

  console.log("[api] error", {
    method: (error.config?.method ?? "get").toUpperCase(),
    url: error.config ? getRequestUrl(error.config) : undefined,
    code: error.code,
    status: error.response?.status ?? 0,
    message: error.message,
    data: redact(error.response?.data),
  });
}

function getRequestUrl(
  config: Pick<InternalAxiosRequestConfig, "baseURL" | "url" | "params">,
): string {
  try {
    return axios.getUri(config);
  } catch {
    return `${config.baseURL ?? ""}${config.url ?? ""}`;
  }
}

function hasAuthorizationHeader(config: InternalAxiosRequestConfig): boolean {
  const header = config.headers.Authorization ?? config.headers.authorization;
  return typeof header === "string" && header.length > 0;
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        REDACTED_KEYS.has(key.toLowerCase()) ? "[redacted]" : redact(nested),
      ]),
    );
  }

  return value;
}
