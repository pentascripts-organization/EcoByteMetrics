import { useState } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/shared/ui/Brand";
import { AnalysisProvider } from "@/features/monitoring/providers/AnalysisProvider";
import { analysisLink } from "@/features/monitoring/domain/analysis";

export function AppLayout() {
  const { state, search } = useLocation();
  const [entry] = useState(() => state?.homeEntry === "crossfade" ? "crossfade" : state?.homeEntry === "fade" ? "fade" : undefined);
  return <AnalysisProvider>
    <div className="monitoring-shell" data-entry={entry}>
      <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
      <header className="monitoring-header">
        <Brand />
        <nav aria-label="Navegação principal">
          <NavLink to={analysisLink("/dashboard", search)}>Monitoramento</NavLink>
          <NavLink to={analysisLink("/comparar", search)}>Comparar</NavLink>
        </nav>
        <Link className="monitoring-home" to="/"><ArrowLeft size={20} /> <span>Voltar ao início</span></Link>
      </header>
      <main tabIndex={-1} id="main-content" className="monitoring-main"><Outlet /></main>
    </div>
  </AnalysisProvider>;
}
