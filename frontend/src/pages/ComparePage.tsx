import { useState } from 'react';
import { ArrowLeftRight, GitCompareArrows, Plus, Server, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, PageHeading, Panel } from '../components/UI';
import { formatNumber } from '../utils/format';
import { useMonitoring } from '../hooks/useMonitoring';

export function ComparePage() {
  const { snapshot } = useMonitoring();
  const [selected, setSelected] = useState<string[]>([]);
  const services = snapshot.services.filter((service) => selected.includes(service.id));
  return <><PageHeading eyebrow="NOVAS PERSPECTIVAS, MELHORES DECISÕES" title="Compare. Entenda. Evolua." description="Observe diferentes serviços pelo mesmo período e encontre novas possibilidades." />
    <Panel icon={GitCompareArrows} title="Uma comparação, muitos caminhos"><div className="comparison-selector"><div><h3>Quais serviços vamos comparar?</h3><p>Selecione entre dois e quatro serviços para analisar lado a lado.</p></div><label className="comparison-add"><Plus size={17} /><span className="sr-only">Adicionar serviço à comparação</span><select value="" disabled={snapshot.services.length === 0 || selected.length >= 4} onChange={(event) => { if (event.target.value) setSelected([...selected, event.target.value]); }}><option value="">Adicionar serviço</option>{snapshot.services.filter((service) => !selected.includes(service.id)).map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label></div>
      {services.length > 0 && <div className="selected-services">{services.map((service) => <span key={service.id}><Server size={14} />{service.name}<button aria-label={`Remover ${service.name} da comparação`} onClick={() => setSelected(selected.filter((id) => id !== service.id))}><X size={14} /></button></span>)}</div>}
      {services.length < 2 ? <EmptyState icon={ArrowLeftRight} title={snapshot.services.length ? 'Escolha pelo menos dois serviços.' : 'Perspectivas que se complementam.'} description={snapshot.services.length ? 'Adicione serviços para comparar recursos, energia e emissões.' : 'Quando seus serviços estiverem disponíveis, você poderá comparar o impacto de cada um.'} action={<Link className="button button-outline button-small" to="/servicos">Ver serviços<ArrowLeftRight size={15} /></Link>} /> :
        <div className="table-scroll"><table className="comparison-table"><thead><tr><th>Indicador</th>{services.map((service) => <th key={service.id}>{service.name}</th>)}</tr></thead><tbody>{[
          { label: 'CPU (%)', field: 'cpuPercent' }, { label: 'Memória (GB)', field: 'memoryGb' }, { label: 'Disco (GB)', field: 'diskGb' }, { label: 'Rede (GB)', field: 'networkGb' }, { label: 'Energia (kWh)', field: 'energyKwh' }, { label: 'Emissões (gCO₂e)', field: 'emissionsG' },
        ].map(({ label, field }) => <tr key={field}><th>{label}</th>{services.map((service) => <td key={service.id}>{formatNumber(service[field as 'cpuPercent' | 'memoryGb' | 'diskGb' | 'networkGb' | 'energyKwh' | 'emissionsG'])}</td>)}</tr>)}</tbody></table></div>}
    </Panel><div className="comparison-note"><GitCompareArrows size={20} /><p>Uma comparação justa considera o mesmo intervalo de tempo. O período selecionado será aplicado a todos os serviços.</p></div>
  </>;
}
