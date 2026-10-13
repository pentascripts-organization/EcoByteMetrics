import { useState } from 'react';
import { Activity, Server, Settings2, UsersRound, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { EmptyState, MetricCard, Panel } from '../components/UI';
import { useMonitoring } from '../hooks/useMonitoring';

const tabs = [
  { id: 'users', label: 'Usuários', icon: UsersRound },
  { id: 'system', label: 'Sistema', icon: Server },
  { id: 'requests', label: 'Requisições da API', icon: Activity },
  { id: 'settings', label: 'Configurações', icon: Settings2 },
] as const;

export function AdminPage() {
  const { snapshot, requests, clearRequests, refresh, loading } = useMonitoring();
  const [tab, setTab] = useState<string>('users');
  return <div className="admin-workspace"><aside className="admin-sidebar"><Brand light /><nav aria-label="Navegação administrativa">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)} aria-pressed={tab === id}><Icon size={17} />{label}</button>)}</nav><Link to="/pesquisa">Ir para pesquisa</Link></aside>
    <section className="admin-content"><div className="page-heading"><div><span className="eyebrow">PAINEL ADMINISTRATIVO</span><h1>Gerenciamento do sistema</h1><p>Prévia do painel. Acesso administrativo ainda não disponível.</p></div></div>
      <div className="metrics-grid metrics-grid-three"><MetricCard label="Usuários ativos" value="—" icon={UsersRound} note="Aguardando integração" /><MetricCard label="Contas pendentes" value="—" icon={UsersRound} note="Aguardando integração" tone="amber" /><MetricCard label="Status do sistema" value="Pendente" icon={Server} note="Sem autenticação administrativa" /></div>
      {tab === 'users' && <Panel icon={UsersRound} title="Controle de usuários"><EmptyState icon={UsersRound} title="Controle de usuários em breve" description="A gestão de usuários depende da integração com a autenticação do backend." /></Panel>}
      {tab === 'system' && <Panel icon={Server} title="Sistema"><dl className="api-details"><div><dt>Monitoramento</dt><dd>{snapshot.lastCollectionAt ? 'APIs do desafio' : 'Aguardando conexão'}</dd></div><div><dt>Serviços exibidos</dt><dd>{snapshot.services.length}</dd></div><div><dt>Autenticação</dt><dd>Não disponível</dd></div></dl></Panel>}
      {tab === 'requests' && <Panel icon={Activity} title="Requisições da API"><p className="analysis-notice">Últimas 50 requisições reais feitas por este navegador nesta sessão. Sem persistência ou registros de outros usuários.</p><div className="diagnostic-actions"><button className="button button-outline button-small" disabled={loading} onClick={() => void refresh()}><RefreshCw size={15} />Consultar agora</button><button className="button button-outline button-small" disabled={!requests.length} onClick={clearRequests}>Limpar registros locais</button></div>{requests.length ? <div className="table-scroll"><table><thead><tr><th>Consulta</th><th>Resultado</th><th>Duração</th><th>Horário</th></tr></thead><tbody>{requests.map((request, index) => <tr key={request.completedAt + request.url + index}><td><strong>{request.url.includes('/metrics/') ? 'Métricas de serviço' : request.url.endsWith('/regions') ? 'Fatores de carbono' : 'Descoberta de serviços'}</strong><small>GET {request.url}</small></td><td>{request.status !== null ? 'HTTP ' + request.status : request.outcome === 'cancelled' ? 'Cancelada' : request.outcome === 'timeout' ? 'Tempo esgotado' : 'Falha de conexão'}</td><td>{request.durationMs} ms</td><td><time dateTime={request.completedAt}>{new Date(request.completedAt).toLocaleString('pt-BR')}</time></td></tr>)}</tbody></table></div> : <EmptyState icon={Activity} title="Nenhuma requisição registrada" description="Faça uma consulta nas telas de monitoramento ou use Consultar agora." />}</Panel>}
      {tab === 'settings' && <Panel icon={Settings2} title="Configurações"><p className="admin-note">Personalize o movimento das folhas e o período padrão de visualização.</p><Link className="button button-outline" to="/configuracoes">Abrir preferências</Link></Panel>}
    </section>
  </div>;
}
