export function formatCompactNumber(value: number | null): string {
  if (value == null) return "N/D";
  return new Intl.NumberFormat("pt-BR", {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 10_000 ? 1 : 0,
  }).format(value);
}

export function formatLongNumber(value: number | null): string {
  if (value == null) return "N/D";
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatPercent(value: number | null): string {
  if (value == null) return "N/D";

  const fractionDigits = value < 10 ? 2 : 1;
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)}%`;
}

export function formatDateTime(value: string | null): string {
  if (!value) return "Ainda não atualizado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatPostDate(value: string | null): string {
  if (!value) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(new Date(value));
}
