import { memo } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { KpiCard } from "@/components/ui";
import {
  accentBlue,
  accentOrange,
  accentRed,
  accentTeal,
  calendarIcon,
  clockIcon,
  warningIcon,
  weekStartIcon,
} from "@/constants";
import type { RecallListKpis } from "@/helpers/recalls/recallKpis";
import { useResolvedLocale } from "@/stores";

type RecallsListKpisProps = {
  kpis: RecallListKpis;
};

const KPI_THEMES = {
  overdue: { accent: accentRed, icon: warningIcon },
  dueToday: { accent: accentOrange, icon: clockIcon },
  dueThisWeek: { accent: accentBlue, icon: calendarIcon },
  overdueRatio: { accent: accentTeal, icon: weekStartIcon },
} as const;

function RecallsListKpisComponent({ kpis }: RecallsListKpisProps) {
  const { t } = useTranslation(["recalls", "common"]);
  const locale = useResolvedLocale();
  const ratioValue =
    kpis.overdueRatioPercent == null
      ? t("common:empty.emDash")
      : `${kpis.overdueRatioPercent}`;

  return (
    <View className="gap-stack">
      <View className="flex-row gap-stack">
        <KpiCard
          accent={KPI_THEMES.overdue.accent}
          icon={KPI_THEMES.overdue.icon}
          label={t("recalls:kpis.overdue")}
          value={kpis.overdue.toLocaleString(locale)}
        />
        <KpiCard
          accent={KPI_THEMES.dueToday.accent}
          icon={KPI_THEMES.dueToday.icon}
          label={t("recalls:kpis.dueToday")}
          value={kpis.dueToday.toLocaleString(locale)}
        />
      </View>

      <View className="flex-row gap-stack">
        <KpiCard
          accent={KPI_THEMES.dueThisWeek.accent}
          icon={KPI_THEMES.dueThisWeek.icon}
          label={t("recalls:kpis.dueThisWeek")}
          value={kpis.dueThisWeek.toLocaleString(locale)}
        />
        <KpiCard
          accent={KPI_THEMES.overdueRatio.accent}
          icon={KPI_THEMES.overdueRatio.icon}
          label={t("recalls:kpis.overdueRatio")}
          value={ratioValue}
          valueSuffix={kpis.overdueRatioPercent == null ? undefined : "%"}
        />
      </View>
    </View>
  );
}

export const RecallsListKpis = memo(RecallsListKpisComponent);
