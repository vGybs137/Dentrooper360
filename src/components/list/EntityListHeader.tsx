import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  Button,
  SearchToggle,
  ThemedIcon,
  ThemedText,
  type ThemedIconProps,
} from "@/components/ui";
import { semantic } from "@/tokens";

export type EntityListHeaderProps = {
  title: string;
  openSearch: () => void;
  searchAccessibilityLabel?: string;
  /** Optional leading action (e.g. add patient). */
  onAdd?: () => void;
  addAccessibilityLabel?: string;
  addIcon?: NonNullable<ThemedIconProps["name"]>;
};

function EntityListHeaderComponent({
  addAccessibilityLabel,
  addIcon,
  onAdd,
  openSearch,
  searchAccessibilityLabel,
  title,
}: EntityListHeaderProps) {
  const { t } = useTranslation(["common", "a11y"]);
  const rootStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "center" as const,
      width: "100%" as const,
      paddingBottom: semantic.space.stack.compact,
    }),
    [],
  );

  return (
    <View style={rootStyle}>
      <ThemedText numberOfLines={1} variant="title">
        {title}
      </ThemedText>
      <View style={{ flex: 1, minWidth: 0 }} />
      <View className="flex-row items-center gap-1">
        {onAdd && addIcon ? (
          <Button
            accessibilityLabel={
              addAccessibilityLabel ?? t("common:actions.add")
            }
            hitSlop={8}
            onPress={onAdd}
            size="sm"
            style={{
              width: semantic.size.touch,
              height: semantic.size.touch,
              alignItems: "center",
              justifyContent: "center",
            }}
            tone="neutral"
            variant="ghost"
          >
            <ThemedIcon dimension={22} name={addIcon} />
          </Button>
        ) : null}
        <SearchToggle
          accessibilityLabel={
            searchAccessibilityLabel ??
            t("a11y:searchEntity", { title })
          }
          openSearch={openSearch}
        />
      </View>
    </View>
  );
}

export const EntityListHeader = memo(EntityListHeaderComponent);
