import { memo } from "react";
import { View } from "react-native";

import { KpiCard, type KpiTrend } from "@/components/ui";
import {
  accentBlue,
  accentOrange,
  accentTeal,
  accentYellow,
  balanceIcon,
  calendarIcon,
  personAddIcon,
  personsIcon,
} from "@/constants";
import {
  formatProviderCurrencyAmount,
  resolveProviderCurrencySymbol,
} from "@/helpers/payments/currency";
import type { PatientListKpis } from "@/helpers/patients/patientKpis";

type PatientsListKpisProps = {
  kpis: PatientListKpis;
  currencySymbol: string | null;
};

const KPI_THEMES = {
  totalPatients: { accent: accentTeal, icon: personsIcon },
  newThisMonth: { accent: accentOrange, icon: personAddIcon },
  upcomingVisits: { accent: accentBlue, icon: calendarIcon },
  outstandingBalance: { accent: accentYellow, icon: balanceIcon },
} as const;

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
