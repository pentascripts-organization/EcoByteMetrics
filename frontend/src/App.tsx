import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ComparePage } from './pages/ComparePage';
import { HomePage } from './pages/HomePage';
import { ImpactPage } from './pages/ImpactPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ServicesPage } from './pages/ServicesPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';

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
  useEffect(() => {
    document.title = `${titles[pathname] ?? 'Página não encontrada'} · EcoByteMetrics`;
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return <Suspense fallback={<p className="globe-fallback" role="status">Carregando a página…</p>}><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/cadastro" element={<LoginPage register />} />
    <Route element={<AppLayout />}>
      <Route path="/pesquisa" element={<ResearchPage />} />
      <Route path="/gerenciamento" element={<AdminPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/servicos" element={<ServicesPage />} />
      <Route path="/emissoes" element={<ImpactPage metric="emissions" />} />
      <Route path="/energia" element={<ImpactPage metric="energy" />} />
      <Route path="/comparar" element={<ComparePage />} />
      <Route path="/configuracoes" element={<SettingsPage />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes></Suspense>;
}
