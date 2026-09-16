import assert from "node:assert/strict";

import { canonicalCustomerId, sameCustomerId } from "./customerId";

assert.equal(canonicalCustomerId(null), null);
assert.equal(canonicalCustomerId("  "), null);
assert.equal(
  canonicalCustomerId("01A08792-E890-750C-BE6D-A93B2ABF43DB"),
  "01a08792-e890-750c-be6d-a93b2abf43db",
);
assert.equal(
  sameCustomerId(
    "01A08792-E890-750C-BE6D-A93B2ABF43DB",
    "01a08792-e890-750c-be6d-a93b2abf43db",
  ),
  true,
);
assert.equal(sameCustomerId("clinic-a", "clinic-b"), false);

console.log("customerId: all assertions passed");
