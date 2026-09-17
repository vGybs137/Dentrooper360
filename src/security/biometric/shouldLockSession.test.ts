import assert from "node:assert/strict";

import {
  APP_LOCK_TIMEOUT_5_MIN_MS,
  APP_LOCK_TIMEOUT_IMMEDIATE_MS,
  shouldLockSession,
} from "./shouldLockSession";

const now = 1_700_000_000_000;

assert.equal(shouldLockSession(false, null, now, APP_LOCK_TIMEOUT_5_MIN_MS), false);
assert.equal(shouldLockSession(false, now, now, APP_LOCK_TIMEOUT_IMMEDIATE_MS), false);

assert.equal(shouldLockSession(true, null, now, APP_LOCK_TIMEOUT_5_MIN_MS), true);

assert.equal(
  shouldLockSession(true, now - 60_000, now, APP_LOCK_TIMEOUT_5_MIN_MS),
  false,
);

assert.equal(
  shouldLockSession(
    true,
    now - APP_LOCK_TIMEOUT_5_MIN_MS,
    now,
    APP_LOCK_TIMEOUT_5_MIN_MS,
  ),
  true,
);

assert.equal(
  shouldLockSession(true, now, now, APP_LOCK_TIMEOUT_IMMEDIATE_MS),
  true,
);

console.log("shouldLockSession: ok");
