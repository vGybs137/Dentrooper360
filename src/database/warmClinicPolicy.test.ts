import assert from "node:assert/strict";

import {
  LOW_END_TOTAL_MEMORY_BYTES,
  resolveWarmClinicPolicy,
} from "./warmClinicPolicy";

const lowEnd = resolveWarmClinicPolicy(2 * 1024 * 1024 * 1024);
assert.equal(lowEnd.maxWarmClinics, 2);
assert.equal(lowEnd.minFreeDiskBytes, 400 * 1024 * 1024);

const defaultDevice = resolveWarmClinicPolicy(8 * 1024 * 1024 * 1024);
assert.equal(defaultDevice.maxWarmClinics, 3);
assert.equal(defaultDevice.minFreeDiskBytes, 250 * 1024 * 1024);

const boundary = resolveWarmClinicPolicy(LOW_END_TOTAL_MEMORY_BYTES);
assert.equal(boundary.maxWarmClinics, 2);

const unknown = resolveWarmClinicPolicy(null);
assert.equal(unknown.maxWarmClinics, 3);

console.log("warmClinicPolicy: all assertions passed");
