import {
  DrawerContentScrollView,
  DrawerItem,
  type DrawerContentComponentProps,
} from "expo-router/drawer";
import { SymbolView } from "expo-symbols";
import { memo, useMemo } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SCHEDULE_VIEW_MODES } from "@/components/schedule/scheduleViewModes";
import { ThemedText } from "@/components/ui";
import {
  setScheduleViewMode,
  useScheduleViewModeStore,
} from "@/stores/scheduleViewModeStore";
import { useThemeTokens } from "@/theme";

function ScheduleDrawerContentComponent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const viewMode = useScheduleViewModeStore((state) => state.viewMode);

  const headerStyle = useMemo(
    () => ({
      paddingHorizontal: theme.semantic.space.inline.default,
      paddingBottom: theme.semantic.space.stack.default,
      gap: theme.semantic.space.gap.compact,
    }),
    [theme],
  );

  const contentContainerStyle = useMemo(
    () => ({
      paddingTop: insets.top + theme.semantic.space.page,
      paddingBottom: insets.bottom + theme.semantic.space.stack.default,
      paddingLeft: insets.left,
    }),
    [insets.bottom, insets.left, insets.top, theme],
  );

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={contentContainerStyle}
    >
      <View style={headerStyle}>
        <ThemedText variant="title">Calendar</ThemedText>
      </View>
      {SCHEDULE_VIEW_MODES.map(({ mode, label, icon }) => (
        <DrawerItem
          key={mode}
          activeBackgroundColor={theme.palette.brand.subtle}
          activeTintColor={theme.palette.brand.default}
          focused={viewMode === mode}
          icon={({ color, size }) => (
            <SymbolView name={icon} size={size} tintColor={color} />
          )}
          inactiveTintColor={theme.palette.foreground.muted}
          label={label}
          onPress={() => {
            setScheduleViewMode(mode);
            navigation.closeDrawer();
          }}
        />
      ))}
    </DrawerContentScrollView>
  );
}

export const ScheduleDrawerContent = memo(ScheduleDrawerContentComponent);
