import { type ReactNode, useEffect } from "react";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import {
  useLocalePreferencesHasHydrated,
  useLocalePreferencesStore,
} from "@/stores/localePreferencesStore";

type I18nProviderProps = {
  children: ReactNode;
};

/**
 * Ensures locale preference hydration applies language + RTL once storage is ready.
 * i18next itself is initialized at module load with the default locale.
 */
export function I18nProvider({ children }: I18nProviderProps) {
  const hasHydrated = useLocalePreferencesHasHydrated();

  useEffect(() => {
    if (!hasHydrated) return;
    useLocalePreferencesStore.getState().resolveAndApply();
  }, [hasHydrated]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
