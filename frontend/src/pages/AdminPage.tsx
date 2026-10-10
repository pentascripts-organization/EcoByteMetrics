import { useState } from 'react';
import { Activity, Ban, Pencil, Search, Server, Settings2, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { EmptyState, MetricCard, Panel } from '../components/UI';
import { useMonitoring } from '../hooks/useMonitoring';

type UserStatus = 'active' | 'pending' | 'blocked';
type Role = 'administrador' | 'analista' | 'visitante';
const statusLabels: Record<UserStatus, string> = { active: 'Ativo', pending: 'Pendente', blocked: 'Bloqueado' };
const exampleUsers = [
  { id: 1, name: 'Usuário 01', email: 'usuario01@exemplo.com', role: 'administrador' as Role, status: 'active' as UserStatus },
  { id: 2, name: 'Usuário 02', email: 'usuario02@exemplo.com', role: 'analista' as Role, status: 'active' as UserStatus },
  { id: 3, name: 'Usuário 03', email: 'usuario03@exemplo.com', role: 'analista' as Role, status: 'pending' as UserStatus },
  { id: 4, name: 'Usuário 04', email: 'usuario04@exemplo.com', role: 'visitante' as Role, status: 'active' as UserStatus },
  { id: 5, name: 'Usuário 05', email: 'usuario05@exemplo.com', role: 'visitante' as Role, status: 'blocked' as UserStatus },
  { id: 6, name: 'Usuário 06', email: 'usuario06@exemplo.com', role: 'analista' as Role, status: 'active' as UserStatus },
];
const tabs = [
  { id: 'users', label: 'Usuários', icon: UsersRound },
  { id: 'system', label: 'Sistema', icon: Server },
  { id: 'requests', label: 'Requisições da API', icon: Activity },
  { id: 'settings', label: 'Configurações', icon: Settings2 },
] as const;

export function AdminPage() {
  const { demoMode, snapshot } = useMonitoring();
  const [tab, setTab] = useState<string>('users');
  const [users, setUsers] = useState(exampleUsers);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [editing, setEditing] = useState<{ id: number; role: Role } | null>(null);
  const [message, setMessage] = useState('');
  const visibleUsers = demoMode ? users.filter((user) => `${user.name} ${user.email}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')) && (status === 'all' || user.status === status)) : [];
  return <div className="admin-workspace"><aside className="admin-sidebar"><Brand light /><nav aria-label="Navegação administrativa">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setEditing(null); }} aria-pressed={tab === id}><Icon size={17} />{label}</button>)}</nav><Link to="/pesquisa">Ir para pesquisa</Link></aside>
    <section className="admin-content"><div className="page-heading"><div><span className="eyebrow">PAINEL ADMINISTRATIVO</span><h1>Gerenciamento do sistema</h1><p>{demoMode ? 'Demonstração. Alterações de usuários valem apenas nesta visita.' : 'Prévia do painel. Acesso administrativo ainda não disponível.'}</p></div></div>
      <div className="metrics-grid metrics-grid-three"><MetricCard label="Usuários ativos" value={demoMode ? String(users.filter((user) => user.status === 'active').length) : '—'} icon={UsersRound} note={demoMode ? 'Usuários de exemplo' : 'Aguardando integração'} /><MetricCard label="Contas pendentes" value={demoMode ? String(users.filter((user) => user.status === 'pending').length) : '—'} icon={UsersRound} note={demoMode ? 'Usuários de exemplo' : 'Aguardando integração'} tone="amber" /><MetricCard label="Status do sistema" value={demoMode ? 'Demonstração' : 'Pendente'} icon={Server} note="Sem autenticação administrativa" /></div>
      {tab === 'users' && <section className="panel admin-users"><div className="admin-table-heading"><h2>Controle de usuários</h2><div><label className="search-field"><Search size={16} /><span className="sr-only">Buscar usuário</span><input type="search" placeholder="Buscar usuário" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label><span className="sr-only">Filtrar status de usuário</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos os status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div></div>
        <div className="table-scroll"><table><thead><tr><th>Usuário</th><th>Perfil</th><th>Último acesso</th><th>Status</th><th>Ações</th></tr></thead><tbody>{visibleUsers.map((user) => <tr key={user.id}><td><div className="admin-user"><span className="user-avatar">U{user.id}</span><span><strong>{user.name}</strong><small>{user.email}</small></span></div></td><td>{editing?.id === user.id ? <div className="role-editor"><select aria-label={`Perfil de ${user.name}`} value={editing.role} onChange={(event) => setEditing({ id: user.id, role: event.target.value as Role })}>{['administrador', 'analista', 'visitante'].map((role) => <option key={role}>{role}</option>)}</select><button className="text-link" onClick={() => { setUsers(users.map((entry) => entry.id === user.id ? { ...entry, role: editing.role } : entry)); setEditing(null); setMessage(`Perfil de ${user.name} atualizado na demonstração.`); }}>Salvar</button><button className="text-link" onClick={() => setEditing(null)}>Cancelar</button></div> : user.role}</td><td>—</td><td><span className={`user-status user-status-${user.status}`}>{statusLabels[user.status]}</span></td><td><div className="user-actions"><button aria-label={`Editar ${user.name}`} onClick={() => setEditing({ id: user.id, role: user.role })}><Pencil size={15} /></button><button aria-label={`${user.status === 'blocked' ? 'Desbloquear' : 'Bloquear'} ${user.name}`} onClick={() => { setUsers(users.map((entry) => entry.id === user.id ? { ...entry, status: user.status === 'blocked' ? 'active' : 'blocked' } : entry)); setMessage(`Status de ${user.name} atualizado na demonstração.`); }}><Ban size={15} /></button></div></td></tr>)}</tbody></table></div>
        {!visibleUsers.length && <EmptyState icon={UsersRound} title={demoMode ? 'Nenhum usuário encontrado' : 'Controle de usuários em breve'} description={demoMode ? 'Ajuste a busca ou o filtro de status.' : 'Ative os dados de demonstração para explorar esta tela.'} />}{message && demoMode && <p className="form-message" role="status">{message}</p>}
      </section>}
      {tab === 'system' && <Panel icon={Server} title="Sistema"><dl className="api-details"><div><dt>Monitoramento</dt><dd>{demoMode ? 'Demonstração' : snapshot.lastCollectionAt ? 'APIs do desafio' : 'Aguardando conexão'}</dd></div><div><dt>Serviços exibidos</dt><dd>{snapshot.services.length}</dd></div><div><dt>Autenticação</dt><dd>Não disponível</dd></div></dl></Panel>}
      {tab === 'requests' && <Panel icon={Activity} title="Requisições da API"><EmptyState icon={Activity} title="Nenhuma requisição registrada" description="O registro detalhado de requisições ainda não está disponível." /></Panel>}
      {tab === 'settings' && <Panel icon={Settings2} title="Configurações"><p className="admin-note">Personalize o movimento das folhas e o período padrão de visualização.</p><Link className="button button-outline" to="/configuracoes">Abrir preferências</Link></Panel>}
    </section>
  </div>;
}
