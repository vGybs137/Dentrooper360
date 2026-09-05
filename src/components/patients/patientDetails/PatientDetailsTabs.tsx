import { useCallback, useEffect, useRef } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Button, ThemedIcon, ThemedText, type ThemedIconProps } from "@/components/ui";
import {
  balanceIcon,
  calendarIcon,
  notesIcon,
  personIcon,
} from "@/constants";
import { AUTH_SLIDE_EASING } from "@/helpers/authMotion";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

export type PatientDetailsTab =
  | "overview"
  | "appointments"
  | "services"
  | "payments";

type TabLayout = {
  x: number;
  width: number;
};

type TabDefinition = {
  id: PatientDetailsTab;
  label: string;
  icon: NonNullable<ThemedIconProps["name"]>;
};

const TABS: readonly TabDefinition[] = [
  { id: "overview", label: "Overview", icon: personIcon },
  { id: "appointments", label: "Appointments", icon: calendarIcon },
  { id: "services", label: "Services", icon: notesIcon },
  { id: "payments", label: "Payments", icon: balanceIcon },
];

const INDICATOR_DURATION_MS = 220;

type PatientDetailsTabsProps = {
  activeTab: PatientDetailsTab;
  onSelectTab: (tab: PatientDetailsTab) => void;
};

export function PatientDetailsTabs({
  activeTab,
  onSelectTab,
}: PatientDetailsTabsProps) {
  const native = useNativeColors();
  const tabLayouts = useRef<Partial<Record<PatientDetailsTab, TabLayout>>>({});
  const hasAnimated = useRef(false);
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  const moveIndicator = useCallback(
    (tab: PatientDetailsTab, animated: boolean) => {
      const layout = tabLayouts.current[tab];
      if (!layout) {
        return;
      }

      if (animated) {
        indicatorX.value = withTiming(layout.x, {
          duration: INDICATOR_DURATION_MS,
          easing: AUTH_SLIDE_EASING,
        });
        indicatorWidth.value = withTiming(layout.width, {
          duration: INDICATOR_DURATION_MS,
          easing: AUTH_SLIDE_EASING,
        });
        return;
      }

      indicatorX.value = layout.x;
      indicatorWidth.value = layout.width;
    },
    [indicatorWidth, indicatorX],
  );

  useEffect(() => {
    moveIndicator(activeTab, hasAnimated.current);
    hasAnimated.current = true;
  }, [activeTab, moveIndicator]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
  }));

  const handleTabLayout = useCallback(
    (tab: PatientDetailsTab) => (event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout;
      tabLayouts.current[tab] = { x, width };

      if (tab === activeTab) {
        moveIndicator(tab, hasAnimated.current);
      }
    },
    [activeTab, moveIndicator],
  );

  return (
    <View className="px-page pb-stack-compact pt-stack-compact">
      <View className="overflow-hidden rounded-control border border-border-subtle bg-surface-default p-1">
        <View className="relative w-full flex-row">
          <Animated.View
            pointerEvents="none"
            style={[
              indicatorStyle,
              {
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                borderRadius: semantic.radius.control,
                backgroundColor: native.brand.subtle,
                borderWidth: semantic.borderWidth.subtle,
                borderColor: native.brand.default,
              },
            ]}
          />

          {TABS.map((tab) => {
            const isSelected = activeTab === tab.id;

            return (
              <View
                key={tab.id}
                className="min-w-0 flex-1"
                onLayout={handleTabLayout(tab.id)}
              >
                <Button
                  accessibilityLabel={tab.label}
                  accessibilityState={{ selected: isSelected }}
                  className="w-full items-center gap-1 px-stack-compact py-stack-compact"
                  onPress={() => onSelectTab(tab.id)}
                  ripple={false}
                  size="none"
                  tone="neutral"
                  variant="ghost"
                >
                  <ThemedIcon
                    dimension={18}
                    name={tab.icon}
                    tone={isSelected ? "brand" : "muted"}
                  />
                  <ThemedText
                    align="center"
                    className="text-[11px] font-semibold leading-4"
                    tone={isSelected ? "brand" : "muted"}
                    variant="label"
                  >
                    {tab.label}
                  </ThemedText>
                </Button>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export { TABS as PATIENT_DETAILS_TABS };
