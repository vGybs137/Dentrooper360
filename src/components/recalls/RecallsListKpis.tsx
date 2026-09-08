import { memo } from "react";
import { View } from "react-native";

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
  const ratioValue =
    kpis.overdueRatioPercent == null
      ? "—"
      : `${kpis.overdueRatioPercent}`;

  return (
    <View className="gap-stack">
      <View className="flex-row gap-stack">
        <KpiCard
          accent={KPI_THEMES.overdue.accent}
          icon={KPI_THEMES.overdue.icon}
          label="Overdue"
          value={kpis.overdue.toLocaleString()}
        />
        <KpiCard
          accent={KPI_THEMES.dueToday.accent}
          icon={KPI_THEMES.dueToday.icon}
          label="Due today"
          value={kpis.dueToday.toLocaleString()}
        />
      </View>

      <View className="flex-row gap-stack">
        <KpiCard
          accent={KPI_THEMES.dueThisWeek.accent}
          icon={KPI_THEMES.dueThisWeek.icon}
          label="Due this week"
          value={kpis.dueThisWeek.toLocaleString()}
        />
        <KpiCard
          accent={KPI_THEMES.overdueRatio.accent}
          icon={KPI_THEMES.overdueRatio.icon}
          label="Overdue ratio"
          value={ratioValue}
          valueSuffix={kpis.overdueRatioPercent == null ? undefined : "%"}
        />
      </View>
    </View>
  );
}

export const RecallsListKpis = memo(RecallsListKpisComponent);
