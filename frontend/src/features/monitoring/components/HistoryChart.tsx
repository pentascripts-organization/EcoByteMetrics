import { useMemo } from "react";
import type { CollectionPoint } from "../types";
import type { DashboardMetric } from "../domain/dashboard";
import { collectionSeries } from "../domain/dashboard";
import { formatNumber } from "@/shared/lib/format";

export function HistoryChart({ history, metric, cumulative = false }: {
  history: CollectionPoint[]; metric: DashboardMetric; cumulative?: boolean;
}) {
  const points = useMemo(() => collectionSeries(history, metric, cumulative), [history, metric, cumulative]);
  const valid = points.filter(point => point.value !== null);
  const unit = metric === "energy" ? "kWh" : "gCO₂e";
  const time = (timestamp: number) => new Date(timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (!valid.length) return <p className="monitoring-empty" role="status">Ainda não há amostras com {metric === "energy" ? "energia" : "emissões"} neste período.</p>;
  const start = valid[0]!.timestamp;
  const end = valid.at(-1)!.timestamp;
  const duration = Math.max(end - start, 1);
  const largestValue = valid.reduce((value, point) => Math.max(value, point.value!), 0);
  const maximum = largestValue > 0 ? largestValue * 1.15 : 1;
  const x = (timestamp: number) => 76 + (timestamp - start) / duration * 984;
  const y = (value: number) => 254 - value / maximum * 224;
  let path = "";
  let connected = false;
  for (const point of points) {
    if (point.value === null) { connected = false; continue; }
    path += (connected && !point.gap ? " L " : " M ") + x(point.timestamp) + " " + y(point.value);
    connected = true;
  }
  return <figure className="monitoring-chart">
    <figcaption>{unit}{cumulative ? " acumulados nas amostras" : " por coleta"}</figcaption>
    <svg viewBox="0 0 1100 300" role="img" aria-label={(cumulative ? "Valores acumulados" : "Valores por coleta") + " em " + unit + ", de " + time(start) + " a " + time(end)}>
      {[0, 1, 2, 3].map(step => {
        const value = maximum * step / 3;
        return <g key={step}><line x1="76" x2="1060" y1={y(value)} y2={y(value)} className="chart-grid" />
          <text x="62" y={y(value) + 5} textAnchor="end">{formatNumber(value)}</text></g>;
      })}
      <path d={path} className="chart-line" />
      {valid.map((point, index) => <circle key={index} cx={x(point.timestamp)} cy={y(point.value!)} r="3" className="chart-point"><title>{time(point.timestamp) + ": " + formatNumber(point.value) + " " + unit}</title></circle>)}
      {(start === end ? [start] : [start, start + duration / 3, start + duration * 2 / 3, end]).map((timestamp, index) =>
        <text key={index} x={x(timestamp)} y="286" textAnchor="middle">{time(timestamp)}</text>)}
    </svg>
    <p>{cumulative ? "Soma das estimativas nas amostras disponíveis; intervalos podem se sobrepor." : "Lacunas indicam ausência de amostras. Dados disponíveis nesta sessão."}</p>
    <details className="chart-data"><summary>Consultar valores das amostras</summary>
      <div className="monitoring-table-scroll" tabIndex={0} role="region" aria-label="Valores do gráfico">
        <table><caption>Últimos {Math.min(points.length, 100)} registros do gráfico</caption><thead><tr><th scope="col">Horário</th><th scope="col">{unit}</th></tr></thead>
          <tbody>{points.slice(-100).map((point, index) => <tr key={index}><td>{new Date(point.timestamp).toLocaleString("pt-BR")}</td><td>{formatNumber(point.value)}</td></tr>)}</tbody></table>
      </div>
    </details>
  </figure>;
}
