import dayjs from "dayjs";
import { memo, useCallback, useMemo, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { BarChart } from "react-native-gifted-charts";

import { ThemedText } from "@/components/ui";
import {
  formatProviderCurrencyAmount,
  resolveProviderCurrencySymbol,
} from "@/helpers/payments/currency";
import { buildPaymentMonthDailyTotals } from "@/helpers/payments/paymentDailyTotals";
import type { ProviderPaymentItem } from "@/hooks/payments/useProviderPayments";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

const CHART_HEIGHT = 140;
const Y_AXIS_LABEL_WIDTH = 48;
const Y_AXIS_STEP = 100;
const INITIAL_SPACING = 4;
const END_SPACING = 4;
const SPACING = 2;

export type PaymentsTrendChartProps = {
  payments: readonly ProviderPaymentItem[];
  currencySymbol: string | null;
};

function PaymentsTrendChartComponent({
  payments,
  currencySymbol,
}: PaymentsTrendChartProps) {
  const native = useNativeColors();
  const [chartWidth, setChartWidth] = useState(0);
  const symbol = resolveProviderCurrencySymbol(currencySymbol);

  const dailyTotals = useMemo(
    () => buildPaymentMonthDailyTotals(payments),
    [payments],
  );

  const dayCount = dailyTotals.length;

  const maxTotal = useMemo(
    () => Math.max(0, ...dailyTotals.map((day) => day.total)),
    [dailyTotals],
  );

  const yAxisMax = useMemo(() => {
    if (maxTotal <= 0) {
      return Y_AXIS_STEP;
    }

    return Math.ceil(maxTotal / Y_AXIS_STEP) * Y_AXIS_STEP;
  }, [maxTotal]);

  const noOfSections = useMemo(
    () => Math.max(1, Math.round(yAxisMax / Y_AXIS_STEP)),
    [yAxisMax],
  );

  const rangeTotal = useMemo(
    () => dailyTotals.reduce((sum, day) => sum + day.total, 0),
    [dailyTotals],
  );

  const barWidth = useMemo(() => {
    if (chartWidth <= 0 || dayCount === 0) {
      return 6;
    }

    const available =
      chartWidth -
      Y_AXIS_LABEL_WIDTH -
      INITIAL_SPACING -
      END_SPACING -
      SPACING * Math.max(0, dayCount - 1);
    return Math.max(3, available / dayCount);
  }, [chartWidth, dayCount]);

  const chartData = useMemo(
    () =>
      dailyTotals.map((day, index) => {
        const dayOfMonth = dayjs(day.date).date();
        const showLabel =
          dayOfMonth === 1 ||
          dayOfMonth % 5 === 0 ||
          index === dailyTotals.length - 1;

        return {
          value: day.total,
          label: showLabel ? String(dayOfMonth) : "",
          frontColor:
            day.total > 0 ? native.brand.default : native.border.subtle,
        };
      }),
    [dailyTotals, native.border.subtle, native.brand.default],
  );

  const formatYLabel = useCallback(
    (value: string) => {
      const amount = Number(value);
      if (!Number.isFinite(amount)) {
        return `${symbol}0`;
      }

      if (Math.abs(amount) >= 1000) {
        return `${symbol}${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
      }

      return `${symbol}${Math.round(amount)}`;
    },
    [symbol],
  );

  const handleChartLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.floor(event.nativeEvent.layout.width);
    if (nextWidth > 0 && nextWidth !== chartWidth) {
      setChartWidth(nextWidth);
    }
  };

  return (
    <View style={{ marginBottom: semantic.space.gap.default }}>
      <View className="flex-row flex-wrap items-baseline gap-1.5">
        <ThemedText
          className="text-[28px] font-bold leading-8"
          variant="display"
        >
          {formatProviderCurrencyAmount(rangeTotal, { decimals: 2 })}
        </ThemedText>

        <ThemedText className="text-body" tone="muted" variant="label">
          {symbol}
        </ThemedText>
      </View>

      <View className="mt-stack w-full" onLayout={handleChartLayout}>
        {chartWidth > 0 ? (
          <BarChart
            key={`${chartWidth}-${dayCount}`}
            barBorderRadius={3}
            barWidth={barWidth}
            data={chartData}
            disableScroll
            endSpacing={END_SPACING}
            formatYLabel={formatYLabel}
            height={CHART_HEIGHT}
            initialSpacing={INITIAL_SPACING}
            maxValue={yAxisMax}
            noOfSections={noOfSections}
            rulesColor={native.border.subtle}
            rulesThickness={1}
            spacing={SPACING}
            stepValue={Y_AXIS_STEP}
            width={chartWidth}
            xAxisColor={native.border.subtle}
            xAxisLabelTextStyle={{
              color: native.foreground.muted,
              fontSize: 9,
            }}
            yAxisColor={native.border.subtle}
            yAxisLabelWidth={Y_AXIS_LABEL_WIDTH}
            yAxisTextStyle={{
              color: native.foreground.muted,
              fontSize: 10,
            }}
            yAxisThickness={1}
          />
        ) : null}
      </View>

      {maxTotal <= 0 ? (
        <ThemedText
          align="center"
          className="mt-stack"
          tone="muted"
          variant="label"
        >
          No payments this month.
        </ThemedText>
      ) : null}
    </View>
  );
}

export const PaymentsTrendChart = memo(PaymentsTrendChartComponent);
