import { lazy, Suspense, useEffect, useRef } from 'react';
import { Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ComparePage } from './pages/ComparePage';
import { HomePage } from './pages/HomePage';
import { ImpactPage } from './pages/ImpactPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ServicesPage } from './pages/ServicesPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import { PageBoundary } from './components/PageBoundary';
import { ServiceDetailPage } from './pages/ServiceDetailPage';

const ResearchPage = lazy(() => import('./pages/ResearchPage').then((module) => ({ default: module.ResearchPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));

const titles: Record<string, string> = {
  '/': 'Entendendo o hoje', '/dashboard': 'Visão geral', '/servicos': 'Serviços',
  '/emissoes': 'Emissões', '/energia': 'Energia', '/comparar': 'Comparar',
  '/login': 'Entrar', '/cadastro': 'Criar conta', '/configuracoes': 'Configurações',
  '/pesquisa': 'Pesquisa por região', '/gerenciamento': 'Gerenciamento do sistema',
};

export function App() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  const focusedRoute = useRef('');
  useEffect(() => {
    document.title = `${titles[pathname] ?? (pathname.startsWith('/servicos/') ? 'Detalhes do serviço' : 'Página não encontrada')} · EcoByteMetrics`;
    const route = pathname + hash;
    if (focusedRoute.current === route) return;
    const focusPage = () => {
      if (hash) {
        const target = document.getElementById(hash.slice(1));
        if (!target) return false;
        target.scrollIntoView();
        focusedRoute.current = route;
        return true;
      }
      const heading = document.querySelector<HTMLElement>('main h1');
      if (!heading || !heading.getClientRects().length) return false;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      if (navigationType !== 'POP') window.scrollTo({ top: 0, behavior: 'instant' });
      focusedRoute.current = route;
      return true;
    };
    if (focusPage()) return;
    const observer = new MutationObserver(() => { if (focusPage()) observer.disconnect(); });
    observer.observe(document.getElementById('root')!, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname, hash, navigationType]);
  return <PageBoundary key={pathname}><Suspense fallback={<p className="globe-fallback" role="status">Carregando a página…</p>}><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/cadastro" element={<LoginPage register />} />
    <Route element={<AppLayout />}>
      <Route path="/pesquisa" element={<ResearchPage />} />
      <Route path="/gerenciamento" element={<AdminPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/servicos" element={<ServicesPage />} />
      <Route path="/servicos/:id" element={<ServiceDetailPage />} />
      <Route path="/emissoes" element={<ImpactPage metric="emissions" />} />
      <Route path="/energia" element={<ImpactPage metric="energy" />} />
      <Route path="/comparar" element={<ComparePage />} />
      <Route path="/configuracoes" element={<SettingsPage />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes></Suspense></PageBoundary>;
}
