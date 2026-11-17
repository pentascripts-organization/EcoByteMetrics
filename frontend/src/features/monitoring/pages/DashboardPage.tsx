import "../styles/map.css";
import "../styles/dashboard.css";
import "../styles/dashboard-clarity.css";
import "../styles/service-detail.css";
import { ServiceDetailOverview, ServiceReadingMeta } from "../components/ServiceDetailOverview";
import "@/shared/ui/AnimatedList.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ListFilter,
  MapPin,
  RotateCw,
  Search,
} from "lucide-react";
import { ServiceTrendItem } from "../components/ServiceTrendItem";
import { createRefreshAnimation } from "../domain/refreshAnimation";
import { FiltersDialog } from "../components/FiltersDialog";
import GlideSelect from "@/shared/ui/GlideSelect";
import SpecularButton from "@/shared/ui/SpecularButton";
import { InfoTooltip } from "@/shared/ui/InfoTooltip";
import { localDateTimeMax } from "@/shared/lib/localDate";
import { clearMonitoringFilters } from "../domain/analysis";
import { SortSelect } from "../components/SortSelect";
import { useSearchParams } from "react-router-dom";
import { RegionMap } from "../components/map/RegionMap";
import { MonitoringTabs } from "../components/MonitoringTabs";
import { EvolutionPanel } from "../components/EvolutionPanel";
import { ComparisonPanel } from "../components/ComparisonPanel";
import { AdministrationPanel } from "../components/AdministrationPanel";
import { ObservationTimeline } from "../components/ObservationTimeline";
import { MonitoringSummary, OperationalCounts } from "../components/MonitoringSummary";
import { MonitoringState } from "../components/MonitoringState";
import type { ImpactLens } from "../domain/observatory";
import { useMonitoring } from "../hooks/useMonitoring";
import { useAnalysis } from "../hooks/useAnalysis";
import { applicationImpacts, serviceLocationPeers, statusColors } from "../domain/dashboard";
import type { DashboardMetric } from "../domain/dashboard";
import { collectionRange, latestCollections } from "../domain/history";
import { serviceStatusLabels } from "../types";
import type { MonitoredService } from "../types";
import { formatDataPeriod, formatNumber, formatRecordedPeriod } from "@/shared/lib/format";
import { CountryFlag } from "@/shared/ui/CountryFlag";
import { TopographicSides } from "../components/TopographicSides";
import { useAuth } from "@/features/auth/useAuth";
import { Link } from "react-router-dom";
import { loginLocation } from "@/features/auth/api";
import { Globe2, SlidersHorizontal, LockKeyhole } from "lucide-react";
import { AdministrationAccess } from "@/features/auth/AdministrationAccess";

const stamp = (value?: string | null) => value ? new Date(value).toLocaleString("pt-BR") : "Ainda não realizada";

function ServiceStatus({ service }: { service: MonitoredService }) {
  return (
    <span
      className={`monitoring-status monitoring-status--${service.status}`}
      data-status={service.status}
      title={service.statusMessage}
    >
      <i
        className={`monitoring-status-dot monitoring-status-dot--${service.status}`}
        style={{ background: statusColors[service.status] }}
      />
      {serviceStatusLabels[service.status]}
    </span>
  );
}

export function DashboardPage() {
  const { snapshot, loading, error, refresh, period, setHistoryOpen } = useMonitoring();
  const analysis = useAnalysis();
  const { session } = useAuth();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(() => params.get("painel") === "historico" && params.get("aba") !== "evolucao");
  const [applicationPage, setApplicationPage] = useState(0);
  const [mapAnchor, setMapAnchor] = useState<HTMLDivElement | null>(null);
  const [detailEntryId, setDetailEntryId] = useState("");
  const departingPanels = useRef<() => void>(() => {});
  useEffect(() => () => departingPanels.current(), []);
  const [hoveredServiceId, setHoveredServiceId] = useState("");
  const [focusedServiceId, setFocusedServiceId] = useState("");
  const [mapHighlightedIds, setMapHighlightedIds] = useState<string[]>([]);
  const [expandedServiceId, setExpandedServiceId] = useState<string>("");
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 680px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 680px)");
    const change = (event: MediaQueryListEvent) => setMobile(event.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  const refreshIcon = useRef<SVGSVGElement>(null);
  const animation = useRef<ReturnType<typeof createRefreshAnimation> | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousSelection = useRef("");
  const restoringListFocus = useRef(false);
  const selectedId = params.get("servico") ?? "";
  const selectedCandidate = analysis.environmentServices.find(service => service.id === selectedId);
  const selected = analysis.services.find(service => service.id === selectedId);
  const selectedOutsideFilters = Boolean(selectedCandidate && !selected);
  const search = params.get("busca") ?? "";
  const status = params.get("estado") ?? "";
  const metric: DashboardMetric = params.get("ordem") === "energy" ? "energy" : "emissions";
  const lens: ImpactLens = params.get("lente") === "energy" ? "energy" : params.get("lente") === "emissions" ? "emissions" : "status";
  const tab = params.get("aba") === "administracao" ? "administracao" : params.get("aba") === "comparar" ? "comparar" : params.get("aba") === "evolucao" ? "evolucao" : params.get("aba") === "mapa" && mobile ? "mapa" : "geral";
  const administration = !selectedId && tab === "administracao";
  const detailTab = ["recursos", "evolucao"].includes(params.get("detalhe") ?? "") ? params.get("detalhe")! : "resumo";
  const historicalView = selectedId ? detailTab === "evolucao" : tab === "evolucao" || tab === "comparar";
  const showFilters = filtersOpen && !administration && (!historicalView || (!selectedId && tab === "evolucao"));
  useEffect(() => { setHistoryOpen?.(showFilters && Boolean(session)); return () => setHistoryOpen?.(false); }, [showFilters, setHistoryOpen, session]);
  const evolutionMode = params.get("serie") === "intervalos" ? "intervals" : "cumulative";
  const filtered = Boolean(search || status || analysis.regional || analysis.date || params.has("periodo"));
  const update = useCallback((values: Record<string, string>, replace = false) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value); else next.delete(key);
    }
    if (["busca", "estado", "pais", "regiao", "ordem", "periodo"].some(key => key in values)) setApplicationPage(0);
    setParams(next, { replace });
  }, [params, setParams]);
  const services = analysis.services;
  const mapServices = useMemo(() => selected ? serviceLocationPeers(analysis.environmentServices, selected) : services, [selected, services, analysis.environmentServices]);
  const history = analysis.history;
  const showHistoricalRanking = !selectedId && tab === "evolucao" && params.get("painel") === "aplicacoes";
  const impacts = useMemo(() => showHistoricalRanking ? applicationImpacts(services, history, metric) : [], [services, history, metric, showHistoricalRanking]);
  const latestHistory = useMemo(() => latestCollections(services), [services]);
  const latestImpacts = useMemo(() => applicationImpacts(services, latestHistory, metric, true), [services, latestHistory, metric]);
  const latestOverview = !selectedId && (tab === "geral" || tab === "mapa");
  const lastPage = Math.max(0, Math.ceil(latestImpacts.length / 5) - 1);
  const page = Math.min(applicationPage, lastPage);
  const visibleImpacts = latestImpacts.slice(page * 5, page * 5 + 5);
  const focusServiceId = focusedServiceId || hoveredServiceId;
  const highlightedIds = focusServiceId ? [focusServiceId] : mapHighlightedIds;
  const selectedHistory = useMemo(() => analysis.history.filter(point => point.serviceId === selectedId), [analysis.history, selectedId]);
  const selectedRange = useMemo(() => collectionRange(selectedHistory), [selectedHistory]);
  const comparisonLatest = tab === "comparar" && params.get("comparacao") === "ultima";
  const comparedIds = params.getAll("app");
  const summaryServices = tab === "comparar" ? services.filter(service => comparedIds.includes(service.id)) : services;
  const summaryHistory = tab === "comparar" ? (comparisonLatest ? latestHistory : history).filter(point => comparedIds.includes(point.serviceId)) : latestOverview ? latestHistory : history;
  const summaryRange = useMemo(() => collectionRange(summaryHistory), [summaryHistory]);
  const lastCollectionDate = summaryRange.last;
  const formatDate = (value: string | number) => new Date(value).toLocaleString("pt-BR");
  const refreshHelp = "A página consulta os dados salvos a cada 30 segundos enquanto está visível. Esta seta antecipa a consulta; não inicia uma nova coleta no servidor.";
  const shownRange = selected ? selectedRange : tab === "comparar" || latestOverview ? summaryRange : { first: analysis.availableSince, last: analysis.availableUntil };

  useEffect(() => {
    if (!refreshIcon.current) return;
    const controller = createRefreshAnimation(refreshIcon.current);
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => controller.setReducedMotion(preference.matches);
    animation.current = controller;
    updateMotion();
    preference.addEventListener("change", updateMotion);
    return () => {
      preference.removeEventListener("change", updateMotion);
      controller.dispose();
      animation.current = null;
    };
  }, [tab, selectedId]);
  useEffect(() => {
    animation.current?.setLoading(loading);
  }, [loading, tab, selectedId]);
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
    departingPanels.current();
    setDetailEntryId(selectedId ? "" : id);
    if (!selectedId && typeof Element.prototype.animate === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const copies = [...document.querySelectorAll<HTMLElement>(".monitoring-main > .monitoring-heading:not(.detail-heading), .monitoring-main > .monitoring-tabs, .monitoring-overview > .monitoring-summary, .monitoring-overview > .monitoring-applications")].filter(panel => panel.getClientRects().length && Number(getComputedStyle(panel).opacity) > 0).map(panel => {
        const rect = panel.getBoundingClientRect();
        const copy = panel.cloneNode(true) as HTMLElement;
        for (const element of [copy, ...copy.querySelectorAll("[id]")]) element.removeAttribute("id");
        copy.inert = true;
        copy.setAttribute("aria-hidden", "true");
        copy.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;overflow:hidden;z-index:10;pointer-events:none;background:white;animation:none`;
        document.body.append(copy);
        const animation = copy.animate([{opacity:1,transform:"translateX(0)"},{opacity:0,transform:"translateX(-42px)"}], {duration:320,easing:"cubic-bezier(.4,0,1,1)",fill:"forwards"});
        void animation.finished.catch(() => {}).finally(() => copy.remove());
        return () => { animation.cancel(); copy.remove(); };
      });
      departingPanels.current = () => copies.forEach(remove => remove());
    }
    setHoveredServiceId(""); setFocusedServiceId(""); setMapHighlightedIds([]);
    update({ servico: id, detalhe: "" });
  }, [update, selectedId]);
  const back = () => { departingPanels.current(); update({ servico: "", detalhe: "" }); };
  const clearFilters = () => { setApplicationPage(0); setParams(clearMonitoringFilters(params.toString())); };
  const goLive = () => update({ instante: "", ate: "" });
  const discovering = snapshot.source !== "database" && !snapshot.observations?.length && !snapshot.discoveryUpdatedAt && !error;
  const filterButton = <SpecularButton size="lg" radius={26} tint="#ffffff" tintOpacity={0.04} textColor="#10b981" lineColor="#10b981" baseColor="#10b981" intensity={0.55} idleIntensity={0} shineSize={10} shineFade={90} thickness={1.2} glow={2} followMouse proximity={50} className="monitoring-filter-button" aria-expanded={filtersOpen} aria-controls="monitoring-filters" aria-haspopup="dialog" onClick={() => setFiltersOpen(!filtersOpen)}><ListFilter size={22} />Filtrar{(filtered || analysis.observedAt) && <span className="filter-indicator" aria-label="Filtros ativos" />}</SpecularButton>;
  const dataContext = (<section className="monitoring-data-context" aria-label="Período dos dados">
      <div><strong title={formatRecordedPeriod(shownRange.first, shownRange.last)}>{((loading || (!error && snapshot.historyIncluded === false && !comparisonLatest)) && !summaryHistory.length) || discovering ? "Consultando os registros da seleção…" : tab === "comparar" && !summaryServices.length ? "Selecione aplicações para comparar" : formatDataPeriod(shownRange.first, shownRange.last)}</strong><p>Estimativas de energia e carbono dos registros disponíveis.<InfoTooltip label="estimativas ambientais">Os valores são estimativas calculadas a partir do uso das aplicações, e não medições diretas de eletricidade ou CO₂ na atmosfera. CO₂e significa dióxido de carbono equivalente.</InfoTooltip></p></div>
      <span>{comparisonLatest ? "Uma leitura por aplicação" : <>Filtro: {period === "7d" ? "até 7 dias" : "até 24 horas"}{analysis.observedAt && " anteriores ao horário escolhido"}</>}</span>
    </section>);
  const detailHeading = (<div className="monitoring-heading detail-heading">
      <div className="monitoring-detail-toolbar">
        <button className="monitoring-back" onClick={back}><ArrowLeft size={18} />Voltar à lista</button>

      </div>
      <h1 ref={heading} tabIndex={-1}>{selectedCandidate?.name ?? "Aplicação não encontrada"}</h1>
      {selected && <p><CountryFlag country={selected.country} />{[selected.city, selected.region, selected.country].filter(Boolean).join(" · ") || "Localização não informada"} <span className="heading-separator">·</span> <ServiceStatus service={selected} /></p>}
      {selected && <ServiceReadingMeta service={selected} observedAt={analysis.observedAt} />}
        {selected && (
          <MonitoringTabs
            label="Informações da aplicação"
            value={detailTab === "evolucao" ? "evolucao" : "resumo"}
            tabs={[
              { value: "resumo", label: "Visão geral" },
              { value: "evolucao", label: "Histórico" },
            ]}
            onChange={value => update({ detalhe: value })}
          />
        )}
    </div>);
  return <>
    <TopographicSides key="topography" />
    <RegionMap key="persistent-globe" anchorElement={mapAnchor} detailView={Boolean(selected)}
      services={mapServices} allServices={analysis.environmentServices} selectedServiceId={selected?.id}
      onSelectService={openService} history={selected ? selectedHistory : history} lens={lens}
      highlightedServiceIds={highlightedIds} focusServiceId={selected ? undefined : focusServiceId}
      onHighlightServices={setMapHighlightedIds} rotationPaused={Boolean(selected)} />
    {selectedId ? (!selected ? detailHeading : null) : <div className="monitoring-heading">
      <div><h1>Monitoramento</h1></div>
      {!administration && !historicalView && <div className="monitoring-tools">
        <label className="monitoring-search"><Search size={21} aria-hidden="true" /><input type="search" aria-label="Buscar aplicação" placeholder="Buscar aplicação..." value={search} onChange={event => update({ busca: event.target.value }, true)} /></label>
        {filterButton}
      </div>}
    </div>}
    {showFilters && <FiltersDialog onClear={clearFilters} onClose={() => setFiltersOpen(false)}><div className="monitoring-filters">
      <section className="filter-group filter-group-location"><div className="filter-section-title"><Globe2 size={17} /><div><h3>Localização</h3><p>Encontre aplicações por país e região.</p></div></div>
      <div className="filter-select-field"><span>País</span><GlideSelect accentColor="#10b981" surfaceColor="#ffffff" highlightColor="#3f3f46" textColor="#000000" size="md" radius={12} menuWidth={180} placement="bottom" align="left" popDuration={180} glideDuration={400} rememberPosition showTags ariaLabel="País" value={params.get("pais") ?? ""} options={[{value:"",label:"Todos os países"},...countries.map(country => ({value:country,label:country}))]} onChange={value => update({pais:value,cidade:"",regiao:""})} /></div>
      <div className="filter-select-field"><span>Região</span><GlideSelect accentColor="#10b981" surfaceColor="#ffffff" highlightColor="#3f3f46" textColor="#000000" size="md" radius={12} menuWidth={180} placement="bottom" align="left" popDuration={180} glideDuration={400} rememberPosition showTags ariaLabel="Região" value={params.get("regiao") ?? ""} options={[{value:"",label:"Todas as regiões"},...regionOptions.map(service => ({value:service.regionCode!,label:[service.city,service.region].filter(Boolean).join(" · ") || service.regionCode!}))]} onChange={value => update({regiao:value,cidade:""})} /></div>
      </section><section className="filter-group"><div className="filter-section-title"><SlidersHorizontal size={17} /><div><h3>Estado do ambiente</h3><p>Escolha quais aplicações acompanhar.</p></div></div>
      <div className="filter-select-field filter-full-width"><span>Situação da aplicação</span><GlideSelect accentColor="#10b981" surfaceColor="#ffffff" highlightColor="#3f3f46" textColor="#000000" size="md" radius={12} menuWidth={180} placement="bottom" align="left" popDuration={180} glideDuration={400} rememberPosition showTags ariaLabel="Situação da aplicação" value={status} options={[{value:"",label:"Todas as situações"},...Object.entries(serviceStatusLabels).map(([value,label]) => ({value,label}))]} onChange={value => update({estado:value})} /></div>
      </section><section className="filter-group"><div className="filter-section-title"><Clock3 size={17} /><div><h3>Período e histórico</h3><p>Explore um momento anterior do ambiente.</p></div></div>
      <label>Consultar o passado até<input aria-label="Consultar o passado até" type="datetime-local" max={localDateTimeMax()} value={analysis.invalidDate ? "" : analysis.date} onChange={event => update({ ate: event.target.value })} /></label>
      </section>
      <div className="monitoring-filter-history"><h3>Escolher um horário anterior</h3>{session ? <ObservationTimeline loading={loading || (!error && snapshot.historyIncluded === false)} observations={snapshot.observations ?? []} selected={analysis.observedAt} onSelect={value => update({ instante: value, ate: "" }, true)} onLive={goLive} /> : <div className="filter-history-access"><LockKeyhole size={20} aria-hidden="true" /><div><strong>Seu histórico em um só lugar</strong><p>Entre para explorar a linha do tempo das coletas.</p><Link to={loginLocation("/dashboard?" + new URLSearchParams({...Object.fromEntries(params), painel: "historico"}).toString())}>Entrar para ver histórico</Link></div></div>}</div>
    </div><p className="monitoring-filter-note">Limpar filtros mantém o período escolhido.</p></FiltersDialog>}
    {!administration && <>
    {analysis.invalidDate && <p className="monitoring-notice" role="alert">Escolha uma data válida até o momento atual. <button onClick={goLive}>Voltar para agora</button></p>}
    {analysis.observationMissing && <p className="monitoring-notice" role="alert">Este instante não está disponível no histórico consultado. <button onClick={goLive}>Voltar para agora</button></p>}
    {error && !showFilters && <div className="monitoring-notice" role="alert"><p>{snapshot.services.length ? "A atualização falhou. Exibindo os últimos dados recebidos." : "Não foi possível consultar as aplicações."}</p><button onClick={() => void refresh()} disabled={loading}>{loading ? "Atualizando…" : "Tentar novamente"}</button><details><summary>Detalhes da conexão</summary><p>{error}</p></details></div>}
    {analysis.observedAt && <div className="monitoring-past-banner" role="status"><Clock3 size={18} aria-hidden="true" /><span>Você está consultando o passado: <strong>{stamp(analysis.observedAt)}</strong></span><button type="button" onClick={goLive}>Voltar para agora</button></div>}
    {snapshot.warning && <details className="monitoring-notice"><summary>Parte dos dados não pôde ser atualizada</summary>
      <p>{snapshot.warning}</p>
    </details>}
    </>}
    {!selectedId && <MonitoringTabs slidingIndicator label="Visualização do monitoramento" value={tab} tabs={[{ value: "geral", label: "Visão geral", mobileLabel: "Serviços" }, { value: "mapa", label: "Mapa", className: "mobile-map-tab" }, { value: "evolucao", label: "Evolução" }, { value: "comparar", label: "Comparar" }, { value: "administracao", label: "Administração", restricted: true }]} onChange={value => update({ aba: value === "geral" ? "" : value })} />}
    {!selectedId && !administration && tab === "comparar" && <MonitoringSummary context={dataContext} latest={comparisonLatest} services={summaryServices} history={summaryHistory} totals={summaryHistory === history ? analysis.totals : undefined} comparison={tab === "comparar"} loading={loading} onRefresh={() => void refresh()} />}
    <section key="monitoring-content" className="monitoring-view" id="monitoring-content" role="tabpanel" aria-label={selectedId ? "Detalhes da aplicação" : administration ? "Administração do ambiente" : tab === "comparar" ? "Comparação de aplicações" : tab === "evolucao" ? "Evolução do ambiente" : "Visão geral do ambiente"}>
      <div className={"monitoring-overview" + (selected ? " service-overview service-detail-layout" : "")} data-view={tab} hidden={selectedId ? !selected : tab === "evolucao" || tab === "comparar" || administration}>
        {!selectedId && latestOverview && (
          <MonitoringSummary hideStatusCounts latest services={summaryServices} history={summaryHistory} totals={summaryHistory === history ? analysis.totals : undefined} comparison={false} />
        )}
        {!selected && (
        <section className="monitoring-location" aria-label="Localização dos serviços">
          <div className="monitoring-map globe-anchor" ref={setMapAnchor}><div className="globe-stage" aria-hidden="true" /></div>
        </section>
        )}
        {selected ? (
          <section className="monitoring-service-summary">
            <ServiceDetailOverview until={analysis.observedAt || undefined} service={selected} services={mapServices} allServices={analysis.environmentServices}
              header={detailHeading} onMapAnchor={setMapAnchor} animateEntry={detailEntryId === selectedId} historyPanel={detailTab === "evolucao" ? <>{dataContext}<EvolutionPanel
                collectionEvents={analysis.collectionEvents}
                history={selectedHistory}
                services={[selected]}
                metric={metric}
                onMetric={value => update({ ordem: value })}
                period={period}
                onPeriod={value => update({ periodo: value })}
                mode={evolutionMode}
                onMode={value => update({ serie: value === "intervals" ? "intervalos" : "" })}
                compact
                loading={loading || (!error && snapshot.historyIncluded === false)}
                observedAt={analysis.observedAt}
                onOpenService={openService}
              /></> : undefined}
              history={selectedHistory} period={period} onSelectService={openService} />
          </section>
        ) : <section className="monitoring-applications">
            <div className="monitoring-section-heading">
              <div>
                <h2>Aplicações</h2>
              </div>
              <div className="monitoring-heading-controls">
                {tab !== "comparar" && (
                  <div className="monitoring-update">
                    <span role="status">
                      {lastCollectionDate !== null
                        ? "Dados coletados até " + formatDate(lastCollectionDate)
                        : loading
                        ? "Consultando registros…"
                        : "Ainda sem leituras nesta seleção"}
                    </span>
                    <button
                      type="button"
                      className="monitoring-refresh"
                      aria-label={loading ? "Consultando dados salvos" : "Consultar dados salvos"}
                      title={refreshHelp}
                      aria-description={refreshHelp}
                      aria-busy={loading}
                      disabled={loading}
                      onClick={() => void refresh()}
                    >
                      <RotateCw
                        ref={refreshIcon}
                        size={20}
                        aria-hidden="true"
                        className="monitoring-refresh-icon"
                      />
                    </button>
                  </div>
                )}
                <SortSelect value={metric} onChange={nextMetric => update({ ordem: nextMetric })} />
              </div>
            </div>
            <div className="monitoring-table-scroll" tabIndex={0} role="region" aria-label="Lista de aplicações">
              <table className="monitoring-app-table">
                <caption className="sr-only">Aplicações na seleção e estimativas da última coleta de cada aplicação.</caption>
                <thead className="sr-only">
                  <tr>
                    <th scope="col">Aplicação</th>
                    <th scope="col">{analysis.observedAt ? "Situação naquele horário" : "Situação atual"}</th>
                    <th scope="col">{metric === "energy" ? "Energia" : "CO₂e"} na última coleta</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleImpacts.map(({ service, value }, index) => {
                    const isExpanded = expandedServiceId === service.id;
                    return (
                      <tr
                        key={service.id}
                        className={`monitoring-app-card animated-list-item ${isExpanded ? "is-expanded" : ""}`}
                        style={{ animationDelay: `${index * 40}ms` }}
                        data-highlighted={highlightedIds.includes(service.id)}
                        data-expanded={isExpanded}
                        onMouseEnter={() => setHoveredServiceId(service.id)}
                        onMouseLeave={() => setHoveredServiceId("")}
                      >
                        <td className="monitoring-card-row-td" colSpan={3}>
                          <div
                            className="monitoring-card-header"
                            role="button"
                            tabIndex={0}
                            title={`Ver detalhes de ${service.name}`}
                            onClick={() => openService(service.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                openService(service.id);
                              }
                            }}
                          >
                            <div className="monitoring-card-toggle-col">
                              <button
                                type="button"
                                className="monitoring-card-toggle-btn"
                                aria-label={isExpanded ? `Recolher informações de ${service.name}` : `Mostrar informações adicionais de ${service.name}`}
                                aria-expanded={isExpanded}
                                title={isExpanded ? "Recolher informações" : "Mostrar informações adicionais"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedServiceId(isExpanded ? "" : service.id);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.stopPropagation();
                                  }
                                }}
                              >
                                <span className={`monitoring-card-chevron ${isExpanded ? "is-expanded" : ""}`} aria-hidden="true">
                                  <ChevronDown size={18} />
                                </span>
                              </button>
                            </div>

                            <div className="monitoring-card-name-col">
                              <button
                                id={"application-" + service.id}
                                type="button"
                                className="monitoring-card-name-btn"
                                onFocus={() => { if (!restoringListFocus.current) setFocusedServiceId(service.id); }}
                                onBlur={() => setFocusedServiceId("")}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openService(service.id);
                                }}
                              >
                                <CountryFlag country={service.country} />
                                <span className="monitoring-app-name-text">{service.name}</span>
                              </button>
                            </div>

                            <div className="monitoring-card-status-col">
                              <ServiceStatus service={service} />
                              {service.statusMessage && <small className="service-message">{service.statusMessage}</small>}
                            </div>

                            <div className="monitoring-card-metric-col" title={"Última coleta: " + stamp(service.lastCollectionAt)}>
                              <span className="monitoring-card-divider" aria-hidden="true" />
                              <span key={service.lastCollectionAt ?? service.id} className="monitoring-sample-value">
                                {formatNumber(value)}{value !== null && (metric === "energy" ? " kWh" : " g")}
                              </span>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="monitoring-card-accordion-body">
                              <div className="monitoring-card-meta-item">
                                <Calendar size={17} className="monitoring-card-meta-icon" aria-hidden="true" />
                                <div>
                                  <span className="monitoring-card-meta-label">Última atualização</span>
                                  <span className="monitoring-card-meta-value">{stamp(service.lastCollectionAt)}</span>
                                </div>
                              </div>

                              <div className="monitoring-card-meta-item">
                                <MapPin size={17} className="monitoring-card-meta-icon" aria-hidden="true" />
                                <div>
                                  <span className="monitoring-card-meta-label">Região</span>
                                  <span className="monitoring-card-meta-value">{[service.city, service.region, service.country].filter(Boolean).join(" · ") || "Localização não informada"}</span>
                                </div>
                              </div>

                              <ServiceTrendItem
                                service={service}
                                metric={metric}
                                period={period}
                                until={analysis.observedAt || undefined}
                                preloadedHistory={history}
                                isExpanded={isExpanded}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {services.length > 0 && <><nav className="monitoring-list-pagination" aria-label="Páginas das aplicações"><div className="monitoring-pagination-reading"><OperationalCounts services={services} /></div><div><button type="button" aria-label="Aplicações anteriores" disabled={page === 0} onClick={() => setApplicationPage(page - 1)}><ChevronLeft size={17} /></button><button type="button" aria-label="Próximas aplicações" disabled={page === lastPage} onClick={() => setApplicationPage(page + 1)}><ChevronRight size={17} /></button></div></nav></>}
            {!services.length && <MonitoringState kind={loading || discovering ? "loading" : error && !snapshot.services.length ? "offline" : filtered || analysis.environmentServices.length ? "filtered" : "empty"} onReset={clearFilters} />}
          </section>}
      </div>
      {selectedId ? !selected ? <p className="monitoring-empty" role="status">{selectedOutsideFilters ? <>Esta aplicação está fora dos filtros atuais. <button className="monitoring-text-button" onClick={clearFilters}>Limpar filtros</button> </> : "Esta aplicação não está no ambiente recebido. "}<button className="monitoring-text-button" onClick={back}>Voltar à lista</button></p> : null : tab === "evolucao" && <EvolutionPanel filterControl={filterButton} collectionEvents={analysis.collectionEvents} history={history} services={services} metric={metric} onMetric={value => update({ ordem: value })} period={period} onPeriod={value => update({ periodo: value })} mode={evolutionMode} onMode={value => update({ serie: value === "intervals" ? "intervalos" : "" })} loading={loading || (!error && snapshot.historyIncluded === false)} observedAt={analysis.observedAt} impacts={impacts} onOpenService={openService} />}
      {!selectedId && tab === "comparar" && <ComparisonPanel onOpenService={openService} />}
      {administration && <AdministrationAccess><AdministrationPanel /></AdministrationAccess>}
    </section>
  </>;
}
