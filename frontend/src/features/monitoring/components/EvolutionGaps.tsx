import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EvolutionChartPoint } from "../domain/chartData";
import type { MonitoredService } from "../types";
import { collectionEventLabels } from "../domain/collectionEvents";

export function EvolutionGaps({ data, services = [] }: { data: EvolutionChartPoint[]; services?: MonitoredService[] }) {
  const gaps = data.filter(point => point.missing || point.value === null || point.reason || point.events?.length);
  const [selected, setSelected] = useState(0);
  const page = Math.min(selected, Math.max(0, gaps.length - 1));
  const gap = gaps[page];
  const stamp = (timestamp: number) => new Date(timestamp).toLocaleString("pt-BR");
  const contexts = [...new Set(gap?.events?.map(event => event.kind) ?? [])];
  return <section className="evolution-gaps">
    <div className="evolution-subheading"><h3>Dados que não puderam ser calculados</h3><span>Registros persistidos no banco</span></div>
    {gap ? <>
      <article key={gap.timestamp} className="evolution-gap-detail">
        <h4>{gap.missing ? "Período sem leituras" : gap.reason || gap.value === null ? "Leituras sem informação suficiente para calcular carbono" : "Falha de coleta em parte do ambiente"}</h4>
        <p className="evolution-gap-time">{gap.missing ? stamp(gap.from!) + " → " + stamp(gap.to!) : stamp(gap.timestamp)}</p>
        <p>{gap.reason ?? (gap.events?.length ? "Uma ou mais aplicações ficaram sem leitura. Os valores do intervalo usam somente as leituras recebidas." : "Não há uma estimativa disponível para esta leitura.")}</p>
        {gap.missing && <p className="evolution-gap-note">Não há registros neste trecho do banco. Sem um diagnóstico do coletor, não é possível afirmar a causa da ausência.</p>}
        {contexts.length > 0 && <><h4>Contexto registrado pelo coletor</h4><ul>{contexts.map(kind => {
          const events = gap.events!.filter(event => event.kind === kind);
          const from = Math.min(...events.map(event => Date.parse(event.from)));
          const to = Math.max(...events.map(event => Date.parse(event.to)));
          const names = [...new Set(events.flatMap(event => event.serviceIds ?? []))].map(id => services.find(service => service.id === id)?.name ?? id);
          return <li key={kind}><span>{collectionEventLabels[kind]}{names.length > 0 && " Aplicações: " + names.join(", ") + "."}</span><small>{events.length} ocorrência(s) entre {stamp(from)} e {stamp(to)}</small></li>;
        })}</ul><p className="evolution-gap-note">Esses diagnósticos foram gravados na coleta. Eles não cobrem necessariamente todo o trecho.</p></>}
      </article>
      <div className="evolution-pagination"><span aria-live="polite">Trecho {page + 1} de {gaps.length}</span><div><button type="button" aria-label="Lacuna anterior" disabled={page === 0} onClick={() => setSelected(page - 1)}><ChevronLeft size={18} /></button><button type="button" aria-label="Próxima lacuna" disabled={page === gaps.length - 1} onClick={() => setSelected(page + 1)}><ChevronRight size={18} /></button></div></div>
    </> : <p className="evolution-section-empty">Nenhum dado incompleto detectado nesta seleção.</p>}
  </section>;
}
