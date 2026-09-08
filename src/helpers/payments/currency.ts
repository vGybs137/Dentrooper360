/** Format amounts with the provider's currency symbol. */
export function formatProviderCurrencyAmount(
  amount: number,
  options?: { decimals?: number },
): string {
  const decimals = options?.decimals ?? 0;
  return Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatProviderCurrency(
  amount: number,
  currencySymbol: string | null | undefined,
  options?: { decimals?: number },
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
  options?: { decimals?: number },
): string {
  const decimals = options?.decimals ?? 2;
  const symbol = resolveProviderCurrencySymbol(currencySymbol);
  return `${symbol} ${Math.abs(amount).toFixed(decimals)}`;
}
