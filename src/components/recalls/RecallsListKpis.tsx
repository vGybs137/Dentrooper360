import { memo } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { ThemedIcon, ThemedText, type ThemedIconProps } from "@/components/ui";
import {
  calendarIcon,
  clockIcon,
  warningIcon,
  weekStartIcon,
} from "@/constants";
import { withOpacity } from "@/helpers/color";
import type { RecallListKpis } from "@/helpers/recallKpis";
import { semantic } from "@/tokens";

type RecallsListKpisProps = {
  kpis: RecallListKpis;
};

type KpiCardProps = {
  accent: string;
  icon: NonNullable<ThemedIconProps["name"]>;
  label: string;
  style?: StyleProp<ViewStyle>;
  value: string;
  valueSuffix?: string;
};

const KPI_THEMES = {
  overdue: { accent: "#EF4444", icon: warningIcon },
  dueToday: { accent: "#F97316", icon: clockIcon },
  dueThisWeek: { accent: "#3B82F6", icon: calendarIcon },
  overdueRatio: { accent: "#0A9E91", icon: weekStartIcon },
} as const;

const CARD_RADIUS = semantic.radius.card;

function KpiCard({
  accent,
  icon,
  label,
  style,
  value,
  valueSuffix,
}: KpiCardProps) {
  return (
    <View
      className="min-w-0 flex-1 overflow-hidden"
      style={[
        {
          borderRadius: CARD_RADIUS,
          backgroundColor: withOpacity(accent, 0.3),
        },
        style,
      ]}
    >
      <View className="gap-3" style={{ padding: semantic.space.inset.default }}>
        <View
          className="items-center justify-center rounded-control"
          style={{
            width: semantic.size["control-sm"],
            height: semantic.size["control-sm"],
            backgroundColor: accent,
          }}
        >
          <ThemedIcon dimension={18} name={icon} tintColor="#FFFFFF" />
        </View>

        <ThemedText tone="muted" variant="label">
          {label}
        </ThemedText>

        <View className="min-w-0 flex-1 flex-row flex-wrap items-baseline gap-1.5">
          <ThemedText
            className="text-[28px] font-bold leading-8"
            variant="title"
          >
            {value}
          </ThemedText>
          {valueSuffix ? (
            <ThemedText className="text-body" tone="muted" variant="label">
              {valueSuffix}
            </ThemedText>
          ) : null}
        </View>
      </View>
    </View>
  );
}

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
