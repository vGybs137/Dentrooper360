import assert from "node:assert/strict";
import { matchUiRole } from "./matchUiRole";

assert.equal(matchUiRole("RECEPTION", "RECEPTION"), true);
assert.equal(matchUiRole("provider", "PROVIDER", "RECEPTION"), true);
assert.equal(matchUiRole("RECEPTION", "PROVIDER"), false);
assert.equal(matchUiRole(null, "PROVIDER"), false);
assert.equal(matchUiRole(undefined, "ADMIN"), false);

console.log("authRole: all assertions passed");
