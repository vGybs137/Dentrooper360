import assert from "node:assert/strict";

import { ApiError } from "../types/api";
import { isNetworkError } from "./networkError";

assert.equal(isNetworkError(new ApiError("Unable to reach the server.", 0)), true);
assert.equal(isNetworkError(new ApiError("Unauthorized", 401)), false);
assert.equal(isNetworkError(new ApiError("Server error", 500)), false);
assert.equal(isNetworkError(new Error("plain")), false);
assert.equal(isNetworkError(null), false);

console.log("networkError: all assertions passed");
