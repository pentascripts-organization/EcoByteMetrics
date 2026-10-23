import { ArrowUpRight, ChartNoAxesCombined, Globe2, ScanLine } from "lucide-react";
import { DashboardLink } from "./DashboardLink";

export function MonitoringOverview() {
  return <section className="impact-lab" id="dados" aria-labelledby="monitoring-heading">
    <div className="monitoring-preview">
      <div className="monitoring-preview__copy" data-reveal>
        <p className="chapter-label">Seu software em perspectiva</p>
        <h2 id="monitoring-heading">Uma visão ampla.<br /><span>Um olhar preciso.</span></h2>
        <p>Do lugar onde sua aplicação roda aos recursos que ela utiliza. Conecte os pontos e descubra o que os dados revelam sobre o seu impacto.</p>
        <DashboardLink className="monitoring-preview__link">Conhecer o dashboard<ArrowUpRight size={20} strokeWidth={1.5} aria-hidden="true" /></DashboardLink>
        <span className="monitoring-preview__caption">Explore o mundo. Entenda cada serviço.</span>
      </div>
      <ol className="monitoring-preview__steps" aria-label="O que explorar no monitoramento">
        <li data-reveal>
          <span className="monitoring-preview__number" aria-hidden="true">01</span>
          <div><Globe2 size={25} strokeWidth={1.2} aria-hidden="true" /><h3>Encontre no mundo.</h3><p>Navegue pelo globo e veja onde os serviços estão localizados. Cada ponto abre uma nova perspectiva.</p></div>
        </li>
        <li data-reveal>
          <span className="monitoring-preview__number" aria-hidden="true">02</span>
          <div><ScanLine size={25} strokeWidth={1.2} aria-hidden="true" /><h3>Olhe mais de perto.</h3><p>Explore os recursos de cada aplicação e suas estimativas de energia e emissões, com o contexto da região.</p></div>
        </li>
        <li data-reveal>
          <span className="monitoring-preview__number" aria-hidden="true">03</span>
          <div><ChartNoAxesCombined size={25} strokeWidth={1.2} aria-hidden="true" /><h3>Perceba o que muda.</h3><p>Acompanhe a evolução entre as amostras e identifique mudanças no comportamento dos serviços.</p></div>
        </li>
      </ol>
    </div>
  </section>;
}
