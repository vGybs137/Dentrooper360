import * as Device from "expo-device";
import { Platform } from "react-native";

import { generateGuid } from "@/helpers/guid";
import { getItem, setItem } from "@/helpers/secureStorage";

const DEVICE_ID_KEY = "device_id";

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

  const next = generateGuid();
  await setItem(DEVICE_ID_KEY, next);
  return next;
}

