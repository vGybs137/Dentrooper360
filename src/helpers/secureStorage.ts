import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return sessionStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string | null): Promise<void> {
  if (value === null) {
    if (Platform.OS === "web") {
      sessionStorage.removeItem(key);
      return;
    }

    await SecureStore.deleteItemAsync(key);
    return;
  }

  if (Platform.OS === "web") {
    sessionStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}
