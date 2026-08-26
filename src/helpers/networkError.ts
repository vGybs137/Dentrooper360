import { ApiError } from "@/types/api";

/** Axios network failures are mapped to ApiError with status 0 in httpClient. */
export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}
