import { Activity, ArrowLeft, Clock3, Globe2, Leaf, Server, Zap } from 'lucide-react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { EmptyState, MetricCard, PageHeading, Panel, TrendChart } from '../components/UI';
import { useMonitoring } from '../hooks/useMonitoring';
import { useAnalysis } from '../hooks/useAnalysis';
import { analysisLink } from '../utils/analysis';
import { summarizeCollections } from '../utils/history';
import { formatNumber } from '../utils/format';

export function ServiceDetailPage() {
  const { id } = useParams();
  const { search } = useLocation();
  const [params, setParams] = useSearchParams();
  const { snapshot, loading, error } = useMonitoring();
  const analysis = useAnalysis();
  const service = snapshot.services.find((entry) => entry.id === id);
  const history = analysis.history.filter((point) => point.serviceId === id);
  const totals = summarizeCollections(history);
  const destination = snapshot.regions.find((region) => region.code === params.get('destino'));
  const projectedEmissions = service?.energyKwh != null && destination ? service.energyKwh * destination.carbonIntensity : null;
  const difference = projectedEmissions !== null && service?.emissionsG != null ? projectedEmissions - service.emissionsG : null;
  const percentage = difference !== null && service?.emissionsG && service.emissionsG > 0 ? difference / service.emissionsG * 100 : null;
  const labels = { available: 'Disponível', unavailable: 'Indisponível', 'no-metrics': 'Sem métricas', removed: 'Removido' };
  return <>
    <Link className="text-link breadcrumb" to={analysisLink('/servicos', search)}><ArrowLeft size={16} />Voltar aos serviços</Link>
    <PageHeading eyebrow="DETALHES DO SERVIÇO" title={service?.name ?? 'Detalhes do serviço'} description="Recursos da última consulta e estimativas do período selecionado." refresh />
    {!service ? <EmptyState icon={Server} title={loading ? 'Consultando o serviço…' : error ? 'Não foi possível confirmar este serviço' : 'Serviço não encontrado'} description={loading ? 'Aguarde a lista de serviços.' : error ? 'Atualize a conexão para tentar novamente.' : 'O identificador não está no registro nem no histórico desta sessão.'} /> : <>
      <Panel icon={Server} title="Estado e localização"><dl className="api-details"><div><dt>Identificador</dt><dd>{service.id}</dd></div><div><dt>Estado atual</dt><dd><span className={'service-status status-' + service.status}>{labels[service.status]}</span></dd></div><div><dt>Localização atual</dt><dd>{[service.city, service.region, service.country].filter(Boolean).join(', ') || '—'}</dd></div><div><dt>Região elétrica</dt><dd>{service.regionCode || '—'}</dd></div><div><dt>Coordenadas</dt><dd>{service.latitude !== undefined && service.longitude !== undefined ? service.latitude + ', ' + service.longitude : '—'}</dd></div></dl>{service.statusMessage && <p className="form-message" role="status">{service.statusMessage}</p>}</Panel>
      <div className="metrics-grid service-detail-metrics"><MetricCard label="Estimativas de energia" value={formatNumber(totals.energyKwh)} unit="kWh" icon={Zap} note="Soma por coleta no período selecionado" /><MetricCard label="Estimativas de emissões" value={formatNumber(totals.emissionsG)} unit="gCO₂e" icon={Leaf} note={totals.emissionCount + '/' + totals.count + ' registros com emissão'} /><MetricCard label="Coletas no período" value={String(totals.count)} icon={Activity} note="Registros disponíveis nesta sessão" /><MetricCard label="Intervalo atual" value={formatNumber(service.collectionIntervalSeconds ?? null)} unit="s" icon={Clock3} note="Duração informada na última consulta" /></div>
      <div className="impact-grid"><Panel icon={Activity} title="Recursos da última consulta"><dl className="api-details">{[['CPU', formatNumber(service.cpuPercent) + (service.cpuPercent !== null ? ' %' : '')], ['RAM', formatNumber(service.memoryGb) + ' GB'], ['Disco', formatNumber(service.diskGb) + ' GB'], ['Rede', formatNumber(service.networkGb) + ' GB']].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></Panel><Panel icon={Globe2} title="Fator ambiental atual"><dl className="api-details"><div><dt>Intensidade de carbono</dt><dd>{formatNumber(service.carbonIntensity ?? null)} gCO₂e/kWh</dd></div><div><dt>Energia renovável</dt><dd>{formatNumber(service.renewablePercent ?? null)} %</dd></div><div><dt>Energia da última coleta</dt><dd>{formatNumber(service.energyKwh)} kWh</dd></div><div><dt>Emissões da última coleta</dt><dd>{formatNumber(service.emissionsG)} gCO₂e</dd></div></dl></Panel></div>
      <Panel icon={Activity} title="Histórico de emissões deste serviço"><TrendChart points={history} /></Panel>
      <Panel icon={Globe2} title="Simular outra região"><p className="analysis-notice">Mantém a energia estimada da última coleta e aplica o fator de outra região. É uma hipótese para comparação; não altera nem migra o serviço.</p><label className="simulation-select"><span>Região de destino</span><select aria-label="Região de destino" value={destination?.code ?? ''} disabled={!snapshot.regions.length} onChange={(event) => { const next = new URLSearchParams(params); if (event.target.value) next.set('destino', event.target.value); else next.delete('destino'); setParams(next, { replace: true }); }}><option value="">Selecione uma região</option>{snapshot.regions.map((region) => <option key={region.code} value={region.code}>{region.country} · {region.city ?? region.region} · {region.code}</option>)}</select></label>{destination && <dl className="api-details simulation-results"><div><dt>Fator de destino</dt><dd>{formatNumber(destination.carbonIntensity)} gCO₂e/kWh</dd></div><div><dt>Emissões atuais por coleta</dt><dd>{formatNumber(service.emissionsG)} gCO₂e</dd></div><div><dt>Emissões simuladas por coleta</dt><dd>{formatNumber(projectedEmissions)} gCO₂e</dd></div><div><dt>Diferença em relação à região atual</dt><dd>{difference !== null ? (difference > 0 ? '+' : '') + formatNumber(difference) + ' gCO₂e' : '—'}{percentage !== null && ' (' + (percentage > 0 ? '+' : '') + formatNumber(percentage) + '%)'}</dd></div></dl>}{destination && projectedEmissions === null && <p className="form-message" role="status">A simulação precisa de uma estimativa válida de energia na última coleta.</p>}</Panel>
      <p className="analysis-notice">Estado, recursos e localização atuais referem-se à última consulta. O período e a data filtram o histórico. Estimativas por coleta podem ter intervalos sobrepostos; não representam consumo contínuo acumulado.</p>
    </>}
  </>;
}
