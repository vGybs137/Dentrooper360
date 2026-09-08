import { memo } from "react";

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
  title = "Patients",
}: PatientsListHeaderProps) {
  return (
    <EntityListHeader
      addAccessibilityLabel="Add patient"
      addIcon={personAddIcon}
      onAdd={openAddPatient}
      openSearch={openSearch}
      searchAccessibilityLabel="Search patients"
      title={title}
    />
  );
}

export const PatientsListHeader = memo(PatientsListHeaderComponent);
