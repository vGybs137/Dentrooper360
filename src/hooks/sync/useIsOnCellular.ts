import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

import { isCellularConnection } from "@/helpers/sync/connectivity";

export function useIsOnCellular(): boolean {
  const [onCellular, setOnCellular] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void NetInfo.fetch().then((state) => {
      if (!cancelled) {
        setOnCellular(isCellularConnection(state));
      }
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnCellular(isCellularConnection(state));
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return onCellular;
}
