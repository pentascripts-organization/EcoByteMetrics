import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, ChevronRight, GitCompareArrows, LayoutDashboard, Leaf, Menu, Search, Server, Settings2, X, Zap } from 'lucide-react';
import { Brand } from './Brand';
import { LeafScene } from './LeafScene';
import { useMonitoring } from '../hooks/useMonitoring';
import { useAnalysis } from '../hooks/useAnalysis';
import { analysisLink } from '../utils/analysis';

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
  const { search, pathname } = useLocation();
  const [params, setParams] = useSearchParams();
  const { selection, date, regional } = useAnalysis();
  const monitoringPage = !['/configuracoes', '/gerenciamento'].includes(pathname);
  const clearRegion = () => { const next = new URLSearchParams(params); for (const key of ['pais', 'cidade', 'regiao']) next.delete(key); setParams(next); };
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menuOpen]);
  const { snapshot, loading, error, demoMode, setDemoMode } = useMonitoring();
  return <div className="app-shell">
    <div className="sky-background" aria-hidden="true" /><LeafScene subtle />
    <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <header className="app-header"><div className="app-header-inner"><Brand />
      <nav className="desktop-nav" aria-label="Navegação principal">{links.map(({ to, label }) => <NavLink key={to} to={analysisLink(to, search)}>{label}</NavLink>)}</nav>
      <div className="header-actions"><Link className="header-settings" to={analysisLink('/configuracoes', search)} aria-label="Configurações"><Settings2 size={20} /></Link>
        <Link className="button button-small button-outline header-login" to="/login">Entrar<ArrowUpRight size={15} /></Link>
        <button ref={menuButton} className="mobile-menu-button" aria-label={menuOpen ? 'Fechar navegação' : 'Abrir navegação'} aria-expanded={menuOpen} aria-controls="mobile-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={23} /> : <Menu size={23} />}</button>
      </div>
    </div>{menuOpen && <nav id="mobile-nav" className="mobile-nav" aria-label="Navegação móvel">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={analysisLink(to, search)} onClick={() => setMenuOpen(false)}><Icon size={18} />{label}<ChevronRight size={15} /></NavLink>)}<NavLink to={analysisLink('/configuracoes', search)} onClick={() => setMenuOpen(false)}><Settings2 size={18} />Configurações</NavLink><NavLink to="/login" onClick={() => setMenuOpen(false)}>Login / Cadastro<ArrowUpRight size={18} /></NavLink></nav>}</header>
    <main tabIndex={-1} id="main-content" className="dashboard-main"><div className="connection-strip"><span><span className="neutral-dot" />{!monitoringPage ? pathname === '/configuracoes' ? 'Preferências deste navegador' : 'Prévia administrativa · sem autenticação' : demoMode ? 'Demonstração · dados ilustrativos' : loading ? 'Consultando serviços e métricas…' : snapshot.lastCollectionAt ? (error ? 'Dados antigos · última consulta válida: ' : 'Última consulta válida: ') + new Date(snapshot.lastCollectionAt).toLocaleString('pt-BR') : 'Aguardando a primeira coleta'}</span><label className="demo-toggle"><input type="checkbox" checked={demoMode} onChange={(event) => { setDemoMode(event.target.checked); const next = new URLSearchParams(params); for (const key of ['regiao', 'ate', 'servico']) next.delete(key); setParams(next, { replace: true }); }} />Usar dados de demonstração</label></div>
      {monitoringPage && <div className="analysis-context"><span><strong>{selection || 'Todas as regiões'}</strong>{date && <small> · Histórico até {date.replace('T', ' ')}</small>}</span>{regional && <button className="text-link" onClick={clearRegion}>Ver todas as regiões</button>}</div>}
      {monitoringPage && <p className="source-note">{demoMode ? 'Exemplos de demonstração.' : 'Lista de serviços fornecida pelo backend. Métricas e fatores regionais do ambiente monitorado.'} {snapshot.discoveryUpdatedAt && !demoMode && 'Descoberta atualizada em ' + new Date(snapshot.discoveryUpdatedAt).toLocaleString('pt-BR')+ '.'}</p>}
      {monitoringPage && error && <p className="form-message error-message" role="alert">{error}</p>}{monitoringPage && snapshot.warning && <p className="form-message" role="alert">{snapshot.warning}</p>}<Outlet />
    </main>
  </div>;
}
