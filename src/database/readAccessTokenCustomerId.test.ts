import assert from "node:assert/strict";

import { readAccessTokenCustomerId } from "./readAccessTokenCustomerId";

function encodePayload(payload: Record<string, unknown>): string {
  const json = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `hdr.${json}.sig`;
}

assert.equal(readAccessTokenCustomerId(null), null);
assert.equal(readAccessTokenCustomerId(""), null);
assert.equal(readAccessTokenCustomerId("not-a-jwt"), null);

const matching = encodePayload({ customer_id: "clinic-a", sub: "provider-1" });
assert.equal(readAccessTokenCustomerId(matching), "clinic-a");

const missing = encodePayload({ sub: "provider-1" });
assert.equal(readAccessTokenCustomerId(missing), null);

// Merge / race: wrong clinic claim must be readable so binding can refuse.
const other = encodePayload({ customer_id: "clinic-b" });
assert.equal(readAccessTokenCustomerId(other), "clinic-b");
assert.notEqual(readAccessTokenCustomerId(other), "clinic-a");

console.log("readAccessTokenCustomerId: all assertions passed");
