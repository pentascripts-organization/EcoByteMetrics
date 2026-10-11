import { Activity, Database, Leaf, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const steps = [
  { icon: Activity, title: 'Observar os serviços', body: 'O ponto de partida são as métricas de CPU, memória, disco e rede de cada serviço. Elas ajudam a descrever a atividade do software durante um intervalo de tempo.' },
  { icon: Zap, title: 'Estimar a energia', body: 'O modelo relaciona a atividade dos recursos à potência estimada. Com a duração do intervalo, essa potência é convertida em consumo de energia, expresso em kWh.' },
  { icon: Leaf, title: 'Calcular as emissões', body: 'A energia estimada é multiplicada pela intensidade de carbono da eletricidade na região de execução. O resultado é uma estimativa de emissões em CO₂ equivalente.' },
  { icon: Database, title: 'Acompanhar e comparar', body: 'A proposta é reunir as coletas em um histórico para visualizar tendências, comparar serviços e identificar onde investigar o consumo com mais atenção.' },
];

export function ProjectOverview() {
  return <>
    <section className="project-section workflow" aria-labelledby="workflow-title">
      <div className="project-heading">
        <span className="project-eyebrow">COMO FUNCIONA</span>
        <h2 id="workflow-title">Da atividade do software<br /><span>ao impacto ambiental.</span></h2>
        <p>Um caminho para transformar o uso de recursos em informações que ajudam a orientar escolhas mais conscientes.</p>
      </div>
      <ol className="workflow-grid">
        {steps.map(({ icon: Icon, title, body }, index) => <li key={title}>
          <div className="workflow-step"><span>0{index + 1}</span><Icon size={24} aria-hidden="true" /></div>
          <h3>{title}</h3><p>{body}</p>
        </li>)}
      </ol>
    </section>

    <section className="project-section calculation" id="dados" aria-labelledby="calculation-title">
      <div className="project-heading">
        <span className="project-eyebrow">MODELO DE CÁLCULO</span>
        <h2 id="calculation-title">Entenda o que está<br /><span>por trás dos números.</span></h2>
        <p>Potência é a taxa de consumo. Energia considera também o tempo. As emissões dependem da origem da eletricidade utilizada.</p>
        <p className="calculation-note">São estimativas: a precisão depende das métricas coletadas, do modelo de potência e do fator de carbono adotado.</p>
      </div>
      <div className="calculation-example">
        <span className="project-eyebrow">EXEMPLO ILUSTRATIVO · INTERVALO DE 60 SEGUNDOS</span>
        <div className="formula-row"><span>01 / Energia estimada</span><h3>Potência × tempo</h3><p>50,87 W × (60 ÷ 3.600) h ÷ 1.000</p><strong>≈ 0,000848 kWh</strong></div>
        <div className="formula-row"><span>02 / Emissões estimadas</span><h3>Energia × intensidade de carbono</h3><p>0,000848 kWh × 85 gCO₂e/kWh</p><strong>≈ 0,072 gCO₂e</strong></div>
        <p className="example-note">Os valores acima explicam a fórmula e não representam uma coleta real. O fator de carbono pode variar conforme a região e o período.</p>
      </div>
    </section>

    <section className="project-section project-about" id="projeto" aria-labelledby="project-title">
      <div className="project-heading">
        <span className="project-eyebrow">SOBRE O PROJETO</span>
        <h2 id="project-title">Mais clareza para<br /><span>cada escolha.</span></h2>
        <p>A EcoByteMetrics é uma plataforma voltada à análise do consumo energético e das emissões de softwares. A proposta é conectar métricas técnicas ao impacto ambiental das aplicações.</p>
      </div>
      <div className="project-details">
        <h3>O que você poderá analisar</h3>
        <p>Consumo de energia, emissões por serviço, evolução entre coletas e diferenças entre regiões de execução. Essas perspectivas ajudam a formular perguntas e a avaliar mudanças no software.</p>
        <div className="project-status"><span className="project-eyebrow">EM DESENVOLVIMENTO</span><p>As telas de análise já estão disponíveis. A integração das coletas e a autenticação ainda estão em desenvolvimento; os indicadores ficam vazios até que dados reais sejam conectados.</p></div>
        <Link className="primary-cta" to="/cadastro"><span>Conhecer o cadastro</span><ArrowRight size={18} aria-hidden="true" /></Link>
      </div>
    </section>
  </>;
}
