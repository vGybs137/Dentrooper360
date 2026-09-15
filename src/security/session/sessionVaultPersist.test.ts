import assert from "node:assert/strict";

/**
 * Persist blob must never contain access/refresh tokens.
 * Embedded tokens from older builds are discarded (re-login).
 */

type PersistedAuthState = {
  user: { id: string } | null;
  customerId: string | null;
  expiresAt: string | null;
  hasRefreshCredential: boolean;
  refreshBoundToBiometrics: boolean;
};

function partialize(state: PersistedAuthState & {
  accessToken: string | null;
  refreshToken: string | null;
}): PersistedAuthState {
  return {
    user: state.user,
    customerId: state.customerId,
    expiresAt: state.expiresAt,
    hasRefreshCredential: state.hasRefreshCredential,
    refreshBoundToBiometrics: state.refreshBoundToBiometrics,
  };
}

function sanitizeEmbeddedTokens(raw: {
  user: { id: string } | null;
  customerId: string | null;
  expiresAt: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  hasRefreshCredential?: boolean;
  refreshBoundToBiometrics?: boolean;
}): PersistedAuthState {
  const hadEmbeddedTokens =
    typeof raw.accessToken === "string" || typeof raw.refreshToken === "string";

  return {
    user: raw.user,
    customerId: raw.customerId,
    expiresAt: raw.expiresAt,
    hasRefreshCredential: hadEmbeddedTokens
      ? false
      : Boolean(raw.hasRefreshCredential),
    refreshBoundToBiometrics: hadEmbeddedTokens
      ? false
      : Boolean(raw.refreshBoundToBiometrics),
  };
}

const persisted = partialize({
  user: { id: "p1" },
  customerId: "clinic-a",
  expiresAt: "2026-01-01T00:00:00.000Z",
  hasRefreshCredential: true,
  refreshBoundToBiometrics: true,
  accessToken: "must-not-persist",
  refreshToken: "must-not-persist",
});

assert.equal("accessToken" in persisted, false);
assert.equal("refreshToken" in persisted, false);
assert.equal(persisted.hasRefreshCredential, true);

const sanitized = sanitizeEmbeddedTokens({
  user: { id: "p1" },
  customerId: "clinic-a",
  expiresAt: null,
  accessToken: "old-at",
  refreshToken: "old-rt",
  hasRefreshCredential: true,
  refreshBoundToBiometrics: true,
});

assert.equal(sanitized.hasRefreshCredential, false);
assert.equal(sanitized.refreshBoundToBiometrics, false);
assert.equal("accessToken" in sanitized, false);
assert.equal("refreshToken" in sanitized, false);

console.log("sessionVaultPersist: all assertions passed");
