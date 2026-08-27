import { memo, useCallback } from "react";
import { useRouter, type Href } from "expo-router";

import { Button, ThemedIcon } from "@/components/ui";
import { searchIcon } from "@/constants";

function ScheduleSearchToggleComponent() {
  const router = useRouter();

  const openSearch = useCallback(() => {
    router.push("/appointments/search" as Href);
  }, [router]);

  return (
    <Button
      accessibilityLabel="Search appointments"
      className="min-h-touch w-touch items-end justify-center"
      hitSlop={8}
      onPress={openSearch}
      size="none"
      tone="neutral"
      variant="ghost"
    >
      <ThemedIcon name={searchIcon} />
    </Button>
  );
}

export const ScheduleSearchToggle = memo(ScheduleSearchToggleComponent);
