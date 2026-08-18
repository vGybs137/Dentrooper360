import Constants from "expo-constants";
import { Platform } from "react-native";

const DEFAULT_API_PORT = 5184;
const DEFAULT_API_URL = `http://localhost:${DEFAULT_API_PORT}`;

function replaceLoopbackWithAndroidEmulatorHost(url: string): string {
  return url
    .replace("://localhost", "://10.0.2.2")
    .replace("://127.0.0.1", "://10.0.2.2");
}

function getExpoDevHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) {
    return null;
  }

  const host = hostUri.split(":")[0]?.trim();
  return host || null;
}

function resolveDevApiUrl(): string {
  const expoHost = getExpoDevHost();
  if (expoHost) {
    return `http://${expoHost}:${DEFAULT_API_PORT}`;
  }

  return DEFAULT_API_URL;
}

function resolveApiBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL ?? resolveDevApiUrl();

  if (Platform.OS === "android") {
    return replaceLoopbackWithAndroidEmulatorHost(configuredUrl);
  }

  return configuredUrl;
}

export const API_BASE_URL = resolveApiBaseUrl();

export const API_TIMEOUT_MS = 30_000;
