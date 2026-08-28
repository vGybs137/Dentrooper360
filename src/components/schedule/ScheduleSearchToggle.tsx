import { memo, useCallback } from "react";
import { useRouter, type Href } from "expo-router";

import { Button, ThemedIcon } from "@/components/ui";
import { searchIcon } from "@/constants";
import { semantic } from "@/tokens";

function ScheduleSearchToggleComponent() {
  const router = useRouter();

  const openSearch = useCallback(() => {
    router.push("/appointments/search" as Href);
  }, [router]);

  return (
    <Button
      accessibilityLabel="Search appointments"
      hitSlop={8}
      onPress={openSearch}
      size="none"
      style={{
        width: semantic.size.touch,
        height: semantic.size.touch,
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      tone="neutral"
      variant="ghost"
    >
      <ThemedIcon name={searchIcon} />
    </Button>
  );
}

export const ScheduleSearchToggle = memo(ScheduleSearchToggleComponent);
