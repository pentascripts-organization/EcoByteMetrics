import { Activity, CalendarDays, Clock3, Database, Globe2, Leaf, Server, Zap } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState, MetricCard, PageHeading, Panel, TrendChart } from '../components/UI';
import { RegionMap } from '../components/RegionMap';
import { formatNumber } from '../utils/format';
import { analysisLink } from '../utils/analysis';
import { useMonitoring } from '../hooks/useMonitoring';
import { useAnalysis } from '../hooks/useAnalysis';

export function DashboardPage() {
  const { snapshot, demoMode, error, loading } = useMonitoring();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { services, history, regions, country, city, date, invalidDate, regional, selection, totals: coverage } = useAnalysis();
  const energy = coverage.energyKwh;
  const emissions = coverage.emissionsG;
  const setDate = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set('ate', value); else next.delete('ate');
    setParams(next, { replace: true });
  };
  const selectCountry = (name: string) => {
    const next = new URLSearchParams(params);
    for (const key of ['pais', 'cidade', 'regiao']) next.delete(key);
    if (name) next.set('pais', name);
    setParams(next);
  };
  const lastCollection = history.reduce<string | null>((latest, point) => latest === null || Date.parse(point.collectedAt) > Date.parse(latest) ? point.collectedAt : latest, null);
  const active = services.filter((service) => service.status === 'available').length;
  const metricFields = ['cpuPercent', 'memoryGb', 'diskGb', 'networkGb'] as const;
  const metricCount = services.reduce((sum, service) => sum + metricFields.filter((field) => service[field] !== null).length, 0);
  const renewables = regions.map((region) => region.renewablePercent);
  const renewable = renewables.length ? renewables.reduce((sum, value) => sum + value, 0) / renewables.length : null;
  const categories = [
    { label: 'Disponíveis', count: active, color: '#087d62' },
    { label: 'Sem métricas', count: services.filter((service) => service.status === 'no-metrics').length, color: '#408abc' },
    { label: 'Indisponíveis', count: services.filter((service) => service.status === 'unavailable').length, color: '#8acdaf' },
    { label: 'Removidos', count: services.filter((service) => service.status === 'removed').length, color: '#acbaba' },
  ];
  let offset = 0;
  const stops = categories.map((category) => {
    const start = offset;
    offset += services.length ? category.count / services.length * 100 : 0;
    return `${category.color} ${start}% ${offset}%`;
  });
  const collections = new Map<string, number>();
  for (const point of history) collections.set(point.collectedAt, (collections.get(point.collectedAt) ?? 0) + point.energyKwh);
  const ranking = [...collections].map(([collectedAt, energyKwh]) => ({ collectedAt, energyKwh })).sort((a, b) => b.energyKwh - a.energyKwh).slice(0, 5);
  return <>
    <PageHeading title="Um olhar para o seu impacto." description={selection || 'Energia, emissões e serviços. Tudo conectado a um futuro mais consciente.'} refresh />
    <div className="history-toolbar"><span><Database size={16} />{date ? 'Exibindo coletas até a data selecionada' : demoMode ? 'Histórico de demonstração' : 'Histórico coletado nesta sessão · atualização a cada 30 s'}</span><div><button className="button button-outline button-small" disabled={!date} onClick={() => setDate('')}>Voltar para agora</button><label className="date-selector"><CalendarDays size={16} /><span>Selecionar data e hora</span><input aria-label="Selecionar data e hora" type="datetime-local" value={invalidDate ? '' : date} onChange={(event) => setDate(event.target.value)} /></label></div></div>
    {invalidDate && <p className="form-message error-message" role="alert">Data inválida na URL. Use Voltar para agora para remover o filtro.</p>}
    {regional && snapshot.lastCollectionAt && !services.length && <EmptyState compact icon={Server} title="Sem serviços nesta seleção" description="Escolha outra região ou visualize todas as regiões pelo controle acima." />}
    <div className="metrics-grid">
      <MetricCard label="Estimativas de emissões" value={formatNumber(emissions)} unit="gCO₂e" icon={Leaf} note={emissions === null ? 'Nenhuma emissão calculada no período' : 'Estimativas por coleta · ' + coverage.emissionCount + '/' + coverage.count + ' registros com emissão'} />
      <MetricCard label="Estimativas de energia" value={formatNumber(energy)} unit="kWh" icon={Zap} note={energy === null ? 'Nenhuma coleta no período' : 'Soma por coleta; intervalos podem se sobrepor'} tone="amber" />
      <MetricCard label="Serviços ativos" value={String(active)} icon={Server} note="Estado da última consulta" tone="blue" />
      <MetricCard label="Última coleta" value={lastCollection ? new Date(lastCollection).toLocaleTimeString('pt-BR') : '—'} icon={Clock3} note={lastCollection ? new Date(lastCollection).toLocaleDateString('pt-BR') : 'Ainda não realizada'} />
    </div>
    <div className="dashboard-details">
      <Panel icon={Activity} title="Dados da métrica da API"><dl className="api-details"><div><dt>Status</dt><dd><span className="status-tag">{demoMode ? 'Demonstração' : error ? 'Dados antigos' : loading ? 'Atualizando' : !snapshot.lastCollectionAt ? 'Aguardando conexão' : !services.length ? 'Sem serviços na seleção' : active === 0 ? 'Nenhum serviço disponível' : metricCount < services.length * 4 ? 'Métricas parciais' : 'Dados disponíveis'}</span></dd></div><div><dt>Métricas recebidas</dt><dd>{metricCount} / {services.length * 4}</dd></div><div><dt>Fonte</dt><dd>{demoMode ? 'Exemplos ilustrativos' : 'Agregador de métricas'}</dd></div><div><dt>Referência</dt><dd>Última consulta</dd></div></dl></Panel>
      <Panel icon={Leaf} title="Dados de dióxido de carbono" className="carbon-panel"><strong className="carbon-value">{formatNumber(emissions)}</strong><span>gCO₂e · período selecionado</span><p>{selection || 'Todas as regiões'}</p></Panel>
      <Panel icon={Zap} title="Participação de energia renovável"><div className="renewable-summary"><div className="data-donut small-donut" style={{ background: renewable === null ? '#e2ece7' : `conic-gradient(#408abc ${renewable}%, #e2ece7 0)` }}><span>{renewable === null ? '—' : `${formatNumber(renewable)}%`}</span></div><p>{regions.length === 1 ? 'Fator da região selecionada.' : 'Média das regiões monitoradas.'}<small>Referência: última consulta à API de carbono.</small></p></div></Panel>
    </div>
    <div className="dashboard-analysis">
      <Panel title="Gráfico percentual geral" eyebrow="ESTADO DOS SERVIÇOS"><div className="distribution-chart"><div className="data-donut" role="img" aria-label={services.length ? categories.map((category) => `${category.label}: ${category.count}`).join(', ') : 'Sem serviços para calcular percentuais'} style={{ background: services.length ? `conic-gradient(${stops.join(', ')})` : '#e2ece7' }}><span>{services.length ? '100%' : '—'}</span></div><ul>{categories.map((category) => <li key={category.label}><span style={{ background: category.color }} />{category.label}<strong>{services.length ? `${formatNumber(category.count / services.length * 100)}%` : '—'}</strong></li>)}</ul></div></Panel>
      <Panel title="Ranking de consumo por coleta" eyebrow="COMPARAÇÃO ENTRE DATAS">{ranking.length ? <ol className="collection-ranking">{ranking.map((point, index) => <li key={point.collectedAt}><span>{index + 1}</span><time dateTime={point.collectedAt}>{new Date(point.collectedAt).toLocaleString('pt-BR')}</time><meter min={0} max={Math.max(...ranking.map((entry) => entry.energyKwh), 0.000001)} value={point.energyKwh} aria-label={`Consumo da coleta ${index + 1}`} /><strong>{formatNumber(point.energyKwh)} kWh</strong></li>)}</ol> : <EmptyState compact icon={Zap} title="Cada coleta terá seu lugar." description="O ranking aparecerá quando houver histórico no período selecionado." />}</Panel>
    </div>
    <Panel className="history-panel" icon={Activity} title="Um histórico de escolhas" eyebrow="EVOLUÇÃO DAS EMISSÕES" link={{ to: '/emissoes', label: 'Explorar' }}><TrendChart points={history} /></Panel>
    <Panel icon={Globe2} title="Fatores de carbono por região" className="region-factor-panel"><div className="table-scroll"><table><thead><tr><th>Região</th><th>Cidade de referência</th><th>Intensidade · gCO₂e/kWh</th><th>Renovável</th></tr></thead><tbody>{regions.map((region) => <tr key={region.code}><td><strong>{region.region}</strong><small>{region.code}</small></td><td>{[region.city, region.country].filter(Boolean).join(', ')}</td><td>{formatNumber(region.carbonIntensity)}</td><td>{formatNumber(region.renewablePercent)}%</td></tr>)}</tbody></table></div>{!regions.length && <p className="city-catalog-note">Nenhum fator disponível para esta seleção.</p>}</Panel>
    <RegionMap services={services} regions={snapshot.regions} catalogUnavailable={Boolean(snapshot.warning)} country={country} city={city} date={lastCollection ?? undefined} onServiceSelect={(id) => navigate(analysisLink('/servicos/' + encodeURIComponent(id), params.toString()))} onCountrySelect={selectCountry} onCitySelect={(name) => { const next = new URLSearchParams(params); next.set('cidade', name); setParams(next); }} />
    <div className="dashboard-footnote"><Globe2 size={16} /><p>Estimativa dos serviços hospedados na região. Totais somam estimativas por coleta; intervalos podem se sobrepor. Não representam consumo contínuo acumulado. Emissões disponíveis em {coverage.emissionCount} de {coverage.count} registros. {demoMode ? 'Dados ilustrativos.' : 'Histórico mantido nesta sessão do navegador.'}</p><Link to={analysisLink('/pesquisa', params.toString())}>Pesquisar outra região</Link></div>
  </>;
}
