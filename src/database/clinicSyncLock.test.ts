import assert from "node:assert/strict";

import {
  clearClinicSyncInFlight,
  getClinicSyncInFlight,
  isClinicSyncInFlight,
  setClinicSyncInFlight,
  waitForClinicSyncIdle,
} from "./clinicSyncLock";

async function main(): Promise<void> {
  const clinicA = "clinic-lock-a";
  const clinicB = "clinic-lock-b";

  assert.equal(isClinicSyncInFlight(clinicA), false);

  let resolveA!: () => void;
  const promiseA = new Promise<void>((resolve) => {
    resolveA = resolve;
  });

  setClinicSyncInFlight(clinicA, promiseA);
  assert.equal(isClinicSyncInFlight(clinicA), true);
  assert.equal(getClinicSyncInFlight(clinicA), promiseA);
  assert.equal(isClinicSyncInFlight(clinicB), false);

  const idlePromise = waitForClinicSyncIdle(clinicA);
  resolveA();
  await idlePromise;

  clearClinicSyncInFlight(clinicA, promiseA);
  assert.equal(isClinicSyncInFlight(clinicA), false);

  // Joining another clinic's in-flight must never happen via shared key.
  let resolveB!: () => void;
  const promiseB = new Promise<void>((resolve) => {
    resolveB = resolve;
  });
  setClinicSyncInFlight(clinicB, promiseB);
  assert.notEqual(getClinicSyncInFlight(clinicA), promiseB);
  resolveB();
  await waitForClinicSyncIdle(clinicB);
  clearClinicSyncInFlight(clinicB, promiseB);

  console.log("clinicSyncLock: all assertions passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
