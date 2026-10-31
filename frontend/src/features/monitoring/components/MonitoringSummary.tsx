import type { CollectionPoint, MonitoredService } from "../types";
import { RotateCw } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { collectionRange, summarizeCollections } from "../domain/history";
import { formatNumber } from "@/shared/lib/format";
import { createRefreshAnimation } from "../domain/refreshAnimation";

export function MonitoringSummary({ services, history, loading, onRefresh, comparison = false, latest = false, context }: {
  services: MonitoredService[]; history: CollectionPoint[];
  loading: boolean; onRefresh: () => void;
  comparison?: boolean; latest?: boolean; context?: ReactNode;
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
  const { last } = collectionRange(history);
  const formatDate = (value: string | number) => new Date(value).toLocaleString("pt-BR");
  return <section className="monitoring-summary" aria-label="Totais da seleção">
    <div className="monitoring-visible-totals">
      <div><span>{latest ? "CO₂e das últimas coletas" : "CO₂e calculado na seleção"}</span><strong>{formatNumber(totals.emissionsG)} <small>g CO₂e</small></strong></div>
      <div><span>{latest ? "Energia das últimas coletas" : "Energia estimada na seleção"}</span><strong>{formatNumber(totals.energyKwh)} <small>kWh</small></strong></div>
      <span className="monitoring-total-scope">Totais das {services.length} aplicações {comparison ? "marcadas para comparação." : "filtradas, incluindo todas as páginas da lista."}</span>
    </div>
    {context}
    <div className="monitoring-update"><span role="status">{last !== null ? "Dados coletados até " + formatDate(last) : loading ? "Consultando registros…" : "Ainda sem leituras nesta seleção"}</span><button type="button" className="monitoring-refresh" aria-label={loading ? "Consultando dados salvos" : "Consultar dados salvos"} title="Consultar os dados salvos; não inicia uma nova coleta" aria-busy={loading} disabled={loading} onClick={onRefresh}><RotateCw ref={refreshIcon} size={21} aria-hidden="true" className="monitoring-refresh-icon" /></button></div>
  </section>;
}
