import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { ArrowUpRight, ChevronRight, GitCompareArrows, LayoutDashboard, Leaf, Menu, Search, Server, Settings2, X, Zap } from 'lucide-react';
import { Brand } from './Brand';
import { LeafScene } from './LeafScene';
import { useMonitoring } from '../hooks/useMonitoring';

const links = [
  { to: '/pesquisa', label: 'Pesquisa', icon: Search },
  { to: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/servicos', label: 'Serviços', icon: Server },
  { to: '/emissoes', label: 'Emissões', icon: Leaf },
  { to: '/energia', label: 'Energia', icon: Zap },
  { to: '/comparar', label: 'Comparar', icon: GitCompareArrows },
  { to: '/gerenciamento', label: 'Gerenciamento', icon: Settings2 },
];

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { snapshot, loading, error, demoMode, setDemoMode } = useMonitoring();
  return <div className="app-shell">
    <div className="sky-background" aria-hidden="true" /><LeafScene subtle />
    <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <header className="app-header"><div className="app-header-inner"><Brand />
      <nav className="desktop-nav" aria-label="Navegação principal">{links.map(({ to, label }) => <NavLink key={to} to={to}>{label}</NavLink>)}</nav>
      <div className="header-actions"><Link className="header-settings" to="/configuracoes" aria-label="Configurações"><Settings2 size={20} /></Link>
        <Link className="button button-small button-outline header-login" to="/login">Entrar<ArrowUpRight size={15} /></Link>
        <button className="mobile-menu-button" aria-label={menuOpen ? 'Fechar navegação' : 'Abrir navegação'} aria-expanded={menuOpen} aria-controls="mobile-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={23} /> : <Menu size={23} />}</button>
      </div>
    </div>{menuOpen && <nav id="mobile-nav" className="mobile-nav" aria-label="Navegação móvel">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}><Icon size={18} />{label}<ChevronRight size={15} /></NavLink>)}<NavLink to="/configuracoes" onClick={() => setMenuOpen(false)}><Settings2 size={18} />Configurações</NavLink></nav>}</header>
    <main id="main-content" className="dashboard-main"><div className="connection-strip"><span><span className="neutral-dot" />{demoMode ? 'Demonstração · dados ilustrativos' : loading ? 'Consultando APIs do desafio…' : snapshot.lastCollectionAt ? 'APIs do desafio · última consulta: ' + new Date(snapshot.lastCollectionAt).toLocaleString('pt-BR') : 'Aguardando a primeira coleta'}</span><label className="demo-toggle"><input type="checkbox" checked={demoMode} onChange={(event) => setDemoMode(event.target.checked)} />Usar dados de demonstração</label></div>
      {error && <p className="form-message error-message" role="alert">{error}</p>}{snapshot.warning && <p className="form-message" role="alert">{snapshot.warning}</p>}<Outlet />
    </main>
  </div>;
}
