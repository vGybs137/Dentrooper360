import { View } from "react-native";
import DatePicker from "react-native-date-picker";
import Animated from "react-native-reanimated";

import { combineDateAndTime } from "@/helpers/appointmentDate";
import { useInlineCollapse } from "@/hooks/useInlineCollapse";
import { useAppTheme, useThemeTokens } from "@/theme";

const TIME_PICKER_HEIGHT = 216;

type AppointmentInlineTimePickerProps = {
  visible: boolean;
  value: Date;
  baseDate: Date;
  onSelectTime: (time: Date) => void;
};

export function AppointmentInlineTimePicker({
  visible,
  value,
  baseDate,
  onSelectTime,
}: AppointmentInlineTimePickerProps) {
  const theme = useThemeTokens();
  const { resolved } = useAppTheme();
  const { containerStyle, mounted } = useInlineCollapse(
    visible,
    TIME_PICKER_HEIGHT,
  );

  if (!mounted) {
    return null;
  }

  return (
    <Animated.View
      style={containerStyle}
      pointerEvents={visible ? "auto" : "none"}
    >
      <View
        style={{
          height: TIME_PICKER_HEIGHT,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <DatePicker
          date={value}
          dividerColor={theme.palette.border.subtle}
          is24hourSource="locale"
          locale="en-US"
          minuteInterval={5}
          mode="time"
          onDateChange={(next) => {
            onSelectTime(combineDateAndTime(baseDate, next));
          }}
          theme={resolved}
        />
      </View>
    </Animated.View>
  );
}
