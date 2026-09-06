import { View } from "react-native";

import { ThemedText } from "@/components/ui";

export type PatientOverviewField = {
  label: string;
  value: string;
  empty?: boolean;
};

type OverviewSectionCardProps = {
  title: string;
  fields: readonly PatientOverviewField[];
};

function OverviewField({ label, value, empty }: PatientOverviewField) {
  return (
    <View className="gap-0.5">
      <ThemedText tone="muted" variant="label">
        {label}
      </ThemedText>
      <ThemedText
        className={empty ? "opacity-30" : "font-semibold"}
        numberOfLines={2}
        tone="default"
        variant="body"
      >
        {value}
      </ThemedText>
    </View>
  );
}

function OverviewSectionCard({ title, fields }: OverviewSectionCardProps) {
  const leftFields = fields.filter((_, index) => index % 2 === 0);
  const rightFields = fields.filter((_, index) => index % 2 === 1);

  return (
    <View className="overflow-hidden rounded-card border border-border-subtle bg-surface-default px-inline py-stack">
      <ThemedText className="font-semibold" variant="body">
        {title}
      </ThemedText>

      <View className="mt-stack flex-row items-stretch">
        <View className="min-w-0 flex-1 gap-stack">
          {leftFields.map((field) => (
            <OverviewField
              key={field.label}
              empty={field.empty}
              label={field.label}
              value={field.value}
            />
          ))}
        </View>

        <View className="mx-inline w-px self-stretch bg-border-subtle" />

        <View className="min-w-0 flex-1 gap-stack">
          {rightFields.map((field) => (
            <OverviewField
              key={field.label}
              empty={field.empty}
              label={field.label}
              value={field.value}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

type PatientOverviewTabProps = {
  information: readonly PatientOverviewField[];
  timeline: readonly PatientOverviewField[];
  informationTitle?: string;
  timelineTitle?: string;
};

export function PatientOverviewTab({
  information,
  timeline,
  informationTitle = "Patient Information",
  timelineTitle = "Patient Timeline",
}: PatientOverviewTabProps) {
  return (
    <View className="gap-stack px-page">
      {information.length > 0 ? (
        <OverviewSectionCard fields={information} title={informationTitle} />
      ) : null}
      {timeline.length > 0 ? (
        <OverviewSectionCard fields={timeline} title={timelineTitle} />
      ) : null}
    </View>
  );
}
