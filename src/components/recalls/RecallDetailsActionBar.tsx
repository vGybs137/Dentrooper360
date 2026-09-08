import { DetailsActionBar } from "@/components/ui";
import { chevronLeftIcon } from "@/constants";

type RecallDetailsActionBarProps = {
  onBack: () => void;
};

export function RecallDetailsActionBar({ onBack }: RecallDetailsActionBarProps) {
  return (
    <DetailsActionBar
      items={[{ icon: chevronLeftIcon, label: "Back", onPress: onBack }]}
    />
  );
}
