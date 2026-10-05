import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ComparePage } from './pages/ComparePage';
import { DashboardPage } from './pages/DashboardPage';
import { HomePage } from './pages/HomePage';
import { ImpactPage } from './pages/ImpactPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ServicesPage } from './pages/ServicesPage';
import { SettingsPage } from './pages/SettingsPage';

const titles: Record<string, string> = {
  '/': 'Entendendo o hoje', '/dashboard': 'Visão geral', '/servicos': 'Serviços',
  '/emissoes': 'Emissões', '/energia': 'Energia', '/comparar': 'Comparar',
  '/login': 'Entrar', '/configuracoes': 'Configurações',
};

export function App() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    document.title = `${titles[pathname] ?? 'Página não encontrada'} · EcoByteMetrics`;
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route element={<AppLayout />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/servicos" element={<ServicesPage />} />
      <Route path="/emissoes" element={<ImpactPage metric="emissions" />} />
      <Route path="/energia" element={<ImpactPage metric="energy" />} />
      <Route path="/comparar" element={<ComparePage />} />
      <Route path="/configuracoes" element={<SettingsPage />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>;
}
