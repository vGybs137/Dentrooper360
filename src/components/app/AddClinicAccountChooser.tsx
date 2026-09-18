import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { ComponentProps } from "react";
import Animated from "react-native-reanimated";

import { Button, ThemedText, ThemedView } from "@/components/ui";
import { semantic } from "@/tokens";

export type AddClinicAccountOption = {
  customerId: string;
  label: string;
  isCurrent?: boolean;
  isNew?: boolean;
};

type AddClinicAccountChooserProps = {
  options: AddClinicAccountOption[];
  onSelect: (customerId: string) => void;
  onCancel?: () => void;
  contentStyle?: ComponentProps<typeof Animated.View>["style"];
};

export function AddClinicAccountChooser({
  options,
  onSelect,
  onCancel,
  contentStyle,
}: AddClinicAccountChooserProps) {
  const { t } = useTranslation(["auth", "common"]);

  return (
    <View className="flex-1 justify-center px-inline-comfortable">
      <Animated.View style={contentStyle}>
        <ThemedView space="comfortable" variant="stack">
          <ThemedView space="compact" variant="stack">
            <ThemedText align="center" variant="display">
              {t("auth:qr.chooseAccountTitle")}
            </ThemedText>
            <ThemedText align="center" tone="muted">
              {t("auth:qr.chooseAccountMessage")}
            </ThemedText>
          </ThemedView>

          <ThemedView space="compact" variant="stack">
            {options.map((option) => (
              <Button
                key={option.customerId}
                className="w-full"
                label={option.label}
                onPress={() => onSelect(option.customerId)}
                size="md"
                style={{
                  minHeight: semantic.size.touch,
                }}
                tone="brand"
                variant={option.isNew ? "solid" : "outline"}
              />
            ))}
          </ThemedView>

          {onCancel ? (
            <Button
              label={t("common:actions.cancel")}
              onPress={onCancel}
              size="md"
              tone="neutral"
              variant="ghost"
            />
          ) : null}
        </ThemedView>
      </Animated.View>
    </View>
  );
}
