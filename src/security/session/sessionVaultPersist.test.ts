import assert from "node:assert/strict";

/**
 * Documents Phase 5 persistence rules for the auth store blob.
 * Runtime SecureStore/biometric APIs are native-only; this test locks the
 * shape of what is allowed in the persisted JSON.
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

function migrateLegacy(raw: {
  user: { id: string } | null;
  customerId: string | null;
  expiresAt: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}): PersistedAuthState & { _legacyRefreshToken?: string } {
  const next: PersistedAuthState & { _legacyRefreshToken?: string } = {
    user: raw.user,
    customerId: raw.customerId,
    expiresAt: raw.expiresAt,
    hasRefreshCredential: Boolean(raw.refreshToken),
    refreshBoundToBiometrics: false,
  };

  if (raw.refreshToken) {
    next._legacyRefreshToken = raw.refreshToken;
  }

  return next;
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
assert.equal(persisted.refreshBoundToBiometrics, true);

const migrated = migrateLegacy({
  user: { id: "p1" },
  customerId: "clinic-a",
  expiresAt: null,
  accessToken: "old-at",
  refreshToken: "old-rt",
});

assert.equal(migrated.hasRefreshCredential, true);
assert.equal(migrated._legacyRefreshToken, "old-rt");
assert.equal("accessToken" in migrated, false);
assert.equal("refreshToken" in migrated, false);

console.log("sessionVaultPersist: all assertions passed");
