import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import { recycleTokens } from "@/helpers/sessionRefresh";
import { hydrateAuthStore, useAuthStore } from "@/stores";
import { ApiError, type ApiResponse, type ApiResponseError } from "@/types/api";

declare module "axios" {
  interface AxiosRequestConfig {
    skipAuth?: boolean;
    _retry?: boolean;
  }
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return typeof value === "object" && value !== null && "success" in value;
}

function toApiError(
  status: number,
  payload: unknown,
  fallback: string,
): ApiError {
  if (isApiResponse(payload) && payload.errors?.length) {
    const errors: ApiResponseError[] = payload.errors;
    return new ApiError(errors[0]?.message ?? fallback, status, errors);
  }

  return new ApiError(fallback, status);
}

export async function attachAccessToken(
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> {
  if (config.skipAuth) {
    return config;
  }

  await hydrateAuthStore();
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
}

export function unwrapEnvelope(response: AxiosResponse): AxiosResponse {
  if (response.status === 204 || response.data == null || response.data === "") {
    return response;
  }

  const payload = response.data;

  if (!isApiResponse(payload)) {
    return response;
  }

  if (!payload.success) {
    throw toApiError(response.status, payload, "Request failed.");
  }

  response.data = payload.data;
  return response;
}

export function toRejectedError(error: unknown): Promise<never> {
  if (error instanceof ApiError) {
    return Promise.reject(error);
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const fallback =
      status === 0
        ? "Unable to reach the server."
        : error.message || "Request failed.";

    return Promise.reject(toApiError(status, error.response?.data, fallback));
  }

  return Promise.reject(error);
}

export async function retryUnauthorizedRequest(
  client: AxiosInstance,
  error: unknown,
): Promise<AxiosResponse> {
  if (!axios.isAxiosError(error)) {
    return Promise.reject(await toRejectedError(error));
  }

  const config = error.config;
  const status = error.response?.status ?? 0;

  if (
    !config ||
    config.skipAuth ||
    config._retry ||
    status !== 401
  ) {
    return Promise.reject(await toRejectedError(error));
  }

  config._retry = true;

  try {
    await recycleTokens();
    const next = await attachAccessToken(config);
    return client.request(next);
  } catch {
    useAuthStore.getState().clearSession();
    return Promise.reject(await toRejectedError(error));
  }
}
