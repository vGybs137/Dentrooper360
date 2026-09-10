import assert from "node:assert/strict";

import { sortClinicsByLru } from "./clinicLru";

const sorted = sortClinicsByLru([
  { customerId: "newest", lastOpenedAt: "2026-09-10T12:00:00.000Z" },
  { customerId: "never", lastOpenedAt: null },
  { customerId: "oldest", lastOpenedAt: "2026-01-01T00:00:00.000Z" },
  { customerId: "mid", lastOpenedAt: "2026-06-01T00:00:00.000Z" },
]);

assert.deepEqual(
  sorted.map((row) => row.customerId),
  ["never", "oldest", "mid", "newest"],
);

console.log("sortClinicsByLru: all assertions passed");
