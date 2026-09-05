import dayjs from "dayjs";
import { memo, useEffect, useMemo, useState } from "react";
import { View } from "react-native";

import { ActionMenu, ThemedIcon } from "@/components/ui";
import { infoIcon } from "@/constants";
import { useDayFreeHours } from "@/hooks/useDayFreeHours";
import { useAddAppointmentStore } from "@/stores";

type AppointmentDayFreeHoursInfoProps = {
  date: Date;
  startTime: Date;
  endTime: Date;
};

function AppointmentDayFreeHoursInfoComponent({
  date,
  startTime,
  endTime,
}: AppointmentDayFreeHoursInfoProps) {
  const editingAppointmentId = useAddAppointmentStore(
    (state) => state.editingAppointmentId,
  );
  const { labels, overlapsSelection } = useDayFreeHours(date, {
    excludeAppointmentId: editingAppointmentId,
    selectionStart: startTime,
    selectionEnd: endTime,
  });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (overlapsSelection) {
      setMenuOpen(true);
    }
  }, [overlapsSelection, endTime, startTime]);

  const title = useMemo(
    () =>
      overlapsSelection
        ? "Overlapping appointments"
        : `Free hours · ${dayjs(date).format("D MMM, YYYY")}`,
    [date, overlapsSelection],
  );

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
