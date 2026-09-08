import NetInfo from "@react-native-community/netinfo";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  Snackbar,
  type ConnectivitySnackbarVariant,
} from "@/components/ui/Snackbar";
import { isNetInfoOnline } from "@/helpers/sync/connectivity";

/** Longer than a typical toast so connectivity status can be read. */
const SNACKBAR_VISIBLE_MS = 7000;

type SnackbarState = {
  message: string;
  variant: ConnectivitySnackbarVariant;
};

/**
 * App-wide snackbar for connectivity transitions (offline / back online).
 * Skips the initial NetInfo reading so launch does not flash a toast.
 */
export function ConnectivitySnackbar() {
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const [visible, setVisible] = useState(false);
  const wasOnlineRef = useRef<boolean | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    function show(next: SnackbarState) {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      setSnackbar(next);
      setVisible(true);
      hideTimeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, SNACKBAR_VISIBLE_MS);
    }

    function handleOnlineChange(isOnline: boolean) {
      const previous = wasOnlineRef.current;
      wasOnlineRef.current = isOnline;

      if (previous == null || previous === isOnline) {
        return;
      }

      if (!isOnline) {
        show({
          message: "You're offline. Please check your connection.",
          variant: "offline",
        });
        return;
      }

      show({
        message: "You're back online.",
        variant: "online",
      });
    }

    void NetInfo.fetch().then((state) => {
      handleOnlineChange(isNetInfoOnline(state));
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      handleOnlineChange(isNetInfoOnline(state));
    });

    return () => {
      unsubscribe();
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  if (!snackbar) {
    return null;
  }

  return (
    <Snackbar
      message={snackbar.message}
      onDismiss={dismiss}
      variant={snackbar.variant}
      visible={visible}
    />
  );
}
