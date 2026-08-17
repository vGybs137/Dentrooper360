import axios, {
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import { API_BASE_URL, API_TIMEOUT_MS } from "./config";
import { tokenStore } from "@/stores";
import { ApiError, type ApiResponse, type ApiResponseError } from "@/types/api";

declare module "axios" {
  interface AxiosRequestConfig {
    skipAuth?: boolean;
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

async function attachAccessToken(
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> {
  if (config.skipAuth) {
    return config;
  }

  const accessToken = await tokenStore.getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
}

function unwrapEnvelope(response: AxiosResponse): AxiosResponse {
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

function toRejectedError(error: unknown): Promise<never> {
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

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use(attachAccessToken);
httpClient.interceptors.response.use(unwrapEnvelope, toRejectedError);
