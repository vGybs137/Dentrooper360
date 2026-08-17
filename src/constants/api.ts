import { Platform } from "react-native";

const DEFAULT_API_URL = "https://localhost:7252";

function resolveDevHost(url: string): string {
  if (Platform.OS !== "android") {
    return url;
  }

  return url.replace("://localhost", "://10.0.2.2").replace("://127.0.0.1", "://10.0.2.2");
}

export const API_BASE_URL = resolveDevHost(
  process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
);

export const API_TIMEOUT_MS = 30_000;
