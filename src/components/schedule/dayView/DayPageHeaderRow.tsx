import { memo, useMemo } from "react";
import { View } from "react-native";
import { semantic } from "@/tokens";

import { DayHeaderLabel } from "@/components/schedule/DayHeaderLabel";
import type { DayKey } from "@/utils/calendar";

export type DayPageHeaderRowProps = {
  dayKey: DayKey;
  gutterWidth: number;
};

function DayPageHeaderRowComponent({
  dayKey,
  gutterWidth,
}: DayPageHeaderRowProps) {

  const rootStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingBottom: semantic.space.stack.compact,
    }),
    [],
  );

  const labelStyle = useMemo(
    () => ({
      paddingHorizontal: semantic.space.stack.compact,
      paddingVertical: semantic.space.stack.comfortable,
    }),
    [],
  );

  return (
    <View className="w-full self-stretch" style={rootStyle}>
      <View style={{ width: gutterWidth }} />
      <DayHeaderLabel dayKey={dayKey} style={labelStyle} />
    </View>
  );
}

export const DayPageHeaderRow = memo(DayPageHeaderRowComponent);
