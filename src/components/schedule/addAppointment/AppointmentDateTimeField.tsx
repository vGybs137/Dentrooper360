import dayjs from "dayjs";
import { type ReactNode } from "react";
import { View } from "react-native";

import { Button, ThemedIcon, ThemedText } from "@/components/ui";
import { clockIcon } from "@/constants";
import { dayjsTimePattern } from "@/helpers/ui/timeFormat";
import { useHourFormat } from "@/stores/schedulePreferencesStore";
import { cn } from "@/helpers/ui/cn";

import { AppointmentDayFreeHoursInfo } from "./AppointmentDayFreeHoursInfo";
import { AppointmentInlineCalendar } from "./AppointmentInlineCalendar";
import { AppointmentInlineTimePicker } from "./AppointmentInlineTimePicker";

export type AppointmentDateTimeExpanded = "calendar" | "start" | "end" | null;

type AppointmentDateTimeFieldProps = {
  startTime: Date;
  endTime: Date;
  onChangeDate: (date: Date) => void;
  onChangeStart: (time: Date) => void;
  onChangeEnd: (time: Date) => void;
  expanded: AppointmentDateTimeExpanded;
  onExpandedChange: (expanded: AppointmentDateTimeExpanded) => void;
};

function SelectionPill({
  active,
  accessibilityLabel,
  children,
  onPress,
}: {
  active: boolean;
  accessibilityLabel: string;
  children: ReactNode;
  onPress: () => void;
}) {
  return (
    <Button
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded: active }}
      bottomSheet
      className={cn(
        "justify-center rounded-pill px-inline py-stack-compact",
        active && "bg-brand-subtle",
      )}
      hitSlop={6}
      onPress={onPress}
      size="none"
      tone="neutral"
      variant="ghost"
    >
      {children}
    </Button>
  );
}

export function AppointmentDateTimeField({
  startTime,
  endTime,
  onChangeDate,
  onChangeStart,
  onChangeEnd,
  expanded,
  onExpandedChange,
}: AppointmentDateTimeFieldProps) {
  const hourFormat = useHourFormat();
  const timePattern = dayjsTimePattern(hourFormat);

  const dateLabel = dayjs(startTime).format("D MMM, YYYY");
  const startLabel = dayjs(startTime).format(timePattern);
  const endLabel = dayjs(endTime).format(timePattern);
  const toggle = (panel: Exclude<AppointmentDateTimeExpanded, null>) => {
    onExpandedChange(expanded === panel ? null : panel);
  };

  return (
    <View className="w-full gap-gap-compact">
      <View className="w-full flex-row items-center gap-2">
        <View className="min-w-0 flex-1 items-start gap-2">
          <View className="flex-row items-center gap-3">
            <ThemedIcon dimension={20} name={clockIcon} tone="muted" />

            <SelectionPill
              accessibilityLabel="Change appointment date"
              active={expanded === "calendar"}
              onPress={() => toggle("calendar")}
            >
              <ThemedText variant="body">{dateLabel}</ThemedText>
            </SelectionPill>
          </View>

          <View className="ml-8 flex-row items-center gap-2">
            <SelectionPill
              accessibilityLabel="Change start time"
              active={expanded === "start"}
              onPress={() => toggle("start")}
            >
              <ThemedText variant="body">{startLabel}</ThemedText>
            </SelectionPill>

            <ThemedIcon
              dimension={14}
              name={{
                ios: "arrow.right",
                android: "arrow_forward",
                web: "arrow_forward",
              }}
              tone="muted"
            />

            <SelectionPill
              accessibilityLabel="Change end time"
              active={expanded === "end"}
              onPress={() => toggle("end")}
            >
              <ThemedText variant="body">{endLabel}</ThemedText>
            </SelectionPill>
          </View>
        </View>

        <View className="shrink-0">
          <AppointmentDayFreeHoursInfo
            date={startTime}
            endTime={endTime}
            startTime={startTime}
          />
        </View>
      </View>

      <AppointmentInlineCalendar
        onSelectDate={onChangeDate}
        selectedDate={startTime}
        visible={expanded === "calendar"}
      />

      <AppointmentInlineTimePicker
        baseDate={expanded === "end" ? endTime : startTime}
        onSelectTime={expanded === "end" ? onChangeEnd : onChangeStart}
        value={expanded === "end" ? endTime : startTime}
        visible={expanded === "start" || expanded === "end"}
      />
    </View>
  );
}
