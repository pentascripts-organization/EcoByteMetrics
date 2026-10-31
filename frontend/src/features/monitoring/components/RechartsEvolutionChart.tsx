import { Bar, CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import type { EvolutionChartPoint } from "../domain/chartData";
import { collectionEventLabels } from "../domain/collectionEvents";
import type { DashboardMetric } from "../domain/dashboard";
import type { EvolutionMode } from "../domain/evolution";
import { formatNumber } from "@/shared/lib/format";

export function RechartsEvolutionChart({ data, metric, mode, intervalMs, helpId }: {
  data: EvolutionChartPoint[]; metric: DashboardMetric; mode: EvolutionMode; intervalMs: number; helpId: string;
}) {
  const first = data[0]!, latest = data.at(-1)!;
  const unit = metric === "energy" ? "kWh" : "g CO₂e";
  const seriesLabel = metric === "energy" ? "Energia estimada" : "Emissões estimadas";
  const color = metric === "energy" ? "#137f89" : "#168362";
  const multipleDays = new Date(first.timestamp).toDateString() !== new Date(latest.timestamp).toDateString();
  const time = (timestamp: number) => new Date(timestamp).toLocaleString("pt-BR", { ...(multipleDays ? { day: "2-digit", month: "2-digit" } : {}), hour: "2-digit", minute: "2-digit", ...(intervalMs < 60_000 ? { second: "2-digit" } : {}) });
  return <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 900, height: 240 }} debounce={50}>
    <ComposedChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }} accessibilityLayer
      title={seriesLabel + (mode === "cumulative" ? metric === "energy" ? " acumulada por coleta" : " acumuladas por coleta" : " por intervalo")}
      aria-label="Explorar valores do gráfico" aria-describedby={helpId} maxBarSize={26}>
      <CartesianGrid vertical={false} stroke="#e5ede8" strokeDasharray="3 5" />
      <XAxis type="number" dataKey="timestamp" scale="time" domain={[first.timestamp - intervalMs / 2, latest.timestamp + intervalMs / 2]} ticks={chartTicks(data)} tickFormatter={time} minTickGap={32} axisLine={false} tickLine={false} tickMargin={10} height={30} tick={{ fill: "#668074", fontSize: 11 }} />
      <YAxis width={72} domain={[0, (maximum: number) => maximum > 0 ? maximum * 1.12 : 1]} tickCount={4} tickFormatter={formatNumber} axisLine={false} tickLine={false} tickMargin={10} tick={{ fill: "#668074", fontSize: 11 }} />
      {data.filter(point => point.missing).map(point => <ReferenceArea key={point.timestamp} x1={point.from! + intervalMs / 2} x2={point.to! - intervalMs / 2} fill="#b78328" fillOpacity={.1} strokeOpacity={0} />)}
      <Tooltip isAnimationActive={false} filterNull={false}
        cursor={mode === "intervals" ? { fill: color, fillOpacity: .05 } : { stroke: color, strokeOpacity: .3, strokeDasharray: "4 4" }}
        content={props => <EvolutionTooltip {...props} seriesLabel={seriesLabel} unit={unit} mode={mode} />} />
      {mode === "intervals"
        ? <Bar dataKey="value" name={seriesLabel} fill={color} fillOpacity={.85} radius={[4, 4, 0, 0]} isAnimationActive={false} activeBar={{ fill: color, fillOpacity: 1 }} />
        : <Line dataKey="value" name={seriesLabel} stroke="none" connectNulls={false} dot={{ r: 4, fill: color, stroke: "#fff", strokeWidth: 1.5 }} activeDot={{ r: 6, fill: color, stroke: "#fff", strokeWidth: 2 }} isAnimationActive={false} />}
    </ComposedChart>
  </ResponsiveContainer>;
}

function chartTicks(data: EvolutionChartPoint[]) {
  const timestamps = data.filter(point => !point.missing).map(point => point.timestamp);
  const count = Math.min(4, timestamps.length);
  return [...new Set(Array.from({ length: count }, (_, index) => timestamps[Math.round(index * (timestamps.length - 1) / Math.max(1, count - 1))]!))];
}

export function EvolutionTooltip({ active, payload, seriesLabel, unit, mode = "intervals" }: Pick<TooltipContentProps, "active" | "payload"> & { seriesLabel: string; unit: string; mode?: EvolutionMode }) {
  const point = payload[0]?.payload as EvolutionChartPoint | undefined;
  if (!active || !point) return null;
  const stamp = (timestamp: number) => new Date(timestamp).toLocaleString("pt-BR");
  const contexts = [...new Set(point.events?.map(event => collectionEventLabels[event.kind]) ?? [])];
  return <div className="evolution-tooltip" role="status">
    <strong>{point.missing ? "Trecho sem registros" : mode === "cumulative" ? "Acumulado no período" : "Total do intervalo"}</strong>
    {!point.missing && <small>{point.from !== undefined && point.to !== undefined ? stamp(point.from) + " → " + stamp(point.to) : stamp(point.timestamp)}</small>}
    {point.missing && <small>{stamp(point.from!)} → {stamp(point.to!)}</small>}
    {point.value === null ? <p>{point.reason ?? "Estimativa indisponível para esta amostra."}</p> : <p>{seriesLabel}: <b>{formatNumber(point.value)} {unit}</b></p>}
    {point.value !== null && point.reason && <p>{point.reason}</p>}
    {contexts.length > 0 && <><small>Informação registrada durante a coleta</small>{contexts.map(text => <p key={text}>{text}</p>)}</>}
    {point.missing && <small>Mais informações em Dados incompletos.</small>}
  </div>;
}
