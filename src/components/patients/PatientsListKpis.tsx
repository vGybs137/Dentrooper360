import { memo } from "react";
import { View } from "react-native";

import { ThemedIcon, ThemedText, ThemedView } from "@/components/ui";
import { chevronDownIcon, chevronUpIcon } from "@/constants";
import {
  formatProviderCurrencyAmount,
  resolveProviderCurrencySymbol,
} from "@/helpers/currency";
import type { PatientListKpis } from "@/helpers/patientKpis";

type PatientsListKpisProps = {
  kpis: PatientListKpis;
  currencySymbol: string | null;
};

type KpiTileProps = {
  label: string;
  value: string;
  valueSuffix?: string;
  trend?: {
    label: string;
    tone: "success" | "alert" | "muted";
    direction?: "up" | "down";
  } | null;
};

function KpiTrend({
  direction,
  label,
  tone,
}: NonNullable<KpiTileProps["trend"]>) {
  const backgroundClass =
    tone === "success"
      ? "bg-success-subtle"
      : tone === "alert"
        ? "bg-alert-subtle"
        : "bg-surface-sunken";
  const textTone =
    tone === "success" ? "success" : tone === "alert" ? "alert" : "muted";

  return (
    <View className="flex-row items-center gap-2">
      <View
        className={`shrink flex-row items-center gap-1 rounded-pill px-2 py-0.5 ${backgroundClass}`}
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
      {direction ? (
        <ThemedText
          className="shrink text-[11px]"
          numberOfLines={1}
          tone="muted"
          variant="label"
        >
          vs. prev. month
        </ThemedText>
      ) : null}
    </View>
  );
}

function KpiTile({ label, trend, value, valueSuffix }: KpiTileProps) {
  return (
    <View className="min-w-0 flex-1 gap-0.5">
      <ThemedText tone="muted" variant="label">
        {label}
      </ThemedText>
      <View className="flex-row items-baseline gap-1.5">
        <ThemedText className="text-[28px] font-bold leading-8" variant="title">
          {value}
        </ThemedText>
        {valueSuffix ? (
          <ThemedText className="text-body" tone="muted" variant="label">
            {valueSuffix}
          </ThemedText>
        ) : null}
      </View>
      {trend ? (
        <View className="mt-1">
          <KpiTrend {...trend} />
        </View>
      ) : null}
    </View>
  );
}

function buildNewPatientsTrend(kpis: PatientListKpis): KpiTileProps["trend"] {
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
    <ThemedView
      className="gap-stack-comfortable"
      inset="default"
      surface="default"
    >
      <View className="flex-row items-stretch gap-stack">
        <KpiTile
          label="Total Patients"
          value={kpis.totalPatients.toLocaleString()}
        />
        <KpiTile
          label="New this month"
          trend={newPatientsTrend}
          value={kpis.newThisMonth.toLocaleString()}
        />
      </View>

      <View className="flex-row items-stretch gap-stack">
        <KpiTile
          label="Upcoming visits"
          value={kpis.upcomingVisits.toLocaleString()}
        />
        <KpiTile
          label="Outstanding balance"
          value={formatProviderCurrencyAmount(kpis.totalOutstandingBalance)}
          valueSuffix={resolvedCurrencySymbol}
        />
      </View>
    </ThemedView>
  );
}

export const PatientsListKpis = memo(PatientsListKpisComponent);
