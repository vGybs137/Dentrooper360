import { View, type StyleProp, type ViewStyle } from "react-native";

import {
  ThemedIcon,
  type ThemedIconProps,
} from "@/components/ui/ThemedIcon";
import { ThemedText } from "@/components/ui/ThemedText";
import { chevronDownIcon, chevronUpIcon } from "@/constants/icons";
import { withOpacity } from "@/helpers/ui/color";
import { semantic } from "@/tokens";

export type KpiTrend = {
  label: string;
  tone: "success" | "alert" | "muted";
  direction?: "up" | "down";
};

export type KpiCardProps = {
  accent: string;
  icon: NonNullable<ThemedIconProps["name"]>;
  label: string;
  style?: StyleProp<ViewStyle>;
  trend?: KpiTrend | null;
  value: string;
  valueSuffix?: string;
};

function KpiTrendBadge({ direction, label, tone }: KpiTrend) {
  const backgroundClass =
    tone === "success"
      ? "bg-success-subtle"
      : tone === "alert"
        ? "bg-alert-subtle"
        : "bg-surface-sunken";
  const textTone =
    tone === "success" ? "success" : tone === "alert" ? "alert" : "muted";

  return (
    <View
      className={`shrink-0 flex-row items-center gap-1 rounded-pill px-2 py-0.5 ${backgroundClass}`}
    >
      {direction ? (
        <ThemedIcon
          dimension={12}
          name={direction === "up" ? chevronUpIcon : chevronDownIcon}
          tone={textTone}
        />
      ) : null}
      <ThemedText
        className="text-[11px] font-semibold"
        tone={textTone}
        variant="label"
      >
        {label}
      </ThemedText>
    </View>
  );
}

/** Accent wash KPI tile used on patients / recalls list headers. */
export function KpiCard({
  accent,
  icon,
  label,
  style,
  trend,
  value,
  valueSuffix,
}: KpiCardProps) {
  return (
    <View
      className="min-w-0 flex-1 overflow-hidden"
      style={[
        {
          borderRadius: semantic.radius.card,
          backgroundColor: withOpacity(accent, 0.3),
        },
        style,
      ]}
    >
      <View className="gap-3" style={{ padding: semantic.space.inset.default }}>
        <View
          className="items-center justify-center rounded-control"
          style={{
            width: semantic.size["control-sm"],
            height: semantic.size["control-sm"],
            backgroundColor: accent,
          }}
        >
          <ThemedIcon dimension={18} name={icon} tintColor="#FFFFFF" />
        </View>

        <ThemedText tone="muted" variant="label">
          {label}
        </ThemedText>

        <View className="flex-row items-baseline justify-between gap-2">
          <View className="min-w-0 flex-1 flex-row flex-wrap items-baseline gap-1.5">
            <ThemedText
              className="text-[28px] font-bold leading-8"
              variant="title"
            >
              {value}
            </ThemedText>
            {valueSuffix ? (
              <ThemedText className="text-body" tone="muted" variant="label">
                {valueSuffix}
              </ThemedText>
            ) : null}
          </View>
          {trend ? <KpiTrendBadge {...trend} /> : null}
        </View>
      </View>
    </View>
  );
}
