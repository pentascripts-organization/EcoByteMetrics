export function formatNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('pt-BR', Math.abs(value) > 0 && Math.abs(value) < 0.01
    ? { maximumSignificantDigits: 4 }
    : { maximumFractionDigits: 4 }).format(value);
}
