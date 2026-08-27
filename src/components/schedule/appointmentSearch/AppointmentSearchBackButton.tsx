import { memo, useMemo } from "react";
import { ScrollView, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { Button, ColorSwatch, ThemedIcon, ThemedText } from "@/components/ui";
import type { AppointmentSearchTypeOption } from "@/hooks/useAppointmentSearch";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

const CHEVRON_LEFT_ICON = {
  ios: "chevron.left",
  android: "chevron_left",
  web: "chevron_left",
} as const;

const CLEAR_ICON = {
  ios: "xmark",
  android: "close",
  web: "close",
} as const;

export type AppointmentSearchBackButtonProps = {
  scrollY: SharedValue<number>;
  initialTop: number;
  pinnedTop: number;
  collapseScrollDistance: number;
  safeAreaTop: number;
  safeAreaLeft: number;
  safeAreaRight: number;
  selectedTypes: readonly AppointmentSearchTypeOption[];
  timeWindowLabel: string | null;
  onPress: () => void;
  onClearType: (typeId: string) => void;
  onClearTimeWindow: () => void;
};

function AppointmentSearchBackButtonComponent({
  scrollY,
  initialTop,
  pinnedTop,
  collapseScrollDistance,
  safeAreaTop,
  safeAreaLeft,
  safeAreaRight,
  selectedTypes,
  timeWindowLabel,
  onPress,
  onClearType,
  onClearTimeWindow,
}: AppointmentSearchBackButtonProps) {
  const native = useNativeColors();
  const touchSize = semantic.size.touch;
  const pageInset = semantic.space.page;
  const hasFilterChips = selectedTypes.length > 0 || timeWindowLabel != null;

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    top: Math.max(
      safeAreaTop + pinnedTop,
      safeAreaTop + initialTop - scrollY.value,
    ),
  }));

  const circleAnimatedStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      scrollY.value,
      [collapseScrollDistance, collapseScrollDistance + 1],
      [0, 1],
      Extrapolation.CLAMP,
    );

    return {
      opacity: progress,
    };
  });

  const hitStyle = useMemo(
    () => ({
      width: touchSize,
      height: touchSize,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    }),
    [touchSize],
  );

  const circleStyle = useMemo(
    () => ({
      ...hitStyle,
      position: "absolute" as const,
      borderRadius: touchSize / 2,
      backgroundColor: native.surface.raised,
      borderWidth: semantic.borderWidth.subtle,
      borderColor: native.border.strong,
    }),
    [hitStyle, native, touchSize],
  );

  const slotStyle = useMemo(
    () => ({
      position: "absolute" as const,
      left: safeAreaLeft + pageInset,
      right: safeAreaRight + pageInset,
      zIndex: semantic.zIndex.sticky,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      gap: semantic.space.gap.compact,
    }),
    [pageInset, safeAreaLeft, safeAreaRight],
  );

  const chipStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: semantic.space.gap.compact,
      height: semantic.size["control-sm"],
      borderRadius: semantic.radius.pill,
      borderWidth: semantic.borderWidth.subtle,
      borderColor: native.foreground.default,
      paddingLeft: semantic.space.inline.compact,
      paddingRight: semantic.space.stack.compact,
      backgroundColor: native.surface.sunken,
      maxWidth: 160,
    }),
    [native],
  );

  const clearHitStyle = useMemo(
    () => ({
      width: semantic.size["icon-sm"] + semantic.space.stack.compact,
      height: semantic.size["control-sm"],
      alignItems: "center" as const,
      justifyContent: "center" as const,
    }),
    [],
  );

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[slotStyle, containerAnimatedStyle]}
    >
      <Button
        accessibilityLabel="Back"
        hitSlop={8}
        onPress={onPress}
        size="none"
        style={hitStyle}
        tone="neutral"
        variant="ghost"
      >
        <Animated.View
          pointerEvents="none"
          style={[circleStyle, circleAnimatedStyle]}
        />
        <ThemedIcon name={CHEVRON_LEFT_ICON} />
      </Button>

      {hasFilterChips ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            alignItems: "center",
            justifyContent: "flex-end",
            gap: semantic.space.gap.compact,
            flexGrow: 1,
          }}
          style={{ flex: 1, marginLeft: semantic.space.gap.default }}
        >
          {timeWindowLabel ? (
            <View style={chipStyle}>
              <ThemedText numberOfLines={1} variant="label">
                {timeWindowLabel}
              </ThemedText>
              <Button
                accessibilityLabel={`Clear ${timeWindowLabel} filter`}
                hitSlop={8}
                onPress={onClearTimeWindow}
                ripple={false}
                size="none"
                style={clearHitStyle}
                tone="neutral"
                variant="ghost"
              >
                <ThemedIcon
                  dimension={12}
                  name={CLEAR_ICON}
                  tone="muted"
                />
              </Button>
            </View>
          ) : null}
          {selectedTypes.map((type) => (
            <View key={type.id} style={chipStyle}>
              {type.color ? (
                <ColorSwatch color={type.color} size={8} />
              ) : null}
              <ThemedText numberOfLines={1} variant="label">
                {type.name}
              </ThemedText>
              <Button
                accessibilityLabel={`Clear ${type.name} filter`}
                hitSlop={8}
                onPress={() => onClearType(type.id)}
                ripple={false}
                size="none"
                style={clearHitStyle}
                tone="neutral"
                variant="ghost"
              >
                <ThemedIcon
                  dimension={12}
                  name={CLEAR_ICON}
                  tone="muted"
                />
              </Button>
            </View>
          ))}
        </ScrollView>
      ) : null}
    </Animated.View>
  );
}

export const AppointmentSearchBackButton = memo(
  AppointmentSearchBackButtonComponent,
);
