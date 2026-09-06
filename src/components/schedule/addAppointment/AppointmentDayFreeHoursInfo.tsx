import dayjs from "dayjs";
import { memo, useEffect, useMemo, useState } from "react";
import { View } from "react-native";

import { FormSectionErrorTrigger } from "@/components/patients/addPatient/FormSectionErrorTrigger";
import { ActionMenu, ThemedIcon } from "@/components/ui";
import { infoIcon } from "@/constants";
import { useDayFreeHours } from "@/hooks/useDayFreeHours";
import { useAddAppointmentStore } from "@/stores";

type AppointmentDayFreeHoursInfoProps = {
  date: Date;
  startTime: Date;
  endTime: Date;
  /** After a failed submit, replace free-hours with the outside-hours error. */
  showOutsideHoursError?: boolean;
};

const OUTSIDE_HOURS_ERROR =
  "This time is outside your working hours for this day.";

function AppointmentDayFreeHoursInfoComponent({
  date,
  startTime,
  endTime,
  showOutsideHoursError = false,
}: AppointmentDayFreeHoursInfoProps) {
  const editingAppointmentId = useAddAppointmentStore(
    (state) => state.editingAppointmentId,
  );
  const { labels, overlapsSelection } = useDayFreeHours(
    date,
    {
      excludeAppointmentId: editingAppointmentId,
      selectionStart: startTime,
      selectionEnd: endTime,
    },
  );
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (showOutsideHoursError) {
      return;
    }

    if (overlapsSelection) {
      setMenuOpen(true);
    }
  }, [overlapsSelection, endTime, showOutsideHoursError, startTime]);

  const title = useMemo(() => {
    if (overlapsSelection) {
      return "Overlapping appointments";
    }

    return `Free hours · ${dayjs(date).format("D MMM, YYYY")}`;
  }, [date, overlapsSelection]);

  const items = useMemo(
    () =>
      labels.map((label, index) => ({
        key: String(index),
        label,
        tone: "default" as const,
        onPress: () => {},
      })),
    [labels],
  );

  if (showOutsideHoursError) {
    return (
      <FormSectionErrorTrigger
        accessibilityLabel="Show working hours error"
        errors={[OUTSIDE_HOURS_ERROR]}
        title="Working hours"
      />
    );
  }

  return (
    <ActionMenu
      accessibilityLabel="Show free hours for this day"
      align="left"
      itemVariant="message"
      items={items}
      onOpenChange={setMenuOpen}
      open={menuOpen}
      title={title}
      titleTone={overlapsSelection ? "warning" : "muted"}
      trigger={
        <View className="size-5 items-center justify-center">
          <ThemedIcon
            dimension={20}
            name={infoIcon}
            tone={overlapsSelection ? "warning" : "brand"}
          />
        </View>
      }
    />
  );
}

export const AppointmentDayFreeHoursInfo = memo(
  AppointmentDayFreeHoursInfoComponent,
);
