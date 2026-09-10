import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const tests = [
  "src/database/clinicSyncLock.test.ts",
  "src/database/warmClinicPolicy.test.ts",
  "src/database/readAccessTokenCustomerId.test.ts",
  "src/database/sortClinicsByLru.test.ts",
  "src/constants/multiClinicFlags.test.ts",
];

let failed = false;

for (const relative of tests) {
  const absolute = path.join(root, relative);
  // Quote paths — workspace directory contains spaces on Windows.
  const result = spawnSync(`npx --yes tsx "${absolute}"`, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: true,
  });

  if (result.status !== 0) {
    failed = true;
    console.error(`FAILED ${relative}`);
  }
}

if (failed) {
  process.exit(1);
}

console.log("hardening: all mobile unit tests passed");
