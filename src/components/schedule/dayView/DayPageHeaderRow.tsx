import { memo, useMemo } from "react";
import { View } from "react-native";

import { DayHeaderLabel } from "@/components/schedule/DayHeaderLabel";
import { useThemeTokens } from "@/theme";
import type { DayKey } from "@/utils/calendar";

export type DayPageHeaderRowProps = {
  dayKey: DayKey;
  gutterWidth: number;
};

function DayPageHeaderRowComponent({
  dayKey,
  gutterWidth,
}: DayPageHeaderRowProps) {
  const theme = useThemeTokens();

  const rootStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingBottom: theme.semantic.space.stack.compact,
    }),
    [theme],
  );

  const labelStyle = useMemo(
    () => ({
      paddingHorizontal: theme.semantic.space.stack.compact,
      paddingVertical: theme.semantic.space.stack.comfortable,
    }),
    [theme],
  );

  return (
    <View className="w-full self-stretch" style={rootStyle}>
      <View style={{ width: gutterWidth }} />
      <DayHeaderLabel dayKey={dayKey} style={labelStyle} />
    </View>
  );
}

export const DayPageHeaderRow = memo(DayPageHeaderRowComponent);
