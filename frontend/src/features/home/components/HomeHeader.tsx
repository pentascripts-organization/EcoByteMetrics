import { ArrowUpRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { DashboardLink } from "./DashboardLink";
import { HomeBrand } from "@/features/home/components/HomeBrand";

export function HomeHeader() {
  const { hash } = useLocation();
  const section = hash || "#inicio";
  return (
    <header className="site-header" aria-label="Cabeçalho principal">
      <HomeBrand />
      <nav className="home-navigation" aria-label="Navegação principal">
        <Link to="#inicio" aria-current={section === "#inicio" ? "location" : undefined}>Início</Link>
        <Link to="#solucoes" aria-current={section === "#solucoes" ? "location" : undefined}>Como funciona</Link>
        <Link to="#projeto" aria-current={section === "#projeto" ? "location" : undefined}>O projeto</Link>
      </nav>
      <div className="header-actions">
        <DashboardLink className="platform-link">
          <span>Monitoramento</span>
          <ArrowUpRight size={19} strokeWidth={1.7} aria-hidden="true" />
        </DashboardLink>
      </div>
    </header>
  );
}
