import { memo, useCallback } from "react";
import { useRouter, type Href } from "expo-router";

import { SearchToggle } from "@/components/ui/SearchToggle";

function ScheduleSearchToggleComponent() {
  const router = useRouter();

  const openSearch = useCallback(() => {
    router.push("/appointments/search" as Href);
  }, [router]);

  return (
    <SearchToggle
      accessibilityLabel="Search appointments"
      openSearch={openSearch}
    />
  );
}

export const ScheduleSearchToggle = memo(ScheduleSearchToggleComponent);
