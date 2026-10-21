import assert from "node:assert/strict";

import { mapPairResponse, toPairPayload } from "./pairPayload";

const customerId = "11111111-1111-1111-1111-111111111111";
const productId = "22222222-2222-2222-2222-222222222222";
const deviceId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

const payload = toPairPayload({
  customerId,
  productId,
  deviceId,
  deviceName: "Clinic Tablet",
  platform: "android",
  version: "1.0.0",
});

assert.deepEqual(payload, {
  customer_id: customerId,
  product_id: productId,
  device_id: deviceId,
  device_name: "Clinic Tablet",
  platform: "android",
  version: "1.0.0",
});
assert.equal("x_api_key" in payload, false);

const mapped = mapPairResponse({
  device_id: deviceId,
  customer_id: customerId,
  paired_at: "2026-10-21T12:00:00.000Z",
  pair_kind: "first",
  device_api_key: "33333333-3333-3333-3333-333333333333",
});

assert.equal(mapped.deviceId, deviceId);
assert.equal(mapped.customerId, customerId);
assert.equal(mapped.pairKind, "first");
assert.equal(mapped.pairedAt.toISOString(), "2026-10-21T12:00:00.000Z");
assert.equal("deviceApiKey" in mapped, false);

console.log("pairPayload: all assertions passed");
