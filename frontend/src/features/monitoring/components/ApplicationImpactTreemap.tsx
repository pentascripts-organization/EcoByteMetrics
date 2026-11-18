import { ChartCard, Treemap } from "ztd-charts";
import type { applicationImpactTreemap } from "../domain/applicationImpact";
import { formatNumber } from "@/shared/lib/format";

const theme = {
  bg: "#f7faf8", panel: "#ffffff", ink: "#123c40", muted: "#60766a", dim: "#c5d8cf",
  accent: "#00c77a", accentText: "#087e59", onAccent: "#073d31", line: "#e0e9e3",
  line2: "#edf3ef", neutral: "#79a995", neutralStrong: "#527765",
  onNeutralStrong: "#ffffff", neutralSoft: "#eff6f2", lift: "#e8f7ef", tint: "#e0f7ed",
  fontFamily: "Manrope, sans-serif", monoFamily: "DM Sans, sans-serif",
} as const;

type TreemapResult = ReturnType<typeof applicationImpactTreemap>;

export function ApplicationImpactTreemap({ result, metric, unit, divisor, interval, selectedServiceId, onSelectService }: {
  result: TreemapResult;
  metric: "energy" | "emissions";
  unit: string;
  divisor: number;
  interval: string;
  selectedServiceId?: string;
  onSelectService: (id: string) => void;
}) {
  const top = result.data[0];
  const partial = metric === "emissions" && result.emissionCount < result.sampleCount;
  const note = [
    partial ? `${result.emissionCount} de ${result.sampleCount} amostras com carbono` : null,
    result.missingCount ? `${result.missingCount} sem estimativa` : null,
    result.zeroCount ? `${result.zeroCount} com impacto zero` : null,
  ].filter(Boolean).join(" · ");
  const data = result.data.map(row => ({ ...row, value: row.value / divisor }));

  return <ChartCard className="observatory-treemap-card" number="01" title="Impacto por aplicação"
    subtitle={`${metric === "energy" ? "Energia" : "CO₂e estimado"} · ${interval}`}
    takeaway={top ? `${top.application} lidera com ${formatNumber(top.value / result.total * 100)}% do total` : undefined}
    note={note || "As áreas mostram a participação; passe o cursor para consultar os valores."} theme={theme} locale="pt-BR">
    <Treemap data={data} label="application" value="value" group="category" unit={unit}
      format={{ maximumFractionDigits: 3 }} locale="pt-BR" theme={theme}
      highlight={selectedServiceId ? row => row.serviceId === selectedServiceId : "max"}
      ariaLabel="Impacto estimado por aplicação, agrupado por país"
      description="O tamanho de cada área representa a energia ou emissão estimada no período selecionado."
      onClick={event => { if (event.datum) onSelectService(event.datum.serviceId); }}
      tooltip={event => <span><strong>{event.label}</strong><br />{formatNumber(event.value ?? 0)} {unit}{event.datum?.region ? <><br />{event.datum.region}</> : null}</span>} />
  </ChartCard>;
}
