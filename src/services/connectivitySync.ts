import NetInfo, { type NetInfoSubscription } from "@react-native-community/netinfo";

import { synchronize } from "@/database/synchronize";
import {
  canSyncOnCurrentNetwork,
  isNetInfoOnline,
} from "@/helpers/connectivity";
import { setOfflineMode, useSyncStatusStore } from "@/stores";

let subscription: NetInfoSubscription | null = null;
let activeCustomerId: string | null = null;
let wasOnline: boolean | null = null;
let isSyncInFlight = false;

async function syncOnReconnect(customerId: string) {
  if (isSyncInFlight) {
    return;
  }

  const wifiOnly = useSyncStatusStore.getState().syncWifiOnly;
  const { allowed } = await canSyncOnCurrentNetwork(wifiOnly);
  if (!allowed) {
    return;
  }

  isSyncInFlight = true;
  try {
    await synchronize(customerId);
  } catch {
    // Leave offline mode as-is; next reconnect or periodic tick will retry.
  } finally {
    isSyncInFlight = false;
  }
}

function handleConnectivityChange(isOnline: boolean) {
  setOfflineMode(!isOnline);

  if (isOnline && wasOnline === false && activeCustomerId) {
    void syncOnReconnect(activeCustomerId);
  }

  wasOnline = isOnline;
}

export function startConnectivitySync(customerId: string) {
  if (subscription && activeCustomerId === customerId) {
    return;
  }

  stopConnectivitySync();
  activeCustomerId = customerId;

  void NetInfo.fetch().then((state) => {
    if (activeCustomerId !== customerId) {
      return;
    }

    handleConnectivityChange(isNetInfoOnline(state));
  });

  subscription = NetInfo.addEventListener((state) => {
    handleConnectivityChange(isNetInfoOnline(state));
  });
}

export function stopConnectivitySync() {
  subscription?.();
  subscription = null;
  activeCustomerId = null;
  wasOnline = null;
  isSyncInFlight = false;
}
