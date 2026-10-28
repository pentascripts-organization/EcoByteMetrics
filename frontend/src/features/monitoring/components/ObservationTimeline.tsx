import { Clock3, Radio } from "lucide-react";
import type { MonitoringObservation } from "../types";

export function ObservationTimeline({ observations, selected, onSelect, onLive, onExplore }: {
  observations: MonitoringObservation[]; selected: string; onSelect: (value: string) => void; onLive: () => void; onExplore?: () => void;
}) {
  const index = observations.findIndex(observation => observation.observedAt === selected);
  const latest = observations.at(-1);
  const current = selected ? observations[index] : latest;
  const format = (date: string) => new Date(date).toLocaleString("pt-BR");
  return <section className="observation-timeline" aria-label="Linha do tempo do ambiente">
    <div className="timeline-heading">
      <div className="timeline-heading-main">
        <span className="timeline-heading-status">
          <Clock3 size={18} />
          <strong>{selected ? "Revisando o ambiente" : "Acompanhando ao vivo"}</strong>
        </span>
        {current && (
          <label htmlFor="observation-range" className="timeline-observed-label">
            Observado em <strong>{format(current.observedAt)}</strong>
          </label>
        )}
      </div>
      <button className="monitoring-text-button" disabled={!selected} onClick={onLive}><Radio size={16} />Voltar ao vivo</button>
    </div>
    {current ? <>
      <input id="observation-range" type="range" min="0" max={Math.max(0, observations.length - 1)} step="1" value={index < 0 ? observations.length - 1 : index} disabled={observations.length < 2}
        aria-valuetext={format(current.observedAt)} onChange={event => { const observation = observations[Number(event.target.value)]; if (observation) onSelect(observation.observedAt); }} />
      <div className="timeline-range"><span>{format(observations[0]!.observedAt)}</span><span>{format(latest!.observedAt)}</span></div>
      <p>{observations.length < 2 ? "A próxima consulta permitirá percorrer a linha do tempo." : observations.length + " observações disponíveis nesta sessão. Os intervalos sem consulta não são reconstruídos."} <span>Recarregar a página reinicia este histórico; até 3.000 observações são mantidas.</span></p>
      {selected && onExplore && <button className="monitoring-text-button" onClick={onExplore}>Explorar este instante no mapa e na lista →</button>}
    </> : <p>{selected ? "Este instante não foi registrado ou já saiu do histórico local." : "A linha do tempo aparecerá após a primeira consulta ao ambiente."}</p>}
  </section>;
}
