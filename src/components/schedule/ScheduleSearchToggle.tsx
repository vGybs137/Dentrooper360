import { memo, useCallback } from "react";
import { useRouter, type Href } from "expo-router";
import { useTranslation } from "react-i18next";

import { SearchToggle } from "@/components/ui/SearchToggle";

function ScheduleSearchToggleComponent() {
  const { t } = useTranslation("a11y");
  const router = useRouter();

  const openSearch = useCallback(() => {
    router.push("/appointments/search" as Href);
  }, [router]);

  return (
    <SearchToggle
      accessibilityLabel={t("a11y:searchAppointments")}
      openSearch={openSearch}
    />
  );
}

export const ScheduleSearchToggle = memo(ScheduleSearchToggleComponent);
