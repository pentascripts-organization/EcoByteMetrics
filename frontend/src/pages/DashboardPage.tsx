import { useState } from 'react';
import { Activity, CalendarDays, Clock3, Database, Globe2, Leaf, Server, Zap } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState, MetricCard, PageHeading, Panel, TrendChart } from '../components/UI';
import { RegionMap } from '../components/RegionMap';
import { formatNumber } from '../utils/format';
import { matchesRegion } from '../utils/region';
import { useMonitoring } from '../hooks/useMonitoring';

export function DashboardPage() {
  const { snapshot, demoMode } = useMonitoring();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [date, setDate] = useState('');
  const regionCode = params.get('regiao') ?? '';
  const selectedRegion = snapshot.regions.find((region) => region.code === regionCode);
  const country = selectedRegion?.country ?? params.get('pais') ?? '';
  const city = selectedRegion?.city ?? params.get('cidade') ?? '';
  const regional = Boolean(regionCode || country || city);
  const services = snapshot.services.filter((service) => regionCode ? service.regionCode === regionCode : matchesRegion(service, country, city));
  const history = snapshot.history.filter((point) => (!regional || (regionCode ? point.regionCode === regionCode || !point.regionCode && services.some((service) => service.id === point.serviceId) : point.country ? matchesRegion({ country: point.country, city: point.city ?? null }, country, city) : services.some((service) => service.id === point.serviceId))) && (!date || new Date(point.collectedAt).getTime() <= new Date(date).getTime()));
  const energy = regional || date ? history.length ? history.reduce((sum, point) => sum + point.energyKwh, 0) : null : snapshot.totalEnergyKwh;
  const emissions = regional || date ? history.some((point) => point.emissionsG !== null) ? history.reduce((sum, point) => sum + (point.emissionsG ?? 0), 0) : null : snapshot.totalEmissionsG;
  const lastCollection = history.reduce<string | null>((latest, point) => latest === null || Date.parse(point.collectedAt) > Date.parse(latest) ? point.collectedAt : latest, null);
  const active = services.filter((service) => service.status === 'available').length;
  const metricFields = ['cpuPercent', 'memoryGb', 'diskGb', 'networkGb'] as const;
  const metricCount = services.reduce((sum, service) => sum + metricFields.filter((field) => service[field] !== null).length, 0);
  const regions = snapshot.regions.filter((region) => regionCode ? region.code === regionCode : regional ? matchesRegion(region, country, city) : services.some((service) => service.regionCode === region.code));
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
  const selection = [country, city].filter(Boolean).join(' — ');
  return <>
    <PageHeading title="Um olhar para o seu impacto." description={selection || 'Energia, emissões e serviços. Tudo conectado a um futuro mais consciente.'} refresh />
    <div className="history-toolbar"><span><Database size={16} />{date ? 'Exibindo coletas até a data selecionada' : demoMode ? 'Histórico de demonstração' : 'Histórico coletado nesta sessão · atualização a cada 30 s'}</span><div><button className="button button-outline button-small" disabled={!date} onClick={() => setDate('')}>Voltar para agora</button><label className="date-selector"><CalendarDays size={16} /><span>Selecionar data e hora</span><input aria-label="Selecionar data e hora" type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} /></label></div></div>
    <div className="metrics-grid">
      <MetricCard label="Emissões estimadas" value={formatNumber(emissions)} unit="gCO₂e" icon={Leaf} note={emissions === null ? 'Nenhuma emissão calculada no período' : 'Soma das coletas com dados disponíveis'} />
      <MetricCard label="Energia consumida" value={formatNumber(energy)} unit="kWh" icon={Zap} note={energy === null ? 'Nenhuma coleta no período' : 'Consumo no período selecionado'} tone="amber" />
      <MetricCard label="Serviços ativos" value={String(active)} icon={Server} note="Estado da última consulta" tone="blue" />
      <MetricCard label="Última coleta" value={lastCollection ? new Date(lastCollection).toLocaleTimeString('pt-BR') : '—'} icon={Clock3} note={lastCollection ? new Date(lastCollection).toLocaleDateString('pt-BR') : 'Ainda não realizada'} />
    </div>
    <div className="dashboard-details">
      <Panel icon={Activity} title="Dados da métrica da API"><dl className="api-details"><div><dt>Status</dt><dd><span className="status-tag">{demoMode ? 'Demonstração' : snapshot.lastCollectionAt ? 'Dados disponíveis' : 'Aguardando conexão'}</span></dd></div><div><dt>Métricas recebidas</dt><dd>{metricCount} / {services.length * 4}</dd></div><div><dt>Fonte</dt><dd>{demoMode ? 'Exemplos ilustrativos' : 'Agregador de métricas'}</dd></div><div><dt>Referência</dt><dd>Última consulta</dd></div></dl></Panel>
      <Panel icon={Leaf} title="Dados de dióxido de carbono" className="carbon-panel"><strong className="carbon-value">{formatNumber(emissions)}</strong><span>gCO₂e · período selecionado</span><p>{selection || 'Todas as regiões'}</p></Panel>
      <Panel icon={Zap} title="Participação de energia renovável"><div className="renewable-summary"><div className="data-donut small-donut" style={{ background: renewable === null ? '#e2ece7' : `conic-gradient(#408abc ${renewable}%, #e2ece7 0)` }}><span>{renewable === null ? '—' : `${formatNumber(renewable)}%`}</span></div><p>{regions.length === 1 ? 'Fator da região selecionada.' : 'Média das regiões monitoradas.'}<small>Referência: última consulta à API de carbono.</small></p></div></Panel>
    </div>
    <div className="dashboard-analysis">
      <Panel title="Gráfico percentual geral" eyebrow="ESTADO DOS SERVIÇOS"><div className="distribution-chart"><div className="data-donut" role="img" aria-label={services.length ? categories.map((category) => `${category.label}: ${category.count}`).join(', ') : 'Sem serviços para calcular percentuais'} style={{ background: services.length ? `conic-gradient(${stops.join(', ')})` : '#e2ece7' }}><span>{services.length ? '100%' : '—'}</span></div><ul>{categories.map((category) => <li key={category.label}><span style={{ background: category.color }} />{category.label}<strong>{services.length ? `${formatNumber(category.count / services.length * 100)}%` : '—'}</strong></li>)}</ul></div></Panel>
      <Panel title="Ranking de consumo por coleta" eyebrow="COMPARAÇÃO ENTRE DATAS">{ranking.length ? <ol className="collection-ranking">{ranking.map((point, index) => <li key={point.collectedAt}><span>{index + 1}</span><time dateTime={point.collectedAt}>{new Date(point.collectedAt).toLocaleString('pt-BR')}</time><meter min={0} max={Math.max(...ranking.map((entry) => entry.energyKwh), 0.000001)} value={point.energyKwh} aria-label={`Consumo da coleta ${index + 1}`} /><strong>{formatNumber(point.energyKwh)} kWh</strong></li>)}</ol> : <EmptyState compact icon={Zap} title="Cada coleta terá seu lugar." description="O ranking aparecerá quando houver histórico no período selecionado." />}</Panel>
    </div>
    <Panel className="history-panel" icon={Activity} title="Um histórico de escolhas" eyebrow="EVOLUÇÃO DAS EMISSÕES" link={{ to: '/emissoes', label: 'Explorar' }}><TrendChart points={history} /></Panel>
    <Panel icon={Globe2} title="Fatores de carbono por região" className="region-factor-panel"><div className="table-scroll"><table><thead><tr><th>Região</th><th>Cidade de referência</th><th>Intensidade · gCO₂e/kWh</th><th>Renovável</th></tr></thead><tbody>{regions.map((region) => <tr key={region.code}><td><strong>{region.region}</strong><small>{region.code}</small></td><td>{[region.city, region.country].filter(Boolean).join(', ')}</td><td>{formatNumber(region.carbonIntensity)}</td><td>{formatNumber(region.renewablePercent)}%</td></tr>)}</tbody></table></div>{!regions.length && <p className="city-catalog-note">Nenhum fator disponível para esta seleção.</p>}</Panel>
    <RegionMap regions={snapshot.regions} catalogUnavailable={Boolean(snapshot.warning)} country={country} city={city} date={lastCollection ?? undefined} onCountrySelect={(name) => navigate(`/pesquisa?${new URLSearchParams({ pais: name })}`)} onCitySelect={(name) => navigate(`/pesquisa?${new URLSearchParams({ pais: country, cidade: name })}`)} />
    <div className="dashboard-footnote"><Globe2 size={16} /><p>Estimativa dos serviços hospedados na região. Totais somam apenas os intervalos coletados; dados ausentes não são contabilizados. {demoMode ? 'Dados ilustrativos.' : 'Histórico mantido nesta sessão do navegador.'}</p><Link to="/pesquisa">Pesquisar outra região</Link></div>
  </>;
}
