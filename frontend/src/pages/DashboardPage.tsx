import { Activity, ArrowUpRight, Clock3, Globe2, Leaf, Radio, Server, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, MetricCard, PageHeading, Panel, TrendChart } from '../components/UI';
import { formatNumber } from '../utils/format';
import { useMonitoring } from '../hooks/useMonitoring';

export function DashboardPage() {
  const { snapshot } = useMonitoring();
  const active = snapshot.services.filter((service) => service.status === 'available').length;
  return <>
    <PageHeading title="Um olhar para o seu impacto." description="Energia, emissões e serviços. Tudo conectado a um futuro mais consciente." refresh />
    <div className="metrics-grid">
      <MetricCard label="Emissões estimadas" value={formatNumber(snapshot.totalEmissionsG)} unit="gCO₂e" icon={Leaf} note="Nenhuma coleta no período" />
      <MetricCard label="Energia consumida" value={formatNumber(snapshot.totalEnergyKwh)} unit="kWh" icon={Zap} note="Nenhuma coleta no período" tone="amber" />
      <MetricCard label="Serviços ativos" value={String(active)} icon={Server} note="Aguardando descoberta" tone="blue" />
      <MetricCard label="Última coleta" value={snapshot.lastCollectionAt ? new Date(snapshot.lastCollectionAt).toLocaleTimeString('pt-BR') : '—'} icon={Clock3} note="Ainda não realizada" />
    </div>
    <div className="dashboard-grid">
      <Panel className="history-panel" icon={Activity} title="Um histórico de escolhas" eyebrow="EVOLUÇÃO DAS EMISSÕES" link={{ to: '/emissoes', label: 'Explorar' }}><TrendChart /></Panel>
      <Panel className="activity-panel" icon={Radio} title="Pulso do ambiente" eyebrow="MONITORAMENTO"><div className="monitoring-status"><span className="status-orbit"><Radio size={25} /></span><h3>Pronto para um novo começo.</h3><p>Quando o monitoramento iniciar, você verá as mudanças do seu ambiente por aqui.</p><span className="status-tag"><span className="neutral-dot" />Aguardando conexão</span></div><div className="activity-summary"><span>Serviços descobertos<strong>{snapshot.services.length}</strong></span><span>Serviços indisponíveis<strong>{snapshot.services.filter((service) => service.status === 'unavailable').length}</strong></span></div></Panel>
      <Panel icon={Server} title="Serviços em destaque" link={{ to: '/servicos', label: 'Ver serviços' }}><EmptyState compact icon={Server} title="Tudo começa com o primeiro serviço" description="O ranking de impacto aparecerá após as primeiras coletas." /></Panel>
      <Panel icon={Globe2} title="Um impacto que tem lugar" link={{ to: '/servicos', label: 'Ver regiões' }}><div className="location-empty"><div className="globe-illustration" aria-hidden="true"><Globe2 size={118} strokeWidth={0.65} /><span className="globe-dot" /></div><div><span className="eyebrow">DISTRIBUIÇÃO GEOGRÁFICA</span><h3>Novas perspectivas,<br />em cada região.</h3><p>As localizações serão exibidas quando os serviços forem descobertos.</p></div></div></Panel>
    </div>
    <div className="dashboard-footnote"><Leaf size={15} /><p>O impacto ambiental é uma estimativa baseada no uso de recursos e na intensidade de carbono da região.</p><Link to="/">Saiba como funciona<ArrowUpRight size={14} /></Link></div>
  </>;
}
