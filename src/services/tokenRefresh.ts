import { AppState, type AppStateStatus, type NativeEventSubscription } from "react-native";

import {
  ACCESS_TOKEN_LIFETIME_MS,
  TOKEN_REFRESH_CHECK_INTERVAL_MS,
  TOKEN_REFRESH_LEAD_MS,
} from "@/constants/auth";
import { recycleTokens } from "@/helpers/sessionRefresh";
import { getAccessTokenExpiresAt, useAuthStore } from "@/stores";

let intervalId: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: NativeEventSubscription | null = null;
let isTickInFlight = false;

export function shouldRefreshAccessToken(now = Date.now()): boolean {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) {
    return false;
  }

  const expiresAt = getAccessTokenExpiresAt();
  if (!expiresAt) {
    return true;
  }

  return now >= expiresAt.getTime() - TOKEN_REFRESH_LEAD_MS;
}

export function getNextRefreshAt(): Date | null {
  const expiresAt = getAccessTokenExpiresAt();
  if (!expiresAt) {
    return new Date(Date.now() + ACCESS_TOKEN_LIFETIME_MS - TOKEN_REFRESH_LEAD_MS);
  }

  return new Date(expiresAt.getTime() - TOKEN_REFRESH_LEAD_MS);
}

async function tick() {
  if (isTickInFlight || AppState.currentState !== "active") {
    return;
  }

  if (!shouldRefreshAccessToken()) {
    return;
  }

  isTickInFlight = true;

  try {
    await recycleTokens();
  } finally {
    isTickInFlight = false;
  }
}

function handleAppStateChange(nextState: AppStateStatus) {
  if (nextState !== "active") {
    return;
  }

  void tick();
}

export function startTokenRefreshService() {
  if (intervalId) {
    return;
  }

  void tick();
  intervalId = setInterval(() => {
    void tick();
  }, TOKEN_REFRESH_CHECK_INTERVAL_MS);
  appStateSubscription = AppState.addEventListener("change", handleAppStateChange);
}

export function stopTokenRefreshService() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  appStateSubscription?.remove();
  appStateSubscription = null;
}
