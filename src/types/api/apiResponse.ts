import type { ApiResponseError } from "./apiResponseError";

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  errors: ApiResponseError[] | null;
  metaData: unknown;
};
