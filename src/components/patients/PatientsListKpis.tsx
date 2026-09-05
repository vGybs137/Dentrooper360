import { memo } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { ThemedIcon, ThemedText, type ThemedIconProps } from "@/components/ui";
import {
  balanceIcon,
  calendarIcon,
  chevronDownIcon,
  chevronUpIcon,
  personAddIcon,
  personsIcon,
} from "@/constants";
import { withOpacity } from "@/helpers/color";
import {
  formatProviderCurrencyAmount,
  resolveProviderCurrencySymbol,
} from "@/helpers/currency";
import type { PatientListKpis } from "@/helpers/patientKpis";
import { semantic } from "@/tokens";

type PatientsListKpisProps = {
  kpis: PatientListKpis;
  currencySymbol: string | null;
};

type KpiTrend = {
  label: string;
  tone: "success" | "alert" | "muted";
  direction?: "up" | "down";
};

type KpiCardProps = {
  accent: string;
  icon: NonNullable<ThemedIconProps["name"]>;
  label: string;
  style?: StyleProp<ViewStyle>;
  trend?: KpiTrend | null;
  value: string;
  valueSuffix?: string;
};

const KPI_THEMES = {
  totalPatients: { accent: "#0A9E91", icon: personsIcon },
  newThisMonth: { accent: "#F97316", icon: personAddIcon },
  upcomingVisits: { accent: "#3B82F6", icon: calendarIcon },
  outstandingBalance: { accent: "#EAB308", icon: balanceIcon },
} as const;

const CARD_RADIUS = semantic.radius.card;

function KpiTrendBadge({ direction, label, tone }: KpiTrend) {
  const backgroundClass =
    tone === "success"
      ? "bg-success-subtle"
      : tone === "alert"
        ? "bg-alert-subtle"
        : "bg-surface-sunken";
  const textTone =
    tone === "success" ? "success" : tone === "alert" ? "alert" : "muted";

  return (
    <View
      className={`shrink-0 flex-row items-center gap-1 rounded-pill px-2 py-0.5 ${backgroundClass}`}
    >
      {direction ? (
        <ThemedIcon
          dimension={12}
          name={direction === "up" ? chevronUpIcon : chevronDownIcon}
          tone={textTone}
        />
      ) : null}
      <ThemedText
        className="text-[11px] font-semibold"
        tone={textTone}
        variant="label"
      >
        {label}
      </ThemedText>
    </View>
  );
}

function KpiCard({
  accent,
  icon,
  label,
  style,
  trend,
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

        <View className="flex-row items-baseline justify-between gap-2">
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
          {trend ? <KpiTrendBadge {...trend} /> : null}
        </View>
      </View>
    </View>
  );
}

function buildNewPatientsTrend(kpis: PatientListKpis): KpiTrend | null {
  const { newPatientsMoMGrowth, newThisMonth } = kpis;

  if (newPatientsMoMGrowth == null) {
    if (newThisMonth > 0) {
      return { label: "New", tone: "success" };
    }

    return null;
  }

  if (newPatientsMoMGrowth === 0) {
    return { label: "0%", tone: "muted", direction: "up" };
  }

  if (newPatientsMoMGrowth > 0) {
    return {
      label: `${newPatientsMoMGrowth}%`,
      tone: "success",
      direction: "up",
    };
  }

  return {
    label: `${Math.abs(newPatientsMoMGrowth)}%`,
    tone: "alert",
    direction: "down",
  };
}

function PatientsListKpisComponent({
  currencySymbol,
  kpis,
}: PatientsListKpisProps) {
  const newPatientsTrend = buildNewPatientsTrend(kpis);
  const resolvedCurrencySymbol = resolveProviderCurrencySymbol(currencySymbol);

  return (
    <View className="gap-stack">
      <View className="flex-row gap-stack">
        <KpiCard
          accent={KPI_THEMES.totalPatients.accent}
          icon={KPI_THEMES.totalPatients.icon}
          label="Total Patients"
          value={kpis.totalPatients.toLocaleString()}
        />
        <KpiCard
          accent={KPI_THEMES.newThisMonth.accent}
          icon={KPI_THEMES.newThisMonth.icon}
          label="New this month"
          trend={newPatientsTrend}
          value={kpis.newThisMonth.toLocaleString()}
        />
      </View>

      <View className="flex-row gap-stack">
        <KpiCard
          accent={KPI_THEMES.upcomingVisits.accent}
          icon={KPI_THEMES.upcomingVisits.icon}
          label="Upcoming visits"
          value={kpis.upcomingVisits.toLocaleString()}
        />
        <KpiCard
          accent={KPI_THEMES.outstandingBalance.accent}
          icon={KPI_THEMES.outstandingBalance.icon}
          label="Outstanding balance"
          value={formatProviderCurrencyAmount(kpis.totalOutstandingBalance)}
          valueSuffix={resolvedCurrencySymbol}
        />
      </View>
    </View>
  );
}

export const PatientsListKpis = memo(PatientsListKpisComponent);
