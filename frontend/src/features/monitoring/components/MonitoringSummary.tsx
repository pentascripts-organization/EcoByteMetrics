import type { CollectionPoint, MonitoredService } from "../types";
import { RotateCw } from "lucide-react";
import { useEffect, useRef } from "react";
import { serviceStatusLabels } from "../types";
import { summarizeCollections } from "../domain/history";
import { REFRESH_INTERVAL_MS } from "../domain/snapshot";
import { formatNumber } from "@/shared/lib/format";
import { createRefreshAnimation } from "../domain/refreshAnimation";
import { InfoTooltip } from "@/shared/ui/InfoTooltip";

export function MonitoringSummary({ services, history, periodLabel, refreshedAt, lastCollectionAt, observedAt, loading, onRefresh, showDetails = true }: {
  services: MonitoredService[]; history: CollectionPoint[]; periodLabel: string;
  refreshedAt?: string; lastCollectionAt: string | null; observedAt: string; loading: boolean; onRefresh: () => void;
  showDetails?: boolean;
}) {
  const refreshIcon = useRef<SVGSVGElement>(null);
  const animation = useRef<ReturnType<typeof createRefreshAnimation> | null>(null);
  useEffect(() => {
    if (!refreshIcon.current) return;
    const controller = createRefreshAnimation(refreshIcon.current);
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => controller.setReducedMotion(preference.matches);
    animation.current = controller;
    updateMotion();
    preference.addEventListener("change", updateMotion);
    return () => { preference.removeEventListener("change", updateMotion); controller.dispose(); animation.current = null; };
  }, []);
  useEffect(() => { animation.current?.setLoading(loading); }, [loading]);
  const totals = summarizeCollections(history);
  const first = history.reduce((oldest, point) => Math.min(oldest, Date.parse(point.collectedAt)), Infinity);
  const formatDate = (value: string | number) => new Date(value).toLocaleString("pt-BR");
  const counts = Object.entries(serviceStatusLabels).map(([status, label]) => ({ label, count: services.filter(service => service.status === status).length }));
  const complete = totals.count > 0 && totals.emissionCount === totals.count;
  return <div className="monitoring-summary">
    <div className="monitoring-update"><span role="status">{observedAt ? "Observação de " + formatDate(observedAt) : refreshedAt ? "Consulta concluída: " + formatDate(refreshedAt) : loading ? "Consultando aplicações…" : "Aguardando a primeira consulta"}</span><button type="button" className="monitoring-refresh" aria-label={loading ? "Atualizando aplicações" : "Atualizar aplicações"} title={loading ? "Atualizando…" : "Atualizar agora"} aria-busy={loading} disabled={loading} onClick={onRefresh}><RotateCw ref={refreshIcon} size={21} aria-hidden="true" className="monitoring-refresh-icon" /></button></div>
    {showDetails && <details><summary>Resumo · {periodLabel} · {services.length} {services.length === 1 ? "aplicação" : "aplicações"}</summary>
      <dl className="monitoring-summary-facts">
        <div><dt>Energia nas amostras<InfoTooltip label="energia nas amostras">Soma da energia estimada nas amostras disponíveis para os filtros e o período selecionados, em kWh. É uma estimativa baseada nos recursos e na duração das coletas.</InfoTooltip></dt><dd>{formatNumber(totals.energyKwh)} kWh</dd></div>
        <div><dt>Emissões {complete ? "nas amostras" : "parciais"}<InfoTooltip label="emissões nas amostras">Soma das emissões estimadas a partir da energia e do fator de carbono da região de cada aplicação, em gramas de CO₂ equivalente. O total é parcial quando faltam fatores de carbono em alguma amostra.</InfoTooltip></dt><dd>{formatNumber(totals.emissionsG)} g CO₂e</dd></div>
        <div><dt>Cobertura de emissões<InfoTooltip label="cobertura de emissões">Quantidade de amostras com uma estimativa de emissões em relação ao total de amostras recebidas nesta seleção. Não representa a cobertura de todo o período escolhido.</InfoTooltip></dt><dd>{totals.emissionCount} de {totals.count} amostras</dd></div>
        <div><dt>Última coleta válida no ambiente<InfoTooltip label="última coleta válida no ambiente">Horário mais recente de uma coleta válida entre todas as aplicações do ambiente. Pode ser anterior à última consulta, pois atualizar a tela nem sempre traz uma nova amostra.</InfoTooltip></dt><dd>{lastCollectionAt ? formatDate(lastCollectionAt) : "Ainda não realizada"}</dd></div>
      </dl>
      <p>{counts.filter(entry => entry.count).map(entry => `${entry.label}: ${entry.count}`).join(" · ") || "Nenhuma aplicação nesta seleção."}</p>
      <p>Atualização automática a cada {REFRESH_INTERVAL_MS / 1000} s com a aba visível. Histórico desta sessão{Number.isFinite(first) ? ", com amostras desde " + formatDate(first) : ", sem amostras no período"}. Recarregar a página apaga esse histórico.</p>
    </details>}
  </div>;
}
