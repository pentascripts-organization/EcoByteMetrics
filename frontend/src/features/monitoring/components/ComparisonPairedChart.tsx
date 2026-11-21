import { memo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import type { MonitoredService } from "../types";
import { formatNumber } from "@/shared/lib/format";

export interface ComparisonRowData {
  service: MonitoredService;
  energyKwh: number | null;
  emissionsG: number | null;
  emissionCount: number;
  count: number;
}

export interface ComparisonPairedChartProps {
  rows: ComparisonRowData[];
  latest?: boolean;
}

const serviceColors = [
  "#087d62",
  "#0284c7",
  "#d97706",
  "#7c3aed",
  "#db2777",
  "#059669",
  "#4f46e5",
  "#ea580c",
];

export const ComparisonPairedChart = memo(function ComparisonPairedChart({
  rows,
  latest = false,
}: ComparisonPairedChartProps) {
  if (rows.length < 2) return null;

  const data = rows.map((r, index) => ({
    id: r.service.id,
    name: r.service.name,
    energyKwh: r.energyKwh,
    emissionsKg: r.emissionsG === null ? null : r.emissionsG / 1000,
    color: serviceColors[index % serviceColors.length],
  }));

  const maxEnergy = Math.max(0, ...data.map(row => row.energyKwh ?? 0));
  const maxEmissions = Math.max(0, ...data.map(row => row.emissionsKg ?? 0));
  const missingEnergy = data.filter(row => row.energyKwh === null).map(row => row.name);
  const missingEmissions = data.filter(row => row.emissionsKg === null).map(row => row.name);

  const partialEmissions = latest ? [] : rows.filter(row => row.emissionsG !== null && row.emissionCount < row.count);

  return (
    <div className="comparison-paired-charts" aria-label="Gráficos pareados de consumo e carbono">
      <div className="comparison-chart-card">
        <div className="comparison-chart-header">
          <h3>Consumo de Energia</h3>
          <span className="comparison-chart-unit">kWh {latest ? "(última coleta)" : "(total)"}</span>
        </div>
        <div className="comparison-chart-body">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 24 }}>
              <CartesianGrid vertical={false} stroke="#e9efeb" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#61776b", fontSize: 12 }}
                interval={0}
                tickMargin={10}
              />
              <YAxis
                domain={[0, maxEnergy > 0 ? maxEnergy * 1.15 : 0.001]}
                tickFormatter={(val) => formatNumber(val)}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                tick={{ fill: "#61776b", fontSize: 11 }}
                width={50}
              />
              <Tooltip
                isAnimationActive={false}
                formatter={(val) => [
                  `${formatNumber(typeof val === "number" ? val : null)} kWh`,
                  "Energia",
                ]}
                labelStyle={{ fontWeight: 600, color: "#103a40" }}
                contentStyle={{
                  background: "#fff",
                  borderRadius: 8,
                  border: "1px solid #d0e1d9",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: 13,
                }}
              />
              <Bar dataKey="energyKwh" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {data.map((entry) => (
                  <Cell key={`energy-cell-${entry.id}`} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {missingEnergy.length > 0 && <p className="monitoring-explanation">Sem estimativa de energia: {missingEnergy.join(", ")}.</p>}
      </div>

      <div className="comparison-chart-card">
        <div className="comparison-chart-header">
          <h3>Emissões de Carbono</h3>
          <span className="comparison-chart-unit">kg CO₂e {latest ? "(última coleta)" : "(total)"}</span>
        </div>
        <div className="comparison-chart-body">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 24 }}>
              <CartesianGrid vertical={false} stroke="#e9efeb" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#61776b", fontSize: 12 }}
                interval={0}
                tickMargin={10}
              />
              <YAxis
                domain={[0, maxEmissions > 0 ? maxEmissions * 1.15 : 0.001]}
                tickFormatter={(val) => formatNumber(val)}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                tick={{ fill: "#61776b", fontSize: 11 }}
                width={50}
              />
              <Tooltip
                isAnimationActive={false}
                formatter={(val) => [
                  `${formatNumber(typeof val === "number" ? val : null)} kg CO₂e`,
                  "Carbono",
                ]}
                labelStyle={{ fontWeight: 600, color: "#103a40" }}
                contentStyle={{
                  background: "#fff",
                  borderRadius: 8,
                  border: "1px solid #d0e1d9",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: 13,
                }}
              />
              <Bar dataKey="emissionsKg" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {data.map((entry) => (
                  <Cell key={`carbon-cell-${entry.id}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {partialEmissions.length > 0 && <p className="monitoring-explanation">Emissões parciais: {partialEmissions.map(row => `${row.service.name} (${row.emissionCount} de ${row.count} amostras)`).join(", ")}.</p>}
        {missingEmissions.length > 0 && <p className="monitoring-explanation">Sem estimativa de emissões: {missingEmissions.join(", ")}.</p>}
      </div>
    </div>
  );
});
