import {
  DrawerContentScrollView,
  DrawerItem,
  type DrawerContentComponentProps,
} from "expo-router/drawer";
import { memo, useMemo } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SCHEDULE_VIEW_MODES } from "@/components/schedule/scheduleViewModes";
import { ThemedIcon, ThemedText } from "@/components/ui";
import {
  setScheduleViewMode,
  useAddAppointmentStore,
  useScheduleViewModeStore,
} from "@/stores";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

function ScheduleDrawerContentComponent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const native = useNativeColors();
  const insets = useSafeAreaInsets();
  const viewMode = useScheduleViewModeStore((state) => state.viewMode);
  const clearOrCloseAddAppointment = useAddAppointmentStore(
    (state) => state.clearOrClose,
  );

  const drawerItemStyle = useMemo(
    () => ({
      borderRadius: semantic.radius.control,
    }),
    [],
  );

  const headerStyle = useMemo(
    () => ({
      paddingHorizontal: semantic.space.inline.default,
      paddingBottom: semantic.space.stack.default,
      gap: semantic.space.gap.compact,
    }),
    [],
  );

  const contentContainerStyle = useMemo(
    () => ({
      paddingTop: insets.top + semantic.space.page,
      paddingBottom: insets.bottom + semantic.space.stack.default,
      paddingLeft: insets.left,
    }),
    [insets.bottom, insets.left, insets.top],
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
          activeBackgroundColor={native.brand.subtle}
          activeTintColor={native.brand.default}
          focused={viewMode === mode}
          icon={({ color, size }) => (
            <ThemedIcon
              dimension={size}
              name={icon}
              tintColor={color}
            />
          )}
          inactiveTintColor={native.foreground.muted}
          label={label}
          style={drawerItemStyle}
          onPress={() => {
            clearOrCloseAddAppointment();
            setScheduleViewMode(mode);
            navigation.closeDrawer();
          }}
        />
      ))}
    </DrawerContentScrollView>
  );
}

export const ScheduleDrawerContent = memo(ScheduleDrawerContentComponent);
