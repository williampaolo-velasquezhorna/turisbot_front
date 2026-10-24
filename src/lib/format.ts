export function formatMoney(currency: string, amount: number): string {
  const symbol = currency === "USD" ? "USD" : "S/";
  return `${symbol} ${(Number(amount) || 0).toFixed(2)}`;
}
