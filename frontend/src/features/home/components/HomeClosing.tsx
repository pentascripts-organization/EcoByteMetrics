import { ArrowDown, ArrowUpRight, Plus } from "lucide-react";
import { DashboardLink } from "./DashboardLink";
import { HomeBrand } from "./HomeBrand";

const questions = [
  { title: "Preciso criar uma conta para explorar?", body: "Não. Você pode abrir o monitoramento diretamente e consultar as aplicações que o ambiente disponibiliza. A busca e os filtros ajudam a encontrar um serviço específico." },
  { title: "Os números são medições diretas de energia?", body: "São estimativas calculadas a partir das métricas disponíveis, do modelo de potência e da intensidade de carbono associada à região do serviço. Elas ajudam a investigar padrões e devem ser interpretadas com esse contexto." },
  { title: "O que os pontos no globo representam?", body: "Eles mostram a localização informada para os serviços. Aplicações na mesma coordenada aparecem agrupadas, com a quantidade de serviços daquele ponto. Isso não significa que estejam no mesmo computador." },
  { title: "Por que uma aplicação pode aparecer sem estimativas?", body: "Uma coleta pode estar indisponível, desatualizada ou sem os dados necessários para completar o cálculo. O monitoramento sinaliza essas situações, sem tratar a ausência de dados como consumo zero." },
];

export function HomeClosing() {
  return <>
    <section className="home-purpose" id="projeto" aria-labelledby="purpose-heading">
      <div className="purpose-heading" data-reveal><p className="chapter-label">O propósito da EcoByteMetrics</p><h2 id="purpose-heading">Entender melhor.<br />Escolher com consciência.</h2></div>
      <div className="purpose-copy" data-reveal><p>O impacto do software começa muito antes de aparecer em um gráfico. Está no processamento, nos dados em movimento e na eletricidade que torna tudo isso possível.</p><p>Nosso papel é dar visibilidade a essa relação. Reunir serviços, recursos e estimativas em um lugar onde você possa observar, comparar e encontrar as próximas perguntas.</p><a href="#home-questions">Algumas respostas para começar<ArrowDown size={17} aria-hidden="true" /></a></div>
    </section>
    <section className="home-questions" id="home-questions" aria-labelledby="questions-heading">
      <div data-reveal><p className="chapter-label">Antes de explorar</p><h2 id="questions-heading">Clareza desde<br />o primeiro acesso.</h2></div>
      <div className="questions-list" data-reveal>{questions.map(({ title, body }) => <details key={title}><summary><span>{title}</span><Plus size={20} strokeWidth={1.3} aria-hidden="true" /></summary><p>{body}</p></details>)}</div>
    </section>
    <section className="home-invitation" aria-labelledby="invitation-heading">
      <div className="invitation-copy" data-reveal><p>O próximo passo começa com um novo olhar.</p><h2 id="invitation-heading">Veja o seu software<br />sob uma nova luz.</h2><DashboardLink className="home-explore"><span>Explorar monitoramento</span><span className="home-explore__arrow"><ArrowUpRight size={22} strokeWidth={1.6} aria-hidden="true" /></span></DashboardLink></div>
    </section>
    <footer className="home-footer">
      <div className="footer-top"><HomeBrand /><p>Tecnologia em perspectiva.<br />Escolhas mais conscientes.</p><a className="footer-back" href="#inicio">Voltar ao início<ArrowUpRight size={17} aria-hidden="true" /></a></div>
      <div className="footer-links"><nav aria-label="Navegação do rodapé"><DashboardLink>Monitoramento</DashboardLink><a href="#solucoes">Como funciona</a><a href="#projeto">O projeto</a></nav><a href="https://github.com/pentascripts-organization/EcoByteMetrics" target="_blank" rel="noreferrer">Código do projeto<ArrowUpRight size={14} aria-hidden="true" /></a></div>
      <div className="footer-bottom"><span>EcoByteMetrics · Energia e carbono em software.</span></div>
    </footer>
  </>;
}
