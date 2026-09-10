import assert from "node:assert/strict";

import {
  getMultiClinicFlags,
  isClinicSwitchEnabled,
  isWarmLruDemoteEnabled,
  setMultiClinicFlagsForTests,
} from "../constants/multiClinicFlags";

setMultiClinicFlagsForTests(null);
const defaults = getMultiClinicFlags();
assert.equal(defaults.multiClinicRegistry, true);
assert.equal(defaults.multiClinicSwitchUi, true);
assert.equal(defaults.warmLruDemote, false);
assert.equal(isClinicSwitchEnabled(), true);
assert.equal(isWarmLruDemoteEnabled(), false);

setMultiClinicFlagsForTests({
  multiClinicRegistry: true,
  multiClinicSwitchUi: true,
  warmLruDemote: true,
});
assert.equal(isClinicSwitchEnabled(), true);
assert.equal(isWarmLruDemoteEnabled(), true);

setMultiClinicFlagsForTests({
  multiClinicRegistry: false,
  multiClinicSwitchUi: true,
  warmLruDemote: true,
});
assert.equal(isClinicSwitchEnabled(), false);
assert.equal(isWarmLruDemoteEnabled(), false);

setMultiClinicFlagsForTests(null);
console.log("multiClinicFlags: all assertions passed");
