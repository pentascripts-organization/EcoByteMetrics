export function formatNumber(value: number | null) {
  return value === null ? '—' : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 }).format(value);
}
