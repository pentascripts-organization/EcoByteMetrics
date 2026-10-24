import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMonitoring } from "../hooks/useMonitoring";
import { useAnalysis } from "../hooks/useAnalysis";
import { analysisLink } from "../domain/analysis";
import { compareApplications } from "../domain/comparison";
import { CountryFlag } from "@/shared/ui/CountryFlag";
import { formatNumber } from "@/shared/lib/format";
import { serviceStatusLabels } from "../types";
import { MonitoringSummary } from "../components/MonitoringSummary";
import { TopographicSides } from "../components/TopographicSides";

export function ComparisonPage() {
  const analysis = useAnalysis();
  const { snapshot, loading, error, refresh, period } = useMonitoring();
  const [params, setParams] = useSearchParams();
  const ids = [...new Set(params.getAll("app"))];
  const rows = useMemo(() => compareApplications(analysis.services, analysis.history, params.getAll("app"), analysis.windowStart, analysis.windowEnd), [analysis, params]);
  const missing = ids.filter(id => !analysis.services.some(service => service.id === id));
  const changeSelection = (id: string, checked: boolean) => {
    const next = new URLSearchParams(params);
    next.delete("app");
    for (const value of checked ? [...ids, id] : ids.filter(value => value !== id)) next.append("app", value);
    setParams(next);
  };
  const formatDate = (value: number | null) => value === null ? "—" : new Date(value).toLocaleString("pt-BR");
  return <>
    <TopographicSides />
    <div className="monitoring-heading"><div><h1>Comparar aplicações</h1></div></div>
    <div className="comparison-toolbar">
      <Link className="monitoring-text-button" to={analysisLink("/dashboard", params.toString())}>Voltar ao monitoramento</Link>
      <label>Período<select value={period} onChange={event => { const next = new URLSearchParams(params); next.set("periodo", event.target.value); setParams(next); }}><option value="24h">Até 24 horas</option><option value="7d">Até 7 dias</option></select></label>
    </div>
    {error && <p className="monitoring-notice" role="alert">A atualização falhou. Os dados anteriores foram preservados. <button onClick={() => void refresh()} disabled={loading}>Tentar novamente</button></p>}
    {analysis.warning && <details className="monitoring-notice"><summary>Há dados indisponíveis</summary><p>{analysis.warning}</p></details>}
    {analysis.invalidDate && <p role="alert" className="monitoring-notice">A data selecionada é inválida. Volte ao monitoramento para ajustar o filtro.</p>}
    {analysis.observationMissing && <p role="alert" className="monitoring-notice">O instante selecionado não está mais disponível nesta sessão.</p>}
    <MonitoringSummary services={analysis.services} history={analysis.history} periodLabel={analysis.periodLabel} refreshedAt={snapshot.refreshedAt} lastCollectionAt={snapshot.lastCollectionAt} observedAt={analysis.observedAt} loading={loading} onRefresh={() => void refresh()} />
    <section className="comparison-content" aria-labelledby="comparison-selection">
      <h2 id="comparison-selection">Selecione duas ou mais aplicações</h2>
      <p className="monitoring-explanation">A comparação usa as amostras desta sessão e mantém os filtros do monitoramento{analysis.selection ? ": " + analysis.selection : "."}.</p>
      <fieldset className="comparison-selection"><legend className="sr-only">Aplicações para comparar</legend>
        {analysis.services.map(service => <label key={service.id}><input type="checkbox" checked={ids.includes(service.id)} onChange={event => changeSelection(service.id, event.target.checked)} /><CountryFlag country={service.country} /><span>{service.name}<small>{serviceStatusLabels[service.status]}</small></span></label>)}
      </fieldset>
      {!analysis.services.length && <p className="monitoring-empty">{loading ? "Consultando aplicações…" : "Nenhuma aplicação disponível nesta seleção. Ajuste os filtros no monitoramento."}</p>}
      {missing.length > 0 && <p className="monitoring-notice" role="status">{missing.length} seleção(ões) não está(ão) disponível(is) nos filtros atuais. <button onClick={() => { const next = new URLSearchParams(params); next.delete("app"); for (const id of ids.filter(id => !missing.includes(id))) next.append("app", id); setParams(next); }}>Remover seleções indisponíveis</button></p>}
      {rows.length < 2 ? <p className="monitoring-empty">Selecione pelo menos duas aplicações para consultar a tabela.</p> : <>
        <p className="comparison-range">Mesmo intervalo de consulta: {formatDate(analysis.windowStart)} até {formatDate(analysis.windowEnd)}.</p>
        <div className="monitoring-table-scroll" role="region" aria-label="Comparação das aplicações" tabIndex={0}>
          <table className="comparison-table"><caption>Estimativas das amostras disponíveis · {analysis.periodLabel}</caption>
            <thead><tr><th scope="col">Aplicação</th><th scope="col">Estado</th><th scope="col">Energia (kWh)</th><th scope="col">Emissões (g CO₂e)</th><th scope="col">Amostras com emissão</th><th scope="col">Duração somada (s)</th><th scope="col">Primeira / última amostra</th></tr></thead>
            <tbody>{rows.map(row => <tr key={row.service.id}><th scope="row"><Link to={(() => { const next = new URLSearchParams(params); next.set("servico", row.service.id); return "/dashboard?" + next; })()}>{row.service.name}</Link></th><td>{serviceStatusLabels[row.service.status]}</td><td>{formatNumber(row.energyKwh)}</td><td>{formatNumber(row.emissionsG)}</td><td>{row.emissionCount} / {row.count}</td><td>{formatNumber(row.seconds)}</td><td>{formatDate(row.first)}<br />{formatDate(row.last)}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="monitoring-explanation">As aplicações podem ter quantidades e durações de amostras diferentes. Um total menor não indica maior eficiência. “—” indica ausência de dados ou emissões incompletas. O histórico persistido ainda depende da integração com o backend.</p>
      </>}
    </section>
  </>;
}
