import assert from "node:assert/strict";

import { parseValidatedQrPayload } from "./parseValidatedQrPayload";

const customerId = "11111111-1111-1111-1111-111111111111";
const productId = "22222222-2222-2222-2222-222222222222";

assert.deepEqual(
  parseValidatedQrPayload(
    JSON.stringify({
      registration_key: `${customerId}|${productId}`,
    }),
  ),
  { customerId, productId },
);

assert.deepEqual(
  parseValidatedQrPayload(
    JSON.stringify({
      registration_key: `${customerId}|${productId}`,
      x_api_key: "33333333-3333-3333-3333-333333333333",
    }),
  ),
  { customerId, productId },
);

assert.equal(parseValidatedQrPayload(""), null);
assert.equal(parseValidatedQrPayload("not-json"), null);
assert.equal(
  parseValidatedQrPayload(JSON.stringify({ registration_key: customerId })),
  null,
);
assert.equal(
  parseValidatedQrPayload(
    JSON.stringify({ registration_key: `${customerId}|not-a-guid` }),
  ),
  null,
);

console.log("parseValidatedQrPayload: all assertions passed");
