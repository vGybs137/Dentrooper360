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

export async function isDeviceOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return isNetInfoOnline(state);
}
