import { View, type StyleProp, type ViewStyle } from "react-native";

import { MONTH_VIEW_EVENT_LIST_RAIL_WIDTH } from "@/constants/schedule";
import { primitives } from "@/tokens";

export type EventRailProps = {
  color: string;
  style?: StyleProp<ViewStyle>;
};

/** Colored vertical rail used on list / search result rows. */
export function EventRail({ color, style }: EventRailProps) {
  return (
    <View
      style={[
        {
          width: MONTH_VIEW_EVENT_LIST_RAIL_WIDTH,
          borderRadius: primitives.radius.xs,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}
