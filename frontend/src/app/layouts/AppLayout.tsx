import { NavLink, Outlet, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/shared/ui/Brand";
import { AnalysisProvider } from "@/features/monitoring/providers/AnalysisProvider";

export function AppLayout() {
  return <AnalysisProvider>
    <div className="monitoring-shell">
      <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
      <header className="monitoring-header">
        <Brand />
        <nav aria-label="Navegação principal">
          <NavLink to="/dashboard">Monitoramento</NavLink>
          <Link to="/#projeto">Projeto</Link>
        </nav>
        <Link className="monitoring-home" to="/"><ArrowLeft size={20} /> <span>Voltar ao início</span></Link>
      </header>
      <main tabIndex={-1} id="main-content" className="monitoring-main"><Outlet /></main>
    </div>
  </AnalysisProvider>;
}
