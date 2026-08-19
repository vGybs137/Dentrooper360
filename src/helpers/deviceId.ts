import * as Device from "expo-device";
import { Platform } from "react-native";

import { getItem, setItem } from "@/helpers/secureStorage";

const DEVICE_ID_KEY = "device_id";

function generateUuid(): string {
  // Simple RFC4122-like UUID generator.
  // Sufficient for generating a stable pairing id; not meant for cryptographic security.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceInfo() {
  return {
    deviceName: Device.deviceName ?? Device.modelName ?? "Unknown",
    platform: Platform.OS,
    version: Device.osVersion ?? Platform.Version?.toString() ?? null,
  };
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }

  const next = generateUuid();
  await setItem(DEVICE_ID_KEY, next);
  return next;
}

