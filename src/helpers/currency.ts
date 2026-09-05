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
