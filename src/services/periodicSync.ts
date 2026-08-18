import { AppState, type AppStateStatus, type NativeEventSubscription } from "react-native";

import { SYNC_INTERVAL_MS } from "@/constants/sync";
import { synchronize } from "@/database/synchronize";

let intervalId: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: NativeEventSubscription | null = null;
let activeCustomerId: string | null = null;
let lastSyncedAt = 0;
let isTickInFlight = false;

async function tick() {
  if (isTickInFlight || !activeCustomerId || AppState.currentState !== "active") {
    return;
  }

  isTickInFlight = true;
  lastSyncedAt = Date.now();

  try {
    await synchronize(activeCustomerId);
  } finally {
    isTickInFlight = false;
  }
}

function handleAppStateChange(nextState: AppStateStatus) {
  if (nextState !== "active") {
    return;
  }

  if (Date.now() - lastSyncedAt >= SYNC_INTERVAL_MS) {
    void tick();
  }
}

export function startPeriodicSync(customerId: string) {
  if (intervalId && activeCustomerId === customerId) {
    return;
  }

  stopPeriodicSync();
  activeCustomerId = customerId;
  lastSyncedAt = Date.now();
  intervalId = setInterval(() => {
    void tick();
  }, SYNC_INTERVAL_MS);
  appStateSubscription = AppState.addEventListener("change", handleAppStateChange);
}

export function stopPeriodicSync() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  appStateSubscription?.remove();
  appStateSubscription = null;
  activeCustomerId = null;
}
