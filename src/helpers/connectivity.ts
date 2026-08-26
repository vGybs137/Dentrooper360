import type { NetInfoState } from "@react-native-community/netinfo";
import NetInfo from "@react-native-community/netinfo";

/** Connected unless NetInfo reports no link or no internet reachability. */
export function isNetInfoOnline(state: NetInfoState): boolean {
  if (state.isConnected === false) {
    return false;
  }

  if (state.isInternetReachable === false) {
    return false;
  }

  return true;
}

export function isCellularConnection(state: NetInfoState): boolean {
  return state.type === "cellular";
}

export async function isDeviceOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return isNetInfoOnline(state);
}

export async function isDeviceOnCellular(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return isCellularConnection(state);
}

/**
 * Whether sync is allowed on the current network.
 * When `wifiOnly` is true, cellular connections are blocked.
 */
export async function canSyncOnCurrentNetwork(
  wifiOnly: boolean,
): Promise<{ allowed: boolean; reason?: "offline" | "cellular" }> {
  const state = await NetInfo.fetch();

  if (!isNetInfoOnline(state)) {
    return { allowed: false, reason: "offline" };
  }

  if (wifiOnly && isCellularConnection(state)) {
    return { allowed: false, reason: "cellular" };
  }

  return { allowed: true };
}
