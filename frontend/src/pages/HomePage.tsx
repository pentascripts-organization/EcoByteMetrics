import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUpRight, ChartNoAxesCombined, Cpu, Globe2, Leaf, Menu, Server, Sparkles, Sprout, X, Zap } from 'lucide-react';
import { Brand } from '../components/Brand';
import { LeafScene } from '../components/LeafScene';
import { IconTile } from '../components/UI';

const steps = [
  { icon: Server, number: '01', title: 'Tudo começa nos dados.', text: 'Métricas de CPU, memória, disco e rede conectam sua infraestrutura à análise ambiental.' },
  { icon: Zap, number: '02', title: 'Energia ganha contexto.', text: 'O uso de recursos se transforma em uma estimativa de energia, considerando o tempo de execução.' },
  { icon: Leaf, number: '03', title: 'Impacto fica visível.', text: 'A intensidade de carbono de cada região permite estimar as emissões e comparar os serviços.' },
];

export function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="home-page"><a className="skip-link" href="#home-content">Pular para o conteúdo</a>
    <section className="home-hero" id="inicio"><div className="landscape-background" aria-hidden="true" /><div className="sun-glow" aria-hidden="true" /><LeafScene />
      <header className="home-header"><Brand /><nav className="home-nav" aria-label="Navegação principal"><a href="#solucao">A plataforma</a><a href="#como-funciona">Como funciona</a><a href="#proposito">Nosso propósito</a></nav>
        <div className="header-actions"><Link to="/login" className="home-login">Entrar<ArrowUpRight size={14} /></Link><Link to="/dashboard" className="button button-dark button-small">Explorar<ArrowUpRight size={16} /></Link><button className="mobile-menu-button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="home-mobile-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button></div>
        {menuOpen && <nav id="home-mobile-nav" className="home-mobile-nav" aria-label="Navegação móvel"><a href="#solucao" onClick={() => setMenuOpen(false)}>A plataforma</a><a href="#como-funciona" onClick={() => setMenuOpen(false)}>Como funciona</a><a href="#proposito" onClick={() => setMenuOpen(false)}>Nosso propósito</a><Link to="/login">Entrar</Link></nav>}
      </header>
      <main id="home-content" className="hero-content"><div className="hero-copy"><span className="pill-label"><span className="green-dot" />TECNOLOGIA COM PROPÓSITO</span>
        <h1>Cada byte conta.<br />Para um futuro<br /><span>mais leve.</span></h1>
        <p>Seu software também deixa uma pegada.<br className="desktop-break" /> Entenda o consumo de energia e as emissões da sua infraestrutura — e faça escolhas mais conscientes.</p>
        <div className="hero-actions"><Link className="button button-dark" to="/dashboard">Explorar dashboard<ArrowUpRight size={19} /></Link><a className="button button-glass" href="#como-funciona">Como funciona<ArrowDown size={17} /></a></div>
        <div className="hero-note"><span className="small-leaf"><Sprout size={17} /></span>Mais clareza nos dados. Mais consciência nas decisões.</div>
      </div>
      <div className="hero-visual" aria-label="Métricas de software se transformam em indicadores ambientais"><div className="orbit orbit-outer" /><div className="orbit orbit-inner" />
        <div className="planet-core"><img src="/assets/logo.png" width="116" height="107" alt="" /><span>Software consciente.</span><small>Um impacto mais leve.</small></div>
        <div className="orbit-card orbit-card-cpu"><Cpu size={21} /><div><strong>Métricas</strong><span>O ponto de partida</span></div></div>
        <div className="orbit-card orbit-card-energy"><Zap size={21} /><div><strong>Energia</strong><span>Cada recurso importa</span></div></div>
        <div className="orbit-card orbit-card-carbon"><Leaf size={21} /><div><strong>Menos impacto</strong><span>Mais possibilidades</span></div></div>
        <span className="orbit-spark spark-one"><Sparkles size={22} /></span><span className="orbit-spark spark-two"><span className="green-dot" /></span>
      </div></main>
      <div className="hero-bottom"><span>DO CÓDIGO À CONSCIÊNCIA AMBIENTAL</span><a href="#solucao">Um novo olhar para sua infraestrutura<ArrowDown size={15} /></a></div>
    </section>
    <section id="solucao" className="solution-section section-container"><div className="section-heading"><div><span className="eyebrow">UM OLHAR ALÉM DA PERFORMANCE</span><h2>Bom para o seu software.<br /><span>Melhor para o amanhã.</span></h2></div><p>Transforme métricas técnicas em uma visão clara do impacto ambiental das suas aplicações.</p></div>
      <div className="feature-grid">{[
        { icon: ChartNoAxesCombined, tag: 'VISIBILIDADE', title: 'O impacto, em perspectiva.', text: 'Acompanhe energia e emissões de CO₂e em um dashboard pensado para tornar o complexo compreensível.', to: '/dashboard', label: 'Conhecer o dashboard' },
        { icon: Globe2, tag: 'CONTEXTO', title: 'Cada região faz diferença.', text: 'Entenda como a localização dos serviços e a matriz elétrica influenciam a pegada do seu software.', to: '/servicos', label: 'Explorar serviços' },
        { icon: Sprout, tag: 'ESCOLHAS', title: 'Dados para ir mais longe.', text: 'Compare aplicações e encontre caminhos para uma infraestrutura mais eficiente e consciente.', to: '/comparar', label: 'Comparar impactos' },
      ].map(({ icon, tag, title, text, to, label }) => <article className="feature-card" key={tag}><IconTile icon={icon} /><span className="eyebrow">{tag}</span><h3>{title}</h3><p>{text}</p><Link className="text-link" to={to}>{label}<ArrowUpRight size={16} /></Link></article>)}</div>
    </section>
    <section id="como-funciona" className="how-section"><div className="section-container"><div className="section-heading"><div><span className="eyebrow">SIMPLES DE ENTENDER. RELEVANTE PARA DECIDIR.</span><h2>Da infraestrutura<br /><span>ao impacto ambiental.</span></h2></div><p>Um caminho transparente entre os recursos que suas aplicações usam e a pegada que elas deixam.</p></div>
      <div className="steps-grid">{steps.map(({ icon: Icon, number, title, text }) => <article className="step-card" key={number}><div className="step-top"><span>{number}</span><Icon size={26} strokeWidth={1.4} /></div><h3>{title}</h3><p>{text}</p></article>)}</div>
      <div className="formula-strip"><Leaf size={21} /><span>Energia estimada<span className="formula-symbol">×</span>Intensidade de carbono<span className="formula-symbol">=</span><strong>Emissões de CO₂e</strong></span><span className="formula-caption">Estimativas para decisões conscientes.</span></div>
    </div></section>
    <section id="proposito" className="purpose-section"><div className="purpose-shade" /><div className="section-container purpose-content"><span className="pill-label"><Sprout size={14} />PEQUENHAS ESCOLHAS. NOVOS CAMINHOS.</span><h2>O futuro também<br />se escreve em código.</h2><p>Acreditamos que compreender o impacto é o primeiro passo para transformá-lo. Vamos construir uma tecnologia mais consciente, um byte de cada vez.</p><Link className="button button-light" to="/dashboard">Comece a explorar<ArrowRight size={18} /></Link></div></section>
    <footer className="home-footer section-container"><Brand /><span>Tecnologia com consciência ambiental.</span><a href="#inicio">Voltar ao início<ArrowUpRight size={15} /></a></footer>
  </div>;
}
