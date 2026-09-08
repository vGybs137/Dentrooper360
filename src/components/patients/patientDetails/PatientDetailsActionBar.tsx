import { DetailsActionBar } from "@/components/ui";
import { chevronLeftIcon, deleteIcon, editIcon } from "@/constants";

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
  return (
    <DetailsActionBar
      items={[
        { icon: chevronLeftIcon, label: "Back", onPress: onBack },
        { icon: editIcon, label: "Edit", onPress: onEdit },
        {
          icon: deleteIcon,
          label: "Delete",
          onPress: onDelete,
          tone: "alert",
        },
      ]}
    />
  );
}

export { DETAILS_ACTION_BAR_HEIGHT as PATIENT_DETAILS_ACTION_BAR_HEIGHT } from "@/constants/accents";
