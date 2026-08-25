import { SymbolView } from "expo-symbols";
import { memo, useMemo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { ColorSwatch, ThemedText } from "@/components/ui";
import type { AppointmentSearchTypeOption } from "@/hooks/useAppointmentSearch";
import { useThemeTokens } from "@/theme";

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
  onPress: () => void;
  onClearType: (typeId: string) => void;
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
  onPress,
  onClearType,
}: AppointmentSearchBackButtonProps) {
  const theme = useThemeTokens();
  const touchSize = theme.semantic.size.touch;
  const pageInset = theme.semantic.space.page;

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
      backgroundColor: theme.palette.surface.raised,
      borderWidth: theme.semantic.borderWidth.subtle,
      borderColor: theme.colors.borderStrong,
    }),
    [hitStyle, theme],
  );

  const slotStyle = useMemo(
    () => ({
      position: "absolute" as const,
      left: safeAreaLeft + pageInset,
      right: safeAreaRight + pageInset,
      zIndex: theme.semantic.zIndex.sticky,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      gap: theme.semantic.space.gap.compact,
    }),
    [pageInset, safeAreaLeft, safeAreaRight, theme],
  );

  const chipStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: theme.semantic.space.gap.compact,
      height: theme.semantic.size["control-sm"],
      borderRadius: theme.semantic.radius.pill,
      borderWidth: theme.semantic.borderWidth.subtle,
      borderColor: theme.palette.foreground.default,
      paddingLeft: theme.semantic.space.inline.compact,
      paddingRight: theme.semantic.space.stack.compact,
      backgroundColor: theme.palette.surface.sunken,
      maxWidth: 160,
    }),
    [theme],
  );

  const clearHitStyle = useMemo(
    () => ({
      width: theme.semantic.size["icon-sm"] + theme.semantic.space.stack.compact,
      height: theme.semantic.size["control-sm"],
      alignItems: "center" as const,
      justifyContent: "center" as const,
    }),
    [theme],
  );

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[slotStyle, containerAnimatedStyle]}
    >
      <Pressable
        accessibilityLabel="Back"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onPress}
        style={hitStyle}
      >
        <Animated.View
          pointerEvents="none"
          style={[circleStyle, circleAnimatedStyle]}
        />
        <SymbolView
          name={CHEVRON_LEFT_ICON}
          size={theme.semantic.size.icon}
          tintColor={theme.palette.foreground.default}
        />
      </Pressable>

      {selectedTypes.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            alignItems: "center",
            justifyContent: "flex-end",
            gap: theme.semantic.space.gap.compact,
            flexGrow: 1,
          }}
          style={{ flex: 1, marginLeft: theme.semantic.space.gap.default }}
        >
          {selectedTypes.map((type) => (
            <View key={type.id} style={chipStyle}>
              {type.color ? (
                <ColorSwatch color={type.color} size={8} />
              ) : null}
              <ThemedText numberOfLines={1} variant="label">
                {type.name}
              </ThemedText>
              <Pressable
                accessibilityLabel={`Clear ${type.name} filter`}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => onClearType(type.id)}
                style={clearHitStyle}
              >
                <SymbolView
                  name={CLEAR_ICON}
                  size={12}
                  tintColor={theme.palette.foreground.muted}
                />
              </Pressable>
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
