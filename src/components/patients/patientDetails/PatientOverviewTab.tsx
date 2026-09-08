import { View } from "react-native";

import {
  DetailsSection,
  type DetailsField,
  type DetailsNote,
} from "@/components/ui";

export type PatientOverviewField = DetailsField;

type PatientOverviewTabProps = {
  information: readonly PatientOverviewField[];
  timeline: readonly PatientOverviewField[];
  informationTitle?: string;
  timelineTitle?: string;
  note?: DetailsNote | null;
};

export function PatientOverviewTab({
  information,
  timeline,
  informationTitle = "Patient Information",
  timelineTitle = "Patient Timeline",
  note,
}: PatientOverviewTabProps) {
  return (
    <View className="gap-section px-page">
      {information.length > 0 || note ? (
        <DetailsSection
          fields={information}
          note={note}
          title={informationTitle}
        />
      ) : null}
      {timeline.length > 0 ? (
        <DetailsSection fields={timeline} title={timelineTitle} />
      ) : null}
    </View>
  );
}
