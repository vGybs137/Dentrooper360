import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

import { isCellularConnection } from "@/helpers/connectivity";

export function useIsOnCellular(): boolean {
  const [onCellular, setOnCellular] = useState(false);

  useEffect(() => {
    void NetInfo.fetch().then((state) => {
      setOnCellular(isCellularConnection(state));
    });

    return NetInfo.addEventListener((state) => {
      setOnCellular(isCellularConnection(state));
    });
  }, []);

  return onCellular;
}
