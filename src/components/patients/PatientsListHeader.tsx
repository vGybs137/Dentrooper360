import { memo } from "react";
import { useTranslation } from "react-i18next";

import { EntityListHeader } from "@/components/list";
import { personAddIcon } from "@/constants";

export type PatientsListHeaderProps = {
  openSearch: () => void;
  openAddPatient: () => void;
  title?: string;
};

function PatientsListHeaderComponent({
  openSearch,
  openAddPatient,
  title,
}: PatientsListHeaderProps) {
  const { t } = useTranslation(["patients", "a11y"]);
  return (
    <EntityListHeader
      addAccessibilityLabel={t("a11y:addPatient")}
      addIcon={personAddIcon}
      onAdd={openAddPatient}
      openSearch={openSearch}
      searchAccessibilityLabel={t("a11y:searchPatients")}
      title={title ?? t("patients:list.title")}
    />
  );
}

export const PatientsListHeader = memo(PatientsListHeaderComponent);
