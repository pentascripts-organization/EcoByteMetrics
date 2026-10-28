export function ProjectOverview() {
  return (
    <>
      <section
        className="project-section project-about"
        id="projeto"
        aria-labelledby="project-title"
      >
        <div className="project-heading">
          <span className="project-eyebrow">SOBRE O PROJETO</span>
          <h2 id="project-title">
            Mais clareza para
            <br />
            <span>cada escolha.</span>
          </h2>
          <p>
            A EcoByteMetrics é uma plataforma voltada à análise do consumo
            energético e das emissões de softwares. A proposta é conectar
            métricas técnicas ao impacto ambiental das aplicações.
          </p>
        </div>
        <div className="project-details">
          <h3>O que você poderá analisar</h3>
          <p>
            Consumo de energia, emissões por serviço, evolução entre coletas e
            diferenças entre regiões de execução. Essas perspectivas ajudam a
            formular perguntas e a avaliar mudanças no software.
          </p>
        </div>
      </section>
    </>
  );
}
