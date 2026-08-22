import { View } from "react-native";

import {
  WEEK_VIEW_NOW_INDICATOR_ARROW_HEIGHT,
  WEEK_VIEW_NOW_INDICATOR_ARROW_WIDTH,
  WEEK_VIEW_NOW_INDICATOR_HEIGHT,
} from "@/constants/schedule";

type NowIndicatorArrowProps = {
  color: string;
  width: number;
  height: number;
};

function NowIndicatorArrow({ color, width, height }: NowIndicatorArrowProps) {
  const halfHeight = height / 2;
  return (
    <View
      style={{
        width,
        height,
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <View
        style={{
          width: 0,
          height: 0,
          borderTopWidth: halfHeight,
          borderBottomWidth: halfHeight,
          borderLeftWidth: width,
          borderTopColor: "transparent",
          borderBottomColor: "transparent",
          borderLeftColor: color,
        }}
      />
    </View>
  );
}

export type TimedGridNowIndicatorProps = {
  color: string;
};

/** Horizontal now-time rule with left arrow — shared by week and day grids. */
export function TimedGridNowIndicator({ color }: TimedGridNowIndicatorProps) {
  return (
    <View
      style={{
        flex: 1,
        height: WEEK_VIEW_NOW_INDICATOR_ARROW_HEIGHT,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          height: WEEK_VIEW_NOW_INDICATOR_HEIGHT,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          justifyContent: "center",
          zIndex: 1,
        }}
      >
        <NowIndicatorArrow
          color={color}
          width={WEEK_VIEW_NOW_INDICATOR_ARROW_WIDTH}
          height={WEEK_VIEW_NOW_INDICATOR_ARROW_HEIGHT}
        />
      </View>
    </View>
  );
}
