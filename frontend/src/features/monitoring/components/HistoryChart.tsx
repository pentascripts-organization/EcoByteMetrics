import { lazy, Suspense, useId, useMemo } from "react";
import { ChartNoAxesCombined } from "lucide-react";
import type { DashboardMetric } from "../domain/dashboard";
import type { EvolutionPoint, EvolutionMode } from "../domain/evolution";
import { evolutionChartData } from "../domain/chartData";
import type { EvolutionChartPoint } from "../domain/chartData";
import { formatNumber } from "@/shared/lib/format";

const RechartsEvolutionChart = lazy(() => import("./RechartsEvolutionChart").then(module => ({ default: module.RechartsEvolutionChart })));

export function HistoryChart({ points, chartData, metric, mode, intervalMs, loading = false, onEnergy }: {
  points: EvolutionPoint[]; metric: DashboardMetric; mode: EvolutionMode; intervalMs: number; loading?: boolean; onEnergy: () => void;
  chartData?: EvolutionChartPoint[];
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const data = useMemo(() => chartData ?? evolutionChartData(points, intervalMs), [points, intervalMs, chartData]);
  const unit = metric === "energy" ? "kWh" : "g CO₂e";
  const seriesLabel = metric === "energy" ? "Energia estimada" : "Emissões estimadas";
  const color = metric === "energy" ? "#137f89" : "#168362";
  if (!points.some(point => point.value !== null)) return <div className="evolution-chart-empty" role="status">
    <ChartNoAxesCombined size={34} strokeWidth={1.3} aria-hidden="true" />
    <h3>{loading && !points.length ? "Aguardando as primeiras coletas" : points.length ? "Ainda faltam dados de emissões" : "Nenhuma amostra neste período"}</h3>
    <p>{points.length ? "Os fatores de carbono disponíveis não completam esta série. Você pode consultar a energia estimada." : "As coletas recebidas aparecerão aqui. Ajuste os filtros ou aguarde a próxima atualização."}</p>
    {points.length > 0 && metric === "emissions" && <button className="monitoring-text-button" onClick={onEnergy}>Visualizar energia</button>}
  </div>;
  const latest = points.at(-1)!;
  const fullTime = (timestamp: number) => new Date(timestamp).toLocaleString("pt-BR");
  return <figure className="evolution-chart" aria-labelledby={id + "-caption"}>
    <figcaption id={id + "-caption"} className="evolution-chart-reading">
      <div><span>{mode === "cumulative" ? "Acumulado das amostras recebidas" : "Último intervalo recebido"}</span><strong style={{ color }}>{formatNumber(latest.value)} <small>{unit}</small></strong></div>
      <time dateTime={new Date(latest.timestamp).toISOString()}>{fullTime(latest.timestamp)}</time>
    </figcaption>
    <div className="evolution-recharts" data-engine="recharts" data-chart-mode={mode} role="group" aria-label={seriesLabel + " ao longo do tempo"} aria-describedby={id + "-help"}>
      <Suspense fallback={<div className="evolution-chart-loading" role="status">Carregando gráfico…</div>}>
        <RechartsEvolutionChart data={data} metric={metric} mode={mode} intervalMs={intervalMs} helpId={id + "-help"} />
      </Suspense>
    </div>
    <p id={id + "-help"} className="sr-only">Use Tab para entrar no gráfico e as setas para consultar os valores. A seção Coletas apresenta os mesmos dados em tabela.</p>
    <div className="evolution-chart-footnote"><span><i className={mode === "cumulative" ? "evolution-dot-key" : undefined} style={{ background: color }} />{mode === "cumulative" ? "Cada ponto mostra o acumulado recebido até aquela coleta" : "Cada barra mostra a soma recebida no intervalo"}</span><span>Mouse, toque ou setas do teclado</span></div>
    {mode === "cumulative" && points.some(point => point.value === null) && <p className="evolution-chart-warning">O acumulado para quando faltam estimativas. Consulte a cobertura em Detalhes.</p>}
  </figure>;
}
