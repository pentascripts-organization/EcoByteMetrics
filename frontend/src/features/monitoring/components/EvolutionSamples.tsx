import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EvolutionMode, EvolutionPoint } from "../domain/evolution";
import type { DashboardMetric } from "../domain/dashboard";
import { formatNumber } from "@/shared/lib/format";

export function EvolutionSamples({ points, metric, mode }: { points: EvolutionPoint[]; metric: DashboardMetric; mode: EvolutionMode }) {
  const [page, setPage] = useState(0);
  const pageSize = 5;
  const lastPage = Math.max(0, Math.ceil(points.length / pageSize) - 1);
  const current = Math.min(page, lastPage);
  const ordered = [...points].reverse();
  const visible = ordered.slice(current * pageSize, (current + 1) * pageSize);
  const unit = metric === "energy" ? "kWh" : "g CO₂e";
  return <section className="evolution-samples">
    <div className="evolution-subheading"><h3>{mode === "cumulative" ? "Total por horário" : "Valores por intervalo"}</h3><span>{mode === "cumulative" ? "Total acumulado no período" : "Total de cada intervalo"} · {unit}</span></div>
    {points.length ? <>
      <table><caption className="sr-only">Intervalos mais recentes primeiro. Soma das estimativas disponíveis em {unit}.</caption><thead><tr><th scope="col">Registros até</th><th scope="col">{mode === "cumulative" ? "Total acumulado no período" : "Total no intervalo"} ({unit})</th></tr></thead>
        <tbody>{visible.map(point => <tr key={point.timestamp}><th scope="row">{new Date(point.to ?? point.timestamp).toLocaleString("pt-BR")}</th><td title={point.reason}>{formatNumber(point.value)}</td></tr>)}</tbody></table>
      <div className="evolution-pagination"><span aria-live="polite">{current * pageSize + 1}–{Math.min((current + 1) * pageSize, points.length)} de {points.length} intervalos</span><div><button aria-label="Página anterior de coletas" disabled={current === 0} onClick={() => setPage(current - 1)}><ChevronLeft size={18} /></button><button aria-label="Próxima página de coletas" disabled={current === lastPage} onClick={() => setPage(current + 1)}><ChevronRight size={18} /></button></div></div>
    </> : <p className="evolution-section-empty">Nenhuma coleta neste período.</p>}
  </section>;
}
