import type { ApiResponseError } from "./apiResponseError";

export class ApiError extends Error {
  readonly status: number;
  readonly errors: ApiResponseError[];

  constructor(message: string, status: number, errors: ApiResponseError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}
