const readable = new Intl.NumberFormat("pt-BR", { maximumSignificantDigits: 4 });

export function detailReading(value: number | null | undefined, kind: "energy" | "carbon") {
  const valid = value != null && Number.isFinite(value);
  const small = valid && value !== 0 && Math.abs(value) < 1;
  const unit = kind === "energy" ? (small ? "Wh" : "kWh") : (small ? "mg CO₂e" : "g CO₂e");
  return { value: valid ? readable.format(value * (small ? 1000 : 1)) : "—", unit,
    exact: valid ? `${value.toLocaleString("pt-BR", { maximumSignificantDigits: 15 })} ${kind === "energy" ? "kWh" : "g CO₂e"}` : "Dado não disponível" };
}
