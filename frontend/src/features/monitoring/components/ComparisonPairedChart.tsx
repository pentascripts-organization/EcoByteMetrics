import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Plus } from "lucide-react";
import { useId, useMemo } from "react";
import { CountryFlag } from "@/shared/ui/CountryFlag";
import { formatNumber } from "@/shared/lib/format";
import { serviceStatusLabels } from "../types";
import type { compareApplications } from "../domain/comparison";
import type { comparisonSeries } from "../domain/comparisonSeries";

type Row = ReturnType<typeof compareApplications>[number];
type Timeline = ReturnType<typeof comparisonSeries>;
type Metric = "energyKwh" | "emissionsG";
const colors = ["#00845f", "#376d89", "#8754a4", "#a15b28", "#336cbc", "#956019"];
const date = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function chartColor(id: string) {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return colors[hash % colors.length]!;
}

export function ComparisonPairedChart({ rows, timeline, metric, latest, onOpenService, onPick }: {
  rows: Row[]; timeline: Timeline | null; metric: Metric; latest: boolean; onOpenService: (id: string) => void; onPick: () => void;
}) {
  const gradient = useId();
  const unit = metric === "energyKwh" ? "kWh" : "g CO₂e";
  const label = metric === "energyKwh" ? "Energia" : "Emissões de carbono";
  const max = useMemo(() => {
    let highest = 0;
    for (const buckets of timeline?.series.values() ?? []) {
      for (const bucket of buckets.values()) highest = Math.max(highest, bucket[metric] ?? 0);
    }
    return highest || 1;
  }, [timeline, metric]);

  return <>
    <header className="comparison-result-heading">
      <div><h3>{latest ? "Última leitura por aplicação" : "Evolução por aplicação"}</h3>
        <p>{latest ? "Horários e durações de coleta podem variar." : "Mesmas escalas entre a primeira e a última leitura da seleção. Lacunas indicam intervalos sem valor."}</p></div>
    </header>
    <div className="comparison-graph-grid" data-stacked={rows.length > 2}>
      {rows.map((row, index) => {
        const buckets = timeline?.series.get(row.service.id);
        const data = (timeline?.times ?? []).map(time => {
          const bucket = buckets?.get(time);
          return { time, value: bucket?.[metric] ?? null, partial: metric === "emissionsG" && !!bucket && bucket.emissionCount < bucket.count };
        });
        const hasValues = data.some(point => point.value !== null);
        const lastBucket = [...data].reverse().find(point => buckets?.has(point.time));
        const value = latest ? row[metric] : lastBucket?.value ?? null;
        const time = latest ? row.last : lastBucket?.time;
        const color = chartColor(row.service.id);
        const fill = gradient + index;
        return <article className="comparison-chart-card" key={row.service.id} aria-label={row.service.name}>
          <header><h4><CountryFlag country={row.service.country} /> {row.service.name}</h4><span className="comparison-service-status"><i className={"monitoring-status-dot monitoring-status-dot--" + row.service.status} aria-hidden="true" />{serviceStatusLabels[row.service.status]}</span></header>
          <div className="comparison-reading">
            <div><p>{label} {latest ? "na última coleta" : "no último intervalo com leitura"}</p>
              <strong>{value === null ? "Indisponível" : <>{formatNumber(value)} <small>{unit}</small></>}</strong></div>
            {time != null && <time dateTime={new Date(time).toISOString()}>{latest ? new Date(time).toLocaleString("pt-BR") : date.format(time)}</time>}
          </div>
          {lastBucket?.partial && <p className="comparison-coverage">{value === null ? "Amostras sem cálculo de emissões" : "Cálculo parcial no último intervalo"}</p>}
          {timeline && (hasValues ? <div className="comparison-plot">
            <ResponsiveContainer width="100%" height={176} minWidth={0}>
              <AreaChart data={data} accessibilityLayer margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <defs><linearGradient id={fill} x1="0" y1="0" x2="0" y2="1"><stop stopColor={color} stopOpacity={0.18} /><stop offset="100%" stopColor={color} stopOpacity={0.02} /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="var(--monitoring-line)" />
                <XAxis dataKey="time" type="number" domain={[timeline.times[0]!, timeline.times.at(-1)!]} tickFormatter={value => date.format(value)} minTickGap={28} tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis className="comparison-y-axis" width={55} domain={[0, max]} tickCount={4} tickFormatter={formatNumber} tick={{ fontSize: 11 }} tickLine={false} />
                <Tooltip filterNull={false} content={({ active, payload }) => {
                  const point = payload?.[0]?.payload as (typeof data)[number] | undefined;
                  return active && point ? <div className="comparison-chart-tooltip">
                    <strong>{date.format(point.time)}</strong>
                    <div>{point.value === null ? buckets?.has(point.time) ? "Valor indisponível" : "Sem registros" : formatNumber(point.value) + " " + unit}</div>
                    {point.partial && point.value !== null && <div>Cálculo parcial</div>}
                  </div> : null;
                }} />
                <Area type="linear" dataKey="value" name={label} unit={" " + unit} stroke={color} strokeWidth={2}
                  fill={"url(#" + fill + ")"} connectNulls={false} isAnimationActive={false}
                  dot={({ cx, cy, index: pointIndex }) => {
                    if (cx == null || cy == null || data[pointIndex]?.value == null ||
                      (data[pointIndex - 1]?.value != null && data[pointIndex + 1]?.value != null && !data[pointIndex]?.partial)) return <g key={pointIndex} />;
                    return <circle key={pointIndex} cx={cx} cy={cy} r={3} fill={data[pointIndex]?.partial ? "white" : color} stroke={color} />;
                  }} />
              </AreaChart>
            </ResponsiveContainer>
          </div> : <p className="comparison-chart-empty">{buckets?.size ? "Nenhum valor calculado para este indicador." : "Sem coletas registradas no período."}</p>)}
          <button className="comparison-link" type="button" onClick={() => onOpenService(row.service.id)}>Ver detalhes da aplicação</button>
        </article>;
      })}
      {rows.length === 1 && <div className="comparison-empty comparison-add-card">
        <p role="status">Selecione mais uma aplicação para comparar.</p>
        <button className="comparison-button" type="button" onClick={onPick}><Plus size={16} aria-hidden="true" /> Adicionar aplicação</button>
      </div>}
    </div>
  </>;
}
