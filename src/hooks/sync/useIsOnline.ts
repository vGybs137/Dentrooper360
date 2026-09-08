import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

import { isNetInfoOnline } from "@/helpers/sync/connectivity";

/** Live device connectivity for gating online-only actions (e.g. login). */
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void NetInfo.fetch().then((state) => {
      if (!cancelled) {
        setIsOnline(isNetInfoOnline(state));
      }
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(isNetInfoOnline(state));
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return isOnline;
}
