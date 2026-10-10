import { ChartNoAxesCombined, Leaf, Server, Zap } from 'lucide-react';
import { EmptyState, MetricCard, PageHeading, Panel, TrendChart } from '../components/UI';
import { formatNumber } from '../utils/format';
import { useMonitoring } from '../hooks/useMonitoring';

export function ImpactPage({ metric }: { metric: 'emissions' | 'energy' }) {
  const { snapshot } = useMonitoring();
  const emissions = metric === 'emissions';
  const value = emissions ? snapshot.totalEmissionsG : snapshot.totalEnergyKwh;
  const Icon = emissions ? Leaf : Zap;
  const field = emissions ? 'emissionsG' : 'energyKwh';
  const ranking = snapshot.services.filter((service) => service[field] !== null && service.status !== 'removed').sort((a, b) => b[field]! - a[field]!).slice(0, 5);
  return <><PageHeading eyebrow={emissions ? 'UMA PEGADA MAIS CONSCIENTE' : 'CADA RECURSO IMPORTA'} title={emissions ? 'Entenda a sua pegada.' : 'Energia para escolhas melhores.'} description={emissions ? 'Acompanhe as emissões estimadas de CO₂e das suas aplicações.' : 'Explore o consumo energético estimado da sua infraestrutura.'} refresh />
    <div className="metrics-grid metrics-grid-three"><MetricCard label={emissions ? 'Emissões no período' : 'Consumo no período'} value={formatNumber(value)} unit={emissions ? 'gCO₂e' : 'kWh'} icon={Icon} note={value === null ? 'Aguardando coletas' : 'Soma dos intervalos com dados disponíveis'} /><MetricCard label="Serviços monitorados" value={String(snapshot.services.filter((service) => service.status !== 'removed').length)} icon={Server} note="Serviços presentes no registro" tone="blue" /><MetricCard label="Coletas no período" value={String(snapshot.history.length)} icon={ChartNoAxesCombined} note="Registros por serviço nesta sessão" /></div>
    <div className="impact-grid"><Panel icon={Icon} title={emissions ? 'Emissões ao longo do tempo' : 'Consumo ao longo do tempo'} eyebrow="SEU HISTÓRICO"><TrendChart metric={metric} /></Panel><Panel icon={Server} title={emissions ? 'Ranking de emissões' : 'Ranking de consumo'} eyebrow="ÚLTIMA COLETA POR SERVIÇO">{ranking.length ? <ol className="collection-ranking">{ranking.map((service, index) => <li key={service.id}><span>{index + 1}</span><strong>{service.name}</strong><meter min={0} max={Math.max(...ranking.map((entry) => entry[field]!), 0.000001)} value={service[field]!} aria-label={`Impacto de ${service.name}`} /><strong>{formatNumber(service[field])} {emissions ? 'gCO₂e' : 'kWh'}</strong></li>)}</ol> : <EmptyState compact icon={Icon} title="Cada serviço terá seu lugar." description="O ranking aparecerá quando houver coletas com dados suficientes." />}</Panel></div>
    <article className="impact-explainer"><span className="icon-tile"><Icon size={26} /></span><div><span className="eyebrow">POR TRÁS DO INDICADOR</span><h2>{emissions ? 'O lugar também faz parte da conta.' : 'Do uso de recursos ao consumo estimado.'}</h2><p>{emissions ? 'A mesma aplicação pode emitir quantidades diferentes de CO₂e conforme a matriz elétrica da região. Combinamos a energia estimada com a intensidade de carbono local para dar contexto ao impacto.' : 'CPU, memória, disco e rede contribuem para uma estimativa da potência. Ao considerar o tempo de coleta, essa potência se transforma em consumo energético em kWh.'}</p><span className="formula-inline">{emissions ? 'CO₂e (g) = energia (kWh) × intensidade de carbono (gCO₂e/kWh)' : 'Energia (kWh) = potência estimada (W) × tempo (h) ÷ 1.000'}</span></div></article>
  </>;
}
