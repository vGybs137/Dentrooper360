import { useTranslation } from "react-i18next";
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
  informationTitle,
  timelineTitle,
  note,
}: PatientOverviewTabProps) {
  const { t } = useTranslation("patients");
  return (
    <View className="gap-section px-page">
      {information.length > 0 || note ? (
        <DetailsSection
          fields={information}
          note={note}
          title={informationTitle ?? t("patients:details.information")}
        />
      ) : null}
      {timeline.length > 0 ? (
        <DetailsSection fields={timeline} title={timelineTitle ?? t("patients:details.timeline")} />
      ) : null}
    </View>
  );
}
