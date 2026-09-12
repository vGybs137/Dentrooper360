/** Format amounts with the provider's currency symbol. */
export function formatProviderCurrencyAmount(
  amount: number,
  options?: { decimals?: number; locale?: string },
): string {
  const decimals = options?.decimals ?? 0;
  return Math.abs(amount).toLocaleString(options?.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatProviderCurrency(
  amount: number,
  currencySymbol: string | null | undefined,
  options?: { decimals?: number; locale?: string },
): string {
  const symbol = currencySymbol?.trim() || "$";
  return `${symbol}${formatProviderCurrencyAmount(amount, options)}`;
}

export function resolveProviderCurrencySymbol(
  currencySymbol: string | null | undefined,
): string {
  return currencySymbol?.trim() || "$";
}

/**
 * Format an amount with an explicit currency code/symbol (e.g. payment rows).
 * Defaults to 2 decimal places — use {@link formatProviderCurrency} for KPI-style 0 decimals.
 */
export function formatMoneyAmount(
  amount: number,
  currencySymbol: string | null | undefined,
  options?: { decimals?: number; locale?: string },
): string {
  const decimals = options?.decimals ?? 2;
  const symbol = resolveProviderCurrencySymbol(currencySymbol);
  const absolute = Math.abs(amount);
  if (options?.locale) {
    return `${symbol} ${absolute.toLocaleString(options.locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  }
  return `${symbol} ${absolute.toFixed(decimals)}`;
}
