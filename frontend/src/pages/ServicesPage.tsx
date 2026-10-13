import { ArrowDownUp, Search, Server } from 'lucide-react';
import { EmptyState, PageHeading } from '../components/UI';
import { formatNumber } from '../utils/format';
import { useAnalysis } from '../hooks/useAnalysis';
import { Link, useSearchParams } from 'react-router-dom';
import { analysisLink } from '../utils/analysis';
import type { ServiceStatus } from '../types/monitoring';

const statuses: Record<ServiceStatus, string> = { available: 'Disponível', unavailable: 'Indisponível', 'no-metrics': 'Sem métricas', removed: 'Removido' };

export function ServicesPage() {
  const { services: availableServices } = useAnalysis();
  const [params, setParams] = useSearchParams();
  const query = params.toString();
  const search = params.get('busca') ?? '';
  const status = Object.keys(statuses).includes(params.get('estado') ?? '') ? params.get('estado')! : 'all';
  const sort = ['name', 'emissions', 'energy'].includes(params.get('ordem') ?? '') ? params.get('ordem')! : 'name';
  const setFilter = (key: string, value: string) => { const next = new URLSearchParams(window.location.search); if (value && !(key === 'estado' && value === 'all') && !(key === 'ordem' && value === 'name')) next.set(key, value); else next.delete(key); setParams(next, { replace: true }); };
  const setSearch = (value: string) => setFilter('busca', value);
  const setStatus = (value: string) => setFilter('estado', value);
  const setSort = (value: string) => setFilter('ordem', value);
  const services = availableServices.filter((service) => `${service.name} ${service.country ?? ''} ${service.region ?? ''} ${service.city ?? ''} ${service.regionCode ?? ''}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')) && (status === 'all' || service.status === status))
    .sort((a, b) => sort === 'emissions' ? (b.emissionsG ?? 0) - (a.emissionsG ?? 0) : sort === 'energy' ? (b.energyKwh ?? 0) - (a.energyKwh ?? 0) : a.name.localeCompare(b.name, 'pt-BR'));
  return <><PageHeading eyebrow="CADA APLICAÇÃO TEM UMA HISTÓRIA" title="Seus serviços, mais transparentes." description="Conheça os recursos, a localização e o impacto de cada aplicação." refresh />
    <section className="panel service-panel"><div className="table-toolbar"><label className="search-field"><Search size={18} /><span className="sr-only">Buscar serviço ou região</span><input type="search" placeholder="Buscar serviço ou região..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><div className="table-filters"><label><span className="sr-only">Filtrar por estado</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos os estados</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="sort-select"><ArrowDownUp size={15} /><span className="sr-only">Ordenar serviços</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="name">Nome</option><option value="emissions">Maior emissão</option><option value="energy">Maior consumo</option></select></label></div></div>
      <div className="table-scroll"><table><thead><tr><th>Serviço</th><th>Estado</th><th>Localização</th><th>CPU</th><th>RAM · GB</th><th>Disco · GB</th><th>Rede · GB</th><th>Fator · gCO₂e/kWh</th><th>Intervalo · s</th><th>Energia · kWh</th><th>Emissões · gCO₂e</th></tr></thead><tbody>{services.map((service) => <tr key={service.id}><td><Link className="service-detail-link" to={analysisLink('/servicos/' + encodeURIComponent(service.id), query)}>{service.name}</Link></td><td><span className={`service-status status-${service.status}`}>{statuses[service.status]}</span>{service.statusMessage && <small>{service.statusMessage}</small>}</td><td>{[service.city, service.region, service.country].filter(Boolean).join(', ') || '—'}<small>{service.regionCode}</small></td><td>{formatNumber(service.cpuPercent)}{service.cpuPercent !== null ? '%' : ''}</td><td>{formatNumber(service.memoryGb)}</td><td>{formatNumber(service.diskGb)}</td><td>{formatNumber(service.networkGb)}</td><td>{formatNumber(service.carbonIntensity ?? null)}</td><td>{formatNumber(service.collectionIntervalSeconds ?? null)}</td><td>{formatNumber(service.energyKwh)}</td><td>{formatNumber(service.emissionsG)}</td></tr>)}</tbody></table></div>
      {!services.length && <EmptyState icon={Server} title={availableServices.length ? 'Nenhum serviço encontrado' : 'Um espaço para seus serviços.'} description={availableServices.length ? 'Ajuste os filtros para encontrar o serviço que procura.' : 'Os serviços e suas métricas aparecerão aqui quando a coleta começar.'} />}
      <div className="table-footer"><span>{services.length} serviço{services.length !== 1 ? 's' : ''}</span><span>Energia e emissões da última coleta, usando o intervalo informado pela API.</span></div>
    </section><div className="information-grid"><article className="info-card"><span className="green-dot" /><h3>Disponível</h3><p>Serviço ativo, com métricas recebidas.</p></article><article className="info-card"><span className="amber-dot" /><h3>Sem métricas</h3><p>Serviço descoberto, sem dados de coleta.</p></article><article className="info-card"><span className="red-dot" /><h3>Indisponível</h3><p>Serviço sem resposta ao monitoramento.</p></article></div>
  </>;
}
