import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, ChevronDown, ListFilter, Search, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { RegionMap } from "../components/map/RegionMap";
import { MonitoringTabs } from "../components/MonitoringTabs";
import { HistoryChart } from "../components/HistoryChart";
import { useMonitoring } from "../hooks/useMonitoring";
import { useAnalysis } from "../hooks/useAnalysis";
import { applicationImpacts, filterApplications, statusColors } from "../domain/dashboard";
import type { DashboardMetric } from "../domain/dashboard";
import { summarizeCollections } from "../domain/history";
import { serviceStatusLabels } from "../types";
import type { CollectionPoint, MonitoredService } from "../types";
import { formatNumber } from "@/shared/lib/format";

const clock = (value?: string | null) => value ? new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—";
const stamp = (value?: string | null) => value ? new Date(value).toLocaleString("pt-BR") : "Ainda não realizada";

function ServiceStatus({ service }: { service: MonitoredService }) {
  return <span className="monitoring-status"><i style={{ background: statusColors[service.status] }} />{serviceStatusLabels[service.status]}</span>;
}

function SessionSummary({ history, services, filtered }: { history: CollectionPoint[]; services: MonitoredService[]; filtered: boolean }) {
  const totals = summarizeCollections(history);
  const covered = new Set(history.filter(point => point.emissionsG !== null).map(point => point.serviceId)).size;
  const timestamps = history.map(point => Date.parse(point.collectedAt)).filter(Number.isFinite);
  const first = timestamps.reduce((value, time) => Math.min(value, time), Infinity);
  const last = timestamps.reduce((value, time) => Math.max(value, time), -Infinity);
  const incomplete = totals.emissionCount < totals.count || covered < services.length;
  return <footer className="monitoring-summary">
    <strong>Estimativas {filtered ? "da seleção" : "da sessão"}: {formatNumber(totals.energyKwh)} kWh e {formatNumber(totals.emissionsG)} g CO₂e.</strong>
    <div><p>{timestamps.length ? "Amostras de " + stamp(new Date(first).toISOString()) + " a " + clock(new Date(last).toISOString()) : "Aguardando as primeiras amostras."} · {covered} de {services.length} serviços com estimativas de emissão.</p>
      {incomplete && <p className="monitoring-caution"><i />Há serviços com dados incompletos.</p>}</div>
    <details><summary>Sobre estas estimativas</summary><p>Histórico disponível nesta sessão, limitado ao período selecionado. Recarregar a página reinicia o histórico local. Os totais somam as estimativas das amostras recebidas; os intervalos podem se sobrepor. Emissões sem fator de carbono ficam ausentes, sem serem tratadas como zero.</p></details>
  </footer>;
}

export function DashboardPage() {
  const { snapshot, loading, error, refresh, period } = useMonitoring();
  const analysis = useAnalysis();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 680px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 680px)");
    const change = (event: MediaQueryListEvent) => setMobile(event.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousSelection = useRef("");
  const selectedId = params.get("servico") ?? "";
  const selected = snapshot.services.find(service => service.id === selectedId);
  const search = params.get("busca") ?? "";
  const status = params.get("estado") ?? "";
  const metric: DashboardMetric = params.get("ordem") === "energy" ? "energy" : "emissions";
  const tab = params.get("aba") === "evolucao" ? "evolucao" : params.get("aba") === "mapa" && mobile ? "mapa" : "geral";
  const detailTab = ["recursos", "evolucao"].includes(params.get("detalhe") ?? "") ? params.get("detalhe")! : "resumo";
  const filtered = Boolean(search || status || analysis.regional || analysis.date || period !== "24h");
  const update = (values: Record<string, string>, replace = false) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value); else next.delete(key);
    }
    setParams(next, { replace });
  };
  const services = useMemo(() => filterApplications(analysis.services, search, status), [analysis.services, search, status]);
  const ids = useMemo(() => new Set(services.map(service => service.id)), [services]);
  const history = useMemo(() => analysis.history.filter(point => ids.has(point.serviceId)), [analysis.history, ids]);
  const impacts = useMemo(() => applicationImpacts(services, history, metric), [services, history, metric]);
  const selectedHistory = useMemo(() => analysis.history.filter(point => point.serviceId === selectedId), [analysis.history, selectedId]);
  const countries = [...new Set(snapshot.services.map(service => service.country).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const regionOptions = [...new Map(snapshot.services.filter(service => service.regionCode && (!analysis.country || service.country === analysis.country)).map(service => [service.regionCode!, service])).values()];
  useEffect(() => {
    if (selectedId) {
      heading.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    } else if (previousSelection.current) {
      document.getElementById("application-" + previousSelection.current)?.focus({ preventScroll: true });
    }
    previousSelection.current = selectedId;
  }, [selectedId]);
  const openService = (id: string) => update({ servico: id, detalhe: "" });
  const back = () => update({ servico: "", detalhe: "" });
  return <>
    {selectedId ? <div className="monitoring-heading detail-heading">
      <button className="monitoring-back" onClick={back}><ArrowLeft size={18} />Voltar à lista</button>
      <h1 ref={heading} tabIndex={-1}>{selected?.name ?? "Aplicação não encontrada"}</h1>
      {selected && <p>{[selected.city, selected.region, selected.country].filter(Boolean).join(" · ") || "Localização não informada"} <span className="heading-separator">·</span> <ServiceStatus service={selected} /></p>}
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
      <button className="monitoring-text-button" onClick={() => update({ busca: "", estado: "", pais: "", cidade: "", regiao: "", ate: "", periodo: "24h" })}><X size={16} />Limpar filtros</button>
    </div>}
    {analysis.invalidDate && <p className="monitoring-notice" role="alert">A data na URL é inválida. <button onClick={() => update({ ate: "" })}>Voltar para agora</button></p>}
    {error && <div className="monitoring-notice" role="alert"><p>{snapshot.services.length ? "A atualização falhou. Exibindo os últimos dados recebidos." : "Não foi possível consultar as aplicações."}</p><button onClick={() => void refresh()} disabled={loading}>{loading ? "Atualizando…" : "Tentar novamente"}</button><details><summary>Detalhes da conexão</summary><p>{error}</p></details></div>}
    {snapshot.warning && <details className="monitoring-notice"><summary>Há informações indisponíveis nesta consulta</summary><p>{snapshot.warning}</p></details>}
    {selectedId ? selected ? <>
      <MonitoringTabs label="Informações da aplicação" value={detailTab} tabs={[{ value: "resumo", label: "Resumo" }, { value: "recursos", label: "Recursos" }, { value: "evolucao", label: "Evolução" }]} onChange={value => update({ detalhe: value })} />
      <section id="monitoring-content" role="tabpanel" aria-label={"Aplicação · " + detailTab}>
        {detailTab === "resumo" ? <div className="monitoring-overview service-overview">
          <section className="monitoring-location"><h2>Localização do serviço</h2><RegionMap services={[selected]} selectedServiceId={selected.id} onSelectService={openService} /></section>
          <section className="monitoring-service-summary"><h2>Impacto nas amostras</h2><dl className="monitoring-facts">
            <div><dt>Energia estimada</dt><dd>{formatNumber(summarizeCollections(selectedHistory).energyKwh)} <small>kWh</small></dd></div>
            <div><dt>Emissões estimadas</dt><dd>{formatNumber(summarizeCollections(selectedHistory).emissionsG)} <small>g CO₂e</small></dd></div>
            <div><dt>Última coleta</dt><dd className="fact-text">{stamp(selected.lastCollectionAt)}</dd></div>
            <div><dt>Intensidade de carbono</dt><dd className="fact-text">{formatNumber(selected.carbonIntensity ?? null)} g CO₂e/kWh</dd></div>
          </dl>{selected.statusMessage && <p className="service-message">{selected.statusMessage}</p>}</section>
        </div> : detailTab === "recursos" ? <section className="monitoring-resources"><div className="monitoring-section-heading"><h2>Recursos da última coleta</h2><span>{stamp(selected.lastCollectionAt)}</span></div>
          <dl className="monitoring-resource-list">{[
            ["CPU", selected.cpuPercent, "%"], ["Memória", selected.memoryGb, "GB"], ["Disco", selected.diskGb, "GB"], ["Rede", selected.networkGb, "GB"], ["Intervalo da amostra", selected.collectionIntervalSeconds ?? null, "s"],
          ].map(([label, value, unit]) => <div key={String(label)}><dt>{label}</dt><dd>{formatNumber(value as number | null)} <span>{unit}</span></dd></div>)}</dl><p className="monitoring-explanation">Valores ausentes são exibidos como “—”. Métricas antigas preservam o estado de desatualização da aplicação.</p>
        </section> : <Evolution history={selectedHistory} metric={metric} onMetric={value => update({ ordem: value })} period={period} onPeriod={value => update({ periodo: value })} />}
      </section>
      <SessionSummary history={selectedHistory} services={[selected]} filtered={filtered} />
    </> : <p className="monitoring-empty">Esta aplicação não está no ambiente recebido. <button className="monitoring-text-button" onClick={back}>Voltar à lista</button></p> : <>
      <MonitoringTabs label="Visualização do monitoramento" value={tab} tabs={[{ value: "geral", label: "Visão geral", mobileLabel: "Serviços" }, { value: "mapa", label: "Mapa", className: "mobile-map-tab" }, { value: "evolucao", label: "Evolução" }]} onChange={value => update({ aba: value === "geral" ? "" : value })} />
      <section id="monitoring-content" role="tabpanel" aria-label={tab === "evolucao" ? "Evolução do ambiente" : "Visão geral do ambiente"}>
        {tab === "evolucao" ? <Evolution history={history} metric={metric} onMetric={value => update({ ordem: value })} period={period} onPeriod={value => update({ periodo: value })} cumulative /> : <div className="monitoring-overview" data-view={tab}>
          <section className="monitoring-location" aria-label="Localização dos serviços"><RegionMap services={services} onSelectService={openService} /></section>
          <section className="monitoring-applications"><div className="monitoring-section-heading"><h2>Aplicações</h2><label className="monitoring-sort">Ordenar:<select aria-label="Ordenar aplicações" value={metric} onChange={event => update({ ordem: event.target.value })}><option value="emissions">Emissões</option><option value="energy">Energia</option></select><ChevronDown size={17} aria-hidden="true" /></label></div>
            {filtered && <p className="monitoring-filter-count" aria-live="polite">{services.length} de {snapshot.services.length} serviços nesta seleção</p>}
            <div className="monitoring-table-scroll">
              <table className="monitoring-app-table"><thead><tr><th scope="col">Aplicação</th><th scope="col">Estado atual</th><th scope="col">{metric === "energy" ? "Energia" : "CO₂e"} {filtered ? "no período" : "na sessão"}</th></tr></thead>
                <tbody>{impacts.map(({ service, value, summary }) => <tr key={service.id}><td><button id={"application-" + service.id} onClick={() => openService(service.id)}>{service.name}<ArrowUpRight size={15} aria-hidden="true" /></button></td><td><ServiceStatus service={service} /></td><td title={metric === "emissions" && summary.emissionCount < summary.count ? "Faltam fatores de carbono para completar as emissões deste serviço." : undefined}>{formatNumber(value)}{value !== null && (metric === "energy" ? " kWh" : " g")}</td></tr>)}</tbody>
              </table>
            </div>
            {!services.length && <div className="monitoring-empty" role="status">{loading ? "Descobrindo aplicações…" : snapshot.services.length ? "Nenhuma aplicação corresponde aos filtros." : error ? "A lista aparecerá quando a conexão for restabelecida." : "Nenhuma aplicação encontrada no ambiente."}</div>}
          </section>
        </div>}
      </section>
      <SessionSummary history={history} services={services} filtered={filtered} />
      <p className="monitoring-update" aria-live="polite">{snapshot.services.length} {snapshot.services.length === 1 ? "serviço encontrado" : "serviços encontrados"} · {loading && !snapshot.discoveryUpdatedAt ? "consultando ambiente…" : snapshot.discoveryUpdatedAt ? "última atualização às " + clock(snapshot.discoveryUpdatedAt) : "aguardando primeira consulta"}</p>
    </>}
  </>;
}

function Evolution({ history, metric, onMetric, period, onPeriod, cumulative = false }: {
  history: CollectionPoint[]; metric: DashboardMetric; onMetric: (metric: string) => void;
  period: string; onPeriod: (period: string) => void; cumulative?: boolean;
}) {
  return <section className="monitoring-evolution"><div className="monitoring-section-heading"><div><h2>Evolução {cumulative ? "do ambiente" : "da aplicação"}</h2><p>Somente as amostras registradas nesta sessão.</p></div><div className="evolution-controls"><label>Métrica<select value={metric} onChange={event => onMetric(event.target.value)}><option value="emissions">Emissões</option><option value="energy">Energia</option></select></label><label>Período<select value={period} onChange={event => onPeriod(event.target.value)}><option value="24h">Até 24 horas</option><option value="7d">Até 7 dias</option></select></label></div></div><HistoryChart history={history} metric={metric} cumulative={cumulative} /></section>;
}
