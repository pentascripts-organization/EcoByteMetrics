import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, ChevronDown, ListFilter, Search, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { RegionMap } from "../components/map/RegionMap";
import { MonitoringTabs } from "../components/MonitoringTabs";
import { HistoryChart } from "../components/HistoryChart";
import { ObservationTimeline } from "../components/ObservationTimeline";
import { MonitoringState } from "../components/MonitoringState";
import type { ImpactLens } from "../domain/observatory";
import { useMonitoring } from "../hooks/useMonitoring";
import { useAnalysis } from "../hooks/useAnalysis";
import { applicationImpacts, filterApplications, serviceLocationPeers, statusColors } from "../domain/dashboard";
import type { DashboardMetric } from "../domain/dashboard";
import { summarizeCollections } from "../domain/history";
import { serviceStatusLabels } from "../types";
import type { CollectionPoint, MonitoredService } from "../types";
import { formatNumber } from "@/shared/lib/format";
import { CountryFlag } from "@/shared/ui/CountryFlag";
import { TopographicSides } from "../components/TopographicSides";

const stamp = (value?: string | null) => value ? new Date(value).toLocaleString("pt-BR") : "Ainda não realizada";

function ServiceStatus({ service }: { service: MonitoredService }) {
  return <span className="monitoring-status"><i style={{ background: statusColors[service.status] }} />{serviceStatusLabels[service.status]}</span>;
}

export function DashboardPage() {
  const { snapshot, loading, error, refresh, period } = useMonitoring();
  const analysis = useAnalysis();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [hoveredServiceId, setHoveredServiceId] = useState("");
  const [focusedServiceId, setFocusedServiceId] = useState("");
  const [mapHighlightedIds, setMapHighlightedIds] = useState<string[]>([]);
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 680px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 680px)");
    const change = (event: MediaQueryListEvent) => setMobile(event.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousSelection = useRef("");
  const restoringListFocus = useRef(false);
  const selectedId = params.get("servico") ?? "";
  const selected = analysis.environmentServices.find(service => service.id === selectedId);
  const search = params.get("busca") ?? "";
  const status = params.get("estado") ?? "";
  const metric: DashboardMetric = params.get("ordem") === "energy" ? "energy" : "emissions";
  const lens: ImpactLens = params.get("lente") === "energy" ? "energy" : params.get("lente") === "emissions" ? "emissions" : "status";
  const tab = params.get("aba") === "evolucao" ? "evolucao" : params.get("aba") === "mapa" && mobile ? "mapa" : "geral";
  const detailTab = ["recursos", "evolucao"].includes(params.get("detalhe") ?? "") ? params.get("detalhe")! : "resumo";
  const filtered = Boolean(search || status || analysis.regional || analysis.date || period !== "24h");
  const update = useCallback((values: Record<string, string>, replace = false) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value); else next.delete(key);
    }
    setParams(next, { replace });
  }, [params, setParams]);
  const services = useMemo(() => filterApplications(analysis.services, search, status), [analysis.services, search, status]);
  const mapServices = useMemo(() => selected ? serviceLocationPeers(analysis.environmentServices, selected) : services, [selected, services, analysis.environmentServices]);
  const ids = useMemo(() => new Set(services.map(service => service.id)), [services]);
  const history = useMemo(() => analysis.history.filter(point => ids.has(point.serviceId)), [analysis.history, ids]);
  const impacts = useMemo(() => applicationImpacts(services, history, metric), [services, history, metric]);
  const focusServiceId = focusedServiceId || hoveredServiceId;
  const highlightedIds = focusServiceId ? [focusServiceId] : mapHighlightedIds;
  const selectedHistory = useMemo(() => analysis.history.filter(point => point.serviceId === selectedId), [analysis.history, selectedId]);
  const countries = [...new Set(analysis.environmentServices.map(service => service.country).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const regionOptions = [...new Map(analysis.environmentServices.filter(service => service.regionCode && (!analysis.country || service.country === analysis.country)).map(service => [service.regionCode!, service])).values()];
  useEffect(() => {
    if (selectedId) {
      heading.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    } else if (previousSelection.current) {
      restoringListFocus.current = true;
      document.getElementById("application-" + previousSelection.current)?.focus({ preventScroll: true });
      restoringListFocus.current = false;
    }
    previousSelection.current = selectedId;
  }, [selectedId]);
  const openService = useCallback((id: string) => {
    setHoveredServiceId(""); setFocusedServiceId(""); setMapHighlightedIds([]);
    update({ servico: id, detalhe: "" });
  }, [update]);
  const back = () => update({ servico: "", detalhe: "" });
  const clearFilters = () => update({ busca: "", estado: "", pais: "", cidade: "", regiao: "", ate: "", periodo: "24h" });
  const goLive = () => update({ instante: "", ate: "" });
  const showTimeline = Boolean(analysis.observedAt) || (selectedId ? detailTab === "evolucao" : tab === "evolucao");
  const discovering = !snapshot.observations?.length && !snapshot.discoveryUpdatedAt && !error;
  const timeline = showTimeline && <ObservationTimeline observations={snapshot.observations ?? []} selected={analysis.observedAt} onSelect={value => update({ instante: value, ate: "" }, true)} onLive={goLive} onExplore={!selectedId && tab === "evolucao" ? () => update({ aba: mobile ? "mapa" : "" }) : undefined} />;
  return <>
    <TopographicSides key="topography" />
    {selectedId ? <div className="monitoring-heading detail-heading">
      <button className="monitoring-back" onClick={back}><ArrowLeft size={18} />Voltar à lista</button>
      <h1 ref={heading} tabIndex={-1}>{selected?.name ?? "Aplicação não encontrada"}</h1>
      {selected && <p><CountryFlag country={selected.country} />{[selected.city, selected.region, selected.country].filter(Boolean).join(" · ") || "Localização não informada"} <span className="heading-separator">·</span> <ServiceStatus service={selected} /></p>}
    </div> : <div className="monitoring-heading">
      <div><h1>Monitoramento</h1></div>
      <div className="monitoring-tools">
        <label className="monitoring-search"><Search size={21} aria-hidden="true" /><input type="search" aria-label="Buscar aplicação" placeholder="Buscar aplicação..." value={search} onChange={event => update({ busca: event.target.value }, true)} /></label>
        <button className="monitoring-filter-button" aria-expanded={filtersOpen} aria-controls="monitoring-filters" onClick={() => setFiltersOpen(!filtersOpen)}><ListFilter size={22} />Filtrar{filtered && <span className="filter-indicator" aria-label="Filtros ativos" />}</button>
      </div>
    </div>}
    {!selectedId && filtersOpen && <div className="monitoring-filters" id="monitoring-filters">
      <label>País<select value={params.get("pais") ?? ""} onChange={event => update({ pais: event.target.value, cidade: "", regiao: "" })}><option value="">Todos os países</option>{countries.map(country => <option key={country}>{country}</option>)}</select></label>
      <label>Região<select value={params.get("regiao") ?? ""} onChange={event => update({ regiao: event.target.value, cidade: "" })}><option value="">Todas as regiões</option>{regionOptions.map(service => <option key={service.regionCode} value={service.regionCode}>{[service.city, service.region].filter(Boolean).join(" · ") || service.regionCode}</option>)}</select></label>
      <label>Estado<select value={status} onChange={event => update({ estado: event.target.value })}><option value="">Todos os estados</option>{Object.entries(serviceStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Período<select value={period} onChange={event => update({ periodo: event.target.value })}><option value="24h">Até 24 horas</option><option value="7d">Até 7 dias</option></select></label>
      <label>Coletas até<input aria-label="Coletas até" type="datetime-local" value={analysis.invalidDate ? "" : analysis.date} onChange={event => update({ ate: event.target.value })} /></label>
      <button className="monitoring-text-button" onClick={clearFilters}><X size={16} />Limpar filtros</button>
    </div>}
    {analysis.invalidDate && <p className="monitoring-notice" role="alert">A data na URL é inválida. <button onClick={() => update({ ate: "" })}>Voltar para agora</button></p>}
    {analysis.observationMissing && <p className="monitoring-notice" role="alert">Este instante não está mais disponível nesta sessão. <button onClick={goLive}>Voltar ao vivo</button></p>}
    {error && <div className="monitoring-notice" role="alert"><p>{snapshot.services.length ? "A atualização falhou. Exibindo os últimos dados recebidos." : "Não foi possível consultar as aplicações."}</p><button onClick={() => void refresh()} disabled={loading}>{loading ? "Atualizando…" : "Tentar novamente"}</button><details><summary>Detalhes da conexão</summary><p>{error}</p></details></div>}
    {analysis.warning && <details className="monitoring-notice"><summary>Há informações indisponíveis nesta consulta</summary><p>{analysis.warning}</p></details>}
    {selectedId ? selected && <MonitoringTabs label="Informações da aplicação" value={detailTab} tabs={[{ value: "resumo", label: "Resumo" }, { value: "recursos", label: "Recursos" }, { value: "evolucao", label: "Evolução" }]} onChange={value => update({ detalhe: value })} /> : <MonitoringTabs label="Visualização do monitoramento" value={tab} tabs={[{ value: "geral", label: "Visão geral", mobileLabel: "Serviços" }, { value: "mapa", label: "Mapa", className: "mobile-map-tab" }, { value: "evolucao", label: "Evolução" }]} onChange={value => update({ aba: value === "geral" ? "" : value })} />}
    {!selectedId && timeline}
    <section key="monitoring-content" className="monitoring-view" id="monitoring-content" role="tabpanel" aria-label={selectedId ? "Detalhes da aplicação" : tab === "evolucao" ? "Evolução do ambiente" : "Visão geral do ambiente"}>
      <div className={"monitoring-overview" + (selected ? " service-overview" : "")} data-view={tab} hidden={selectedId ? !selected : tab === "evolucao"}>
        <section className="monitoring-location" aria-label="Localização dos serviços">
          {selected && <h2>Localização do serviço</h2>}
          <RegionMap key="world" services={mapServices} selectedServiceId={selected?.id} onSelectService={openService} history={selected ? analysis.history : history} lens={lens} highlightedServiceIds={highlightedIds} focusServiceId={selected ? undefined : focusServiceId} onHighlightServices={setMapHighlightedIds} />
        </section>
        {selected ? <section className="monitoring-service-summary">
          {timeline}
          {detailTab === "resumo" ? <><h2>Impacto nas amostras</h2><dl className="monitoring-facts">
            <div><dt>Energia estimada</dt><dd>{formatNumber(summarizeCollections(selectedHistory).energyKwh)} <small>kWh</small></dd></div>
            <div><dt>Emissões estimadas</dt><dd>{formatNumber(summarizeCollections(selectedHistory).emissionsG)} <small>g CO₂e</small></dd></div>
            <div><dt>Última coleta</dt><dd className="fact-text">{stamp(selected.lastCollectionAt)}</dd></div>
            <div><dt>Intensidade de carbono</dt><dd className="fact-text">{formatNumber(selected.carbonIntensity ?? null)} g CO₂e/kWh</dd></div>
          </dl>{selected.statusMessage && <p className="service-message">{selected.statusMessage}</p>}</> : detailTab === "recursos" ? <section className="monitoring-resources"><div className="monitoring-section-heading"><h2>Recursos da última coleta</h2><span>{stamp(selected.lastCollectionAt)}</span></div>
          <dl className="monitoring-resource-list">{[
            ["CPU", selected.cpuPercent, "%"], ["Memória", selected.memoryGb, "GB"], ["Disco", selected.diskGb, "GB"], ["Rede", selected.networkGb, "GB"], ["Intervalo da amostra", selected.collectionIntervalSeconds ?? null, "s"],
          ].map(([label, value, unit]) => <div key={String(label)}><dt>{label}</dt><dd>{formatNumber(value as number | null)} <span>{unit}</span></dd></div>)}</dl><p className="monitoring-explanation">Valores ausentes são exibidos como “—”. Métricas antigas preservam o estado de desatualização da aplicação.</p>
        </section> : detailTab === "evolucao" ? <Evolution history={selectedHistory} metric={metric} onMetric={value => update({ ordem: value })} period={period} onPeriod={value => update({ periodo: value })} /> : null}
        </section> : <section className="monitoring-applications"><div className="monitoring-section-heading"><h2>Aplicações</h2><label className="monitoring-sort">Ordenar:<select aria-label="Ordenar aplicações" value={metric} onChange={event => update({ ordem: event.target.value })}><option value="emissions">Emissões</option><option value="energy">Energia</option></select><ChevronDown size={17} aria-hidden="true" /></label></div>
            <div className="monitoring-table-scroll">
              <table className="monitoring-app-table"><thead><tr><th scope="col">Aplicação</th><th scope="col">{analysis.observedAt ? "Estado observado" : "Estado atual"}</th><th scope="col">{metric === "energy" ? "Energia" : "CO₂e"} {analysis.observedAt ? "até este instante" : filtered ? "no período" : "na sessão"}</th></tr></thead>
                <tbody>{impacts.map(({ service, value, summary }) => <tr key={service.id} data-highlighted={highlightedIds.includes(service.id)} onMouseEnter={() => setHoveredServiceId(service.id)} onMouseLeave={() => setHoveredServiceId("")}><td><button id={"application-" + service.id} onFocus={() => { if (!restoringListFocus.current) setFocusedServiceId(service.id); }} onBlur={() => setFocusedServiceId("")} onClick={() => openService(service.id)}><span className="monitoring-application-name"><CountryFlag country={service.country} /><span>{service.name}</span></span><ArrowUpRight size={15} aria-hidden="true" /></button></td><td><ServiceStatus service={service} /></td><td title={metric === "emissions" && summary.emissionCount < summary.count ? "Faltam fatores de carbono para completar as emissões deste serviço." : undefined}><span key={service.lastCollectionAt ?? service.id} className="monitoring-sample-value">{formatNumber(value)}{value !== null && (metric === "energy" ? " kWh" : " g")}</span></td></tr>)}</tbody>
              </table>
            </div>
            {!services.length && <MonitoringState kind={loading || discovering ? "loading" : error && !snapshot.services.length ? "offline" : filtered || analysis.environmentServices.length ? "filtered" : "empty"} onReset={clearFilters} />}
          </section>}
      </div>
      {selectedId ? !selected ? <p className="monitoring-empty">Esta aplicação não está no ambiente recebido. <button className="monitoring-text-button" onClick={back}>Voltar à lista</button></p> : null : tab === "evolucao" && <Evolution history={history} metric={metric} onMetric={value => update({ ordem: value })} period={period} onPeriod={value => update({ periodo: value })} cumulative />}
    </section>
  </>;
}

function Evolution({ history, metric, onMetric, period, onPeriod, cumulative = false }: {
  history: CollectionPoint[]; metric: DashboardMetric; onMetric: (metric: string) => void;
  period: string; onPeriod: (period: string) => void; cumulative?: boolean;
}) {
  return <section className="monitoring-evolution"><div className="monitoring-section-heading"><div><h2>Evolução {cumulative ? "do ambiente" : "da aplicação"}</h2><p>Somente as amostras registradas nesta sessão.</p></div><div className="evolution-controls"><label>Métrica<select value={metric} onChange={event => onMetric(event.target.value)}><option value="emissions">Emissões</option><option value="energy">Energia</option></select></label><label>Período<select value={period} onChange={event => onPeriod(event.target.value)}><option value="24h">Até 24 horas</option><option value="7d">Até 7 dias</option></select></label></div></div><HistoryChart history={history} metric={metric} cumulative={cumulative} /></section>;
}
