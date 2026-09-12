import dayjs from "dayjs";
import { memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ActionMenu, ThemedIcon } from "@/components/ui";
import { infoIcon } from "@/constants";
import { useDayFreeHours } from "@/hooks/schedule/useDayFreeHours";
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
  const { t } = useTranslation(["schedule", "a11y"]);
  const editingAppointmentId = useAddAppointmentStore(
    (state) => state.editingAppointmentId,
  );
  const { labels, overlapsSelection, outsideWorkingHours } = useDayFreeHours(
    date,
    {
      excludeAppointmentId: editingAppointmentId,
      selectionStart: startTime,
      selectionEnd: endTime,
    },
  );
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (outsideWorkingHours || overlapsSelection) {
      setMenuOpen(true);
    }
  }, [outsideWorkingHours, overlapsSelection, endTime, startTime]);

  const title = useMemo(() => {
    if (outsideWorkingHours) {
      return t("schedule:freeHours.outsideTitle");
    }

    if (overlapsSelection) {
      return t("schedule:freeHours.overlapTitle");
    }

    return t("schedule:freeHours.title", {
      date: dayjs(date).format("D MMM, YYYY"),
    });
  }, [date, overlapsSelection, outsideWorkingHours, t]);

  const titleTone = outsideWorkingHours
    ? "alert"
    : overlapsSelection
      ? "warning"
      : "muted";

  const iconTone = outsideWorkingHours
    ? "alert"
    : overlapsSelection
      ? "warning"
      : "brand";

  const items = useMemo(
    () =>
      labels.map((label, index) => ({
        key: String(index),
        label,
        tone: (outsideWorkingHours ? "alert" : "default") as
          | "alert"
          | "default",
        onPress: () => {},
      })),
    [labels, outsideWorkingHours],
  );

  return (
    <ActionMenu
      accessibilityLabel={
        outsideWorkingHours
          ? t("a11y:freeHours.outsideWarning")
          : overlapsSelection
            ? t("a11y:freeHours.overlapWarning")
            : t("a11y:freeHours.info")
      }
      align="left"
      itemVariant="message"
      items={items}
      onOpenChange={setMenuOpen}
      open={menuOpen}
      title={title}
      titleTone={titleTone}
      trigger={
        <View className="size-5 items-center justify-center">
          <ThemedIcon dimension={20} name={infoIcon} tone={iconTone} />
        </View>
      }
    />
  );
}

export const AppointmentDayFreeHoursInfo = memo(
  AppointmentDayFreeHoursInfoComponent,
);
