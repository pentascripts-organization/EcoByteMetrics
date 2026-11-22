import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, ChartNoAxesCombined, ChevronDown, X } from "lucide-react";
import { useMonitoring } from "../hooks/useMonitoring";
import { useAnalysis } from "../hooks/useAnalysis";
import { compareApplications } from "../domain/comparison";
import { comparisonSeries } from "../domain/comparisonSeries";
import { normalizeApplicationSearch } from "../domain/dashboard";
import { CountryFlag } from "@/shared/ui/CountryFlag";
import { formatNumber, formatRecordedPeriod } from "@/shared/lib/format";
import { collectionRange } from "../domain/history";
import { serviceStatusLabels } from "../types";
import "../styles/comparison.css";

const ComparisonPairedChart = lazy(() =>
  import("./ComparisonPairedChart").then(module => ({ default: module.ComparisonPairedChart })),
);

export function ComparisonPanel({ onOpenService }: { onOpenService: (id: string) => void }) {
  const analysis = useAnalysis();
  const { loading, snapshot, error, period } = useMonitoring();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const picker = useRef<HTMLButtonElement>(null);
  const numbersButton = useRef<HTMLButtonElement>(null);
  const latest = params.get("comparacao") === "ultima";
  const numbers = params.get("comparacaoVisao") === "numeros";
  const metric = params.get("comparacaoIndicador") === "co2e" ? "emissionsG" : "energyKwh";
  const ids = useMemo(() => [...new Set(params.getAll("app").filter(Boolean))], [params]);
  const selected = useMemo(() => {
    const services = new Map(analysis.services.map(service => [service.id, service]));
    return ids.flatMap(id => services.get(id) ?? []);
  }, [ids, analysis.services]);
  const selectedIds = useMemo(() => selected.map(service => service.id), [selected]);
  const rows = useMemo(() => compareApplications(selected, analysis.history, selectedIds, analysis.windowStart, analysis.windowEnd, latest),
    [selected, selectedIds, analysis.history, analysis.windowStart, analysis.windowEnd, latest]);
  const timeline = useMemo(() => latest || numbers || !selectedIds.length ? null :
    comparisonSeries(analysis.history, selectedIds, analysis.windowStart, analysis.windowEnd),
    [latest, numbers, analysis.history, selectedIds, analysis.windowStart, analysis.windowEnd]);
  const awaitingHistory = !latest && (loading || (!error && snapshot.historyIncluded === false)) && !analysis.history.length;
  const missingCount = ids.length - selected.length;
  const query = normalizeApplicationSearch(search.trim());
  const matches = analysis.services.filter(service =>
    [service.name, service.country, service.city].some(value => value && normalizeApplicationSearch(value).includes(query)));
  const formatDate = (value: number | null) => value === null ? "Indisponível" : new Date(value).toLocaleString("pt-BR");
  const formatValue = (value: number | null) => value === null ? "Indisponível" : formatNumber(value);
  const update = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };
  const select = (values: string[]) => {
    const next = new URLSearchParams(params);
    next.delete("app");
    for (const id of new Set(values)) next.append("app", id);
    setParams(next);
  };
  const pick = () => { setPickerOpen(true); picker.current?.focus(); };
  const carbon = (row: (typeof rows)[number]) => <>
    {formatValue(row.emissionsG === null ? null : row.emissionsG / 1000)}
    {!latest && row.count > row.emissionCount && <small> · {row.emissionCount === 0 ? "Sem cálculo" : "Parcial"} ({row.emissionCount} de {row.count} amostras)</small>}
  </>;
  const range = numbers && !latest ? collectionRange(analysis.history.filter(point => selectedIds.includes(point.serviceId))) : null;

  return <section className="comparison-content" aria-labelledby="comparison-selection">
    <header className="comparison-intro">
      <div><h2 id="comparison-selection">Comparar aplicações</h2><p>Analise os mesmos indicadores em diferentes aplicações, no mesmo período.</p></div>
      <div className="evolution-segmented" role="group" aria-label="Visualização da comparação">
        <button type="button" aria-pressed={!numbers} onClick={() => update("comparacaoVisao")}>Gráficos</button>
        <button ref={numbersButton} type="button" aria-pressed={numbers} onClick={() => update("comparacaoVisao", "numeros")}>Números</button>
      </div>
    </header>

    <div className="comparison-controls">
      <div className="comparison-picker">
        <span className="comparison-count-badge" role="status">Aplicações selecionadas · {selected.length}</span>
        <div className="comparison-chips-container" aria-label="Aplicações selecionadas">
          {selected.map(service => <span key={service.id} className="comparison-chip">
            <CountryFlag country={service.country} /><span>{service.name}</span>
            <button type="button" onClick={() => { select(ids.filter(id => id !== service.id)); picker.current?.focus(); }}
              aria-label={"Remover " + service.name + " da comparação"}><X size={14} /></button>
          </span>)}
          <button ref={picker} className="comparison-link comparison-picker-toggle" type="button" aria-controls="comparison-options" aria-expanded={pickerOpen}
            disabled={!analysis.services.length} onClick={() => setPickerOpen(!pickerOpen)}>
            {selected.length ? "Alterar seleção" : "Selecionar aplicações"} <ChevronDown size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="comparison-settings">
        {!numbers && <div className="evolution-segmented" role="group" aria-label="Indicador">
          <button type="button" aria-pressed={metric === "energyKwh"} onClick={() => update("comparacaoIndicador")}>Energia</button>
          <button type="button" aria-pressed={metric === "emissionsG"} onClick={() => update("comparacaoIndicador", "co2e")}>CO₂e</button>
        </div>}
        <label className="comparison-period">
          <span className="sr-only">Dados da comparação</span>
          <select aria-label="Dados da comparação" value={latest ? "ultima" : "total"} onChange={event => update("comparacao", event.target.value === "ultima" ? "ultima" : undefined)}>
            <option value="total">Total no período</option><option value="ultima">Última coleta</option>
          </select>
        </label>
        {!latest && <label className="comparison-period">
          <select aria-label="Período da comparação" value={period} onChange={event => update("periodo", event.target.value)}>
            <option value="24h">Até 24 horas</option><option value="7d">Até 7 dias</option>
          </select>
        </label>}
      </div>
    </div>

    <div id="comparison-options" className="comparison-options" hidden={!pickerOpen} onKeyDown={event => {
      if (event.key === "Escape") { setPickerOpen(false); picker.current?.focus(); }
    }}>
      <div className="comparison-search-row">
        <input type="search" value={search} placeholder="Buscar por nome, cidade ou país" aria-label="Buscar aplicação para comparar" onChange={event => setSearch(event.target.value)} />
        <button type="button" className="comparison-link" disabled={!matches.some(service => !ids.includes(service.id))}
          onClick={() => select([...ids, ...matches.map(service => service.id)])}>Selecionar visíveis</button>
        <button type="button" className="comparison-link" disabled={!ids.length} onClick={() => select([])}>Limpar seleção</button>
        <button type="button" className="comparison-link" onClick={() => { setPickerOpen(false); picker.current?.focus(); }}>Concluir</button>
      </div>
      <fieldset className="comparison-selection"><legend className="sr-only">Aplicações para comparar</legend>
        {matches.map(service => <label key={service.id}>
          <input type="checkbox" checked={ids.includes(service.id)} onChange={event => select(event.target.checked ? [...ids, service.id] : ids.filter(id => id !== service.id))} />
          <CountryFlag country={service.country} /><span>{service.name}<small>{serviceStatusLabels[service.status]}</small></span>
        </label>)}
      </fieldset>
      {!matches.length && <p role="status">Nenhuma aplicação encontrada.</p>}
    </div>

    {missingCount > 0 && !loading && <p className="comparison-notice" role="status">
      {missingCount} fora dos filtros atuais ou indisponíveis no catálogo.{" "}
      <button type="button" className="comparison-link" onClick={() => select(selectedIds)}>Remover seleções indisponíveis</button>
    </p>}

    <div className="comparison-results">
      {!rows.length ? <div className="comparison-empty" role={loading || error ? "status" : undefined}>
        <ChartNoAxesCombined size={38} aria-hidden="true" />
        <h3>{loading ? "Consultando aplicações…" : error && !analysis.services.length ? "Aplicações indisponíveis" : analysis.services.length ?
          "Selecione duas ou mais aplicações para começar a comparação" : "Nenhuma aplicação disponível"}</h3>
        {!loading && analysis.services.length > 0 && <button type="button" className="comparison-button" onClick={pick}>Escolher aplicações</button>}
        {!loading && !analysis.services.length && <p>{error ? "Tente atualizar a consulta quando a conexão voltar." : "Ajuste os filtros para encontrar aplicações."}</p>}
      </div> : awaitingHistory ? <p className="monitoring-empty" role="status">Consultando as leituras para comparação…</p> : <>
        {numbers && rows.length === 1 && <p className="comparison-notice" role="status">Selecione mais uma aplicação para comparar.</p>}
        {numbers ? <>
          <header className="comparison-result-heading"><div><h3>Comparação numérica</h3><p>{range ? formatRecordedPeriod(range.first, range.last) : "Horários e durações de coleta podem variar."}</p></div></header>
          <div className="monitoring-table-scroll comparison-numbers" role="region" aria-label="Indicadores lado a lado" tabIndex={0}>
            <table>
              <caption>{latest ? "Última leitura por aplicação" : "Totais e médias das leituras disponíveis · " + analysis.periodLabel}</caption>
              <thead><tr><th scope="col">Indicador</th>{rows.map(({ service }) => <th scope="col" key={service.id}>
                <button type="button" className="comparison-link" onClick={() => onOpenService(service.id)}><CountryFlag country={service.country} /> {service.name}</button>
              </th>)}</tr></thead>
              <tbody>{([
                ["Situação", rows.map(row => serviceStatusLabels[row.service.status])],
                ["Energia (kWh)", rows.map(row => formatValue(row.energyKwh))],
                ["Emissões (kg CO₂e)", rows.map(carbon)],
                [latest ? "CPU (%)" : "CPU média (%)", rows.map(row => formatValue(row.resources.cpuPercent))],
                [latest ? "Memória (GB)" : "Memória média (GB)", rows.map(row => formatValue(row.resources.memoryGb))],
                [latest ? "Rede (GB)" : "Rede média (GB)", rows.map(row => formatValue(row.resources.networkGb))],
                ["Amostras", rows.map(row => row.count)],
                ["Amostras com emissões", rows.map(row => row.emissionCount)],
                ...(latest ? [["Duração da coleta (s)", rows.map(row => row.count ? formatValue(row.service.collectionIntervalSeconds ?? null) : "Indisponível")] as const] : []),
                [latest ? "Coletada em" : "Última coleta no período", rows.map(row => formatDate(row.last))],
              ] as const).map(([label, values]) => <tr key={label}><th scope="row">{label}</th>
                {values.map((value, index) => <td key={rows[index]!.service.id}>{value}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </> : <>
          <Suspense fallback={<p role="status">Carregando gráficos…</p>}>
            <ComparisonPairedChart rows={rows} timeline={timeline} latest={latest} metric={metric} onOpenService={onOpenService} onPick={pick} />
          </Suspense>
          <footer className="comparison-result-heading comparison-footer">
            <div><h3>Comparação numérica</h3><p>Totais, médias, emissões e cobertura das aplicações selecionadas.</p></div>
            <button type="button" className="comparison-button" onClick={() => { update("comparacaoVisao", "numeros"); numbersButton.current?.focus(); }}>Ver indicadores detalhados <ArrowRight size={16} /></button>
          </footer>
        </>}
      </>}
    </div>
  </section>;
}
