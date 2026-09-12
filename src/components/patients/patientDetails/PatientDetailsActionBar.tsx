import { useTranslation } from "react-i18next";

import { DetailsActionBar } from "@/components/ui";
import { deleteIcon, editIcon } from "@/constants";
import { navBackChevronIcon } from "@/helpers/i18n/navBackChevron";

type PatientDetailsActionBarProps = {
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function PatientDetailsActionBar({
  onBack,
  onEdit,
  onDelete,
}: PatientDetailsActionBarProps) {
  const { t } = useTranslation("common");

  return (
    <DetailsActionBar
      items={[
        {
          icon: navBackChevronIcon(),
          label: t("actions.back"),
          onPress: onBack,
        },
        { icon: editIcon, label: t("actions.edit"), onPress: onEdit },
        {
          icon: deleteIcon,
          label: t("actions.delete"),
          onPress: onDelete,
          tone: "alert",
        },
      ]}
    />
  );
}

export { DETAILS_ACTION_BAR_HEIGHT as PATIENT_DETAILS_ACTION_BAR_HEIGHT } from "@/constants/accents";
