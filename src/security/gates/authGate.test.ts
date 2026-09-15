import assert from "node:assert/strict";

type AuthGateState =
  | "needs_pairing"
  | "needs_login"
  | "needs_unlock"
  | "authenticated";

type Snapshot = {
  customerId: string | null;
  accessToken: string | null;
  user: { id: string } | null;
  hasRefreshCredential: boolean;
};

function resolveAuthGateState(snapshot: Snapshot): AuthGateState {
  if (!snapshot.customerId) {
    return "needs_pairing";
  }

  if (snapshot.accessToken && snapshot.user) {
    return "authenticated";
  }

  if (
    snapshot.hasRefreshCredential &&
    snapshot.user &&
    snapshot.customerId &&
    !snapshot.accessToken
  ) {
    return "needs_unlock";
  }

  return "needs_login";
}

assert.equal(
  resolveAuthGateState({
    customerId: null,
    accessToken: null,
    user: null,
    hasRefreshCredential: false,
  }),
  "needs_pairing",
);

assert.equal(
  resolveAuthGateState({
    customerId: "clinic-a",
    accessToken: null,
    user: null,
    hasRefreshCredential: false,
  }),
  "needs_login",
);

assert.equal(
  resolveAuthGateState({
    customerId: "clinic-a",
    accessToken: null,
    user: { id: "p1" },
    hasRefreshCredential: true,
  }),
  "needs_unlock",
);

assert.equal(
  resolveAuthGateState({
    customerId: "clinic-a",
    accessToken: "at",
    user: { id: "p1" },
    hasRefreshCredential: true,
  }),
  "authenticated",
);

// Access alone without user is not authenticated for gates.
assert.equal(
  resolveAuthGateState({
    customerId: "clinic-a",
    accessToken: "at",
    user: null,
    hasRefreshCredential: true,
  }),
  "needs_login",
);

console.log("authGate: all assertions passed");
