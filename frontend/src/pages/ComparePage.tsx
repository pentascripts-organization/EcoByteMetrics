import { useState } from 'react';
import { ArrowLeftRight, GitCompareArrows, Plus, Server, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, PageHeading, Panel } from '../components/UI';
import { formatNumber } from '../utils/format';
import { commonCollectionPoints, summarizeCollections } from '../utils/history';
import { useMonitoring } from '../hooks/useMonitoring';

export function ComparePage() {
  const { snapshot } = useMonitoring();
  const [selected, setSelected] = useState<string[]>([]);
  const services = snapshot.services.filter((service) => selected.includes(service.id));
  const common = commonCollectionPoints(snapshot.history, services.map((service) => service.id));
  const summaries = services.map((service) => summarizeCollections(common.filter((point) => point.serviceId === service.id)));
  const rows = [
    { label: 'Energia estimada · kWh/h', values: summaries.map((summary) => summary.energyPerHourKwh) },
    { label: 'Emissões estimadas · gCO₂e/h', values: summaries.map((summary) => summary.emissionsPerHourG) },
    { label: 'Coletas em comum', values: summaries.map((summary) => summary.count) },
    { label: 'Coletas com emissão', values: summaries.map((summary) => summary.emissionCount) },
    { label: 'Soma dos intervalos informados · s', values: summaries.map((summary) => summary.seconds) },
  ];
  const resourceRows = [
    { label: 'CPU · %', values: services.map((service) => service.cpuPercent) },
    { label: 'RAM · GB', values: services.map((service) => service.memoryGb) },
    { label: 'Disco · GB', values: services.map((service) => service.diskGb) },
    { label: 'Rede · GB', values: services.map((service) => service.networkGb) },
  ];
  return <>
    <PageHeading eyebrow="NOVAS PERSPECTIVAS, MELHORES DECISÕES" title="Compare. Entenda. Evolua." description="Compare estimativas das mesmas coletas no período escolhido, normalizadas pela duração informada." />
    <Panel icon={GitCompareArrows} title="Uma comparação, muitos caminhos">
      <div className="comparison-selector"><div><h3>Quais serviços vamos comparar?</h3><p>Selecione entre dois e quatro serviços para analisar lado a lado.</p></div>
        <label className="comparison-add"><Plus size={17} /><span className="sr-only">Adicionar serviço à comparação</span>
          <select value="" disabled={snapshot.services.length === 0 || selected.length >= 4} onChange={(event) => { if (event.target.value) setSelected([...selected, event.target.value]); }}>
            <option value="">Adicionar serviço</option>{snapshot.services.filter((service) => !selected.includes(service.id)).map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
          </select>
        </label>
      </div>
      {services.length > 0 && <div className="selected-services">{services.map((service) => <span key={service.id}><Server size={14} />{service.name}<button aria-label={'Remover ' + service.name + ' da comparação'} onClick={() => setSelected(selected.filter((id) => id !== service.id))}><X size={14} /></button></span>)}</div>}
      {services.length < 2 ? <EmptyState icon={ArrowLeftRight} title={snapshot.services.length ? 'Escolha pelo menos dois serviços.' : 'Perspectivas que se complementam.'} description={snapshot.services.length ? 'Adicione serviços para comparar recursos, energia e emissões.' : 'Quando seus serviços estiverem disponíveis, você poderá comparar o impacto de cada um.'} action={<Link className="button button-outline button-small" to="/servicos">Ver serviços<ArrowLeftRight size={15} /></Link>} /> :
        <>
          {common.length ? <div className="table-scroll"><table className="comparison-table"><caption>Estimativas das coletas em comum no período selecionado</caption><thead><tr><th>Indicador</th>{services.map((service) => <th key={service.id}>{service.name}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{row.values.map((value, index) => <td key={services[index]!.id}>{formatNumber(value)}</td>)}</tr>)}</tbody></table></div> :
            <EmptyState compact icon={GitCompareArrows} title="Nenhuma coleta em comum no período." description="Aguarde uma coleta válida para todos os serviços selecionados ou escolha outro período." />}
          <div className="table-scroll"><table className="comparison-table"><caption>Recursos da última consulta · independentes do período histórico</caption><thead><tr><th>Recurso</th>{services.map((service) => <th key={service.id}>{service.name}</th>)}</tr></thead><tbody>{resourceRows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{row.values.map((value, index) => <td key={services[index]!.id}>{formatNumber(value)}</td>)}</tr>)}</tbody></table></div>
        </>
      }
    </Panel>
    <div className="comparison-note"><GitCompareArrows size={20} /><p>Taxas por hora derivadas das mesmas coletas, usando o tempo informado para cada serviço. Sem todas as emissões ou sem duração, a taxa fica —. Intervalos podem se sobrepor; estas taxas não comprovam consumo contínuo. Histórico disponível somente nesta sessão.</p></div>
  </>;
}
