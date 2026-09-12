import { useTranslation } from "react-i18next";

import { DetailsActionBar } from "@/components/ui";
import { navBackChevronIcon } from "@/helpers/i18n/navBackChevron";

type RecallDetailsActionBarProps = {
  onBack: () => void;
};

export function RecallDetailsActionBar({ onBack }: RecallDetailsActionBarProps) {
  const { t } = useTranslation("common");

  return (
    <DetailsActionBar
      items={[
        {
          icon: navBackChevronIcon(),
          label: t("actions.back"),
          onPress: onBack,
        },
      ]}
    />
  );
}
