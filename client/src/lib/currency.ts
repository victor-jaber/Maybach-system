export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "R$ 0,00";
  }
  
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    return "R$ 0,00";
  }
  
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue);
}

export function formatCurrencyInput(value: string): string {
  const numbers = value.replace(/\D/g, "");
  
  if (!numbers) {
    return "";
  }
  
  const numericValue = parseInt(numbers, 10) / 100;
  
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue);
}

export function parseCurrencyToNumber(value: string): number {
  if (!value) return 0;
  
  const cleaned = value
    .replace(/[R$\s.]/g, "")
    .replace(",", ".");
  
  const numericValue = parseFloat(cleaned);
  
  return isNaN(numericValue) ? 0 : numericValue;
}

export function formatCurrencyCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "R$ 0";
  }
  
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1).replace(".", ",")}M`;
  }
  
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}mil`;
  }
  
  return formatCurrency(value);
}
