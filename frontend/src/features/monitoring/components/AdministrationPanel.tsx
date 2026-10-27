import { ArrowUpRight, Clock3, LockKeyhole, Radar, Save } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { InfoTooltip } from "@/shared/ui/InfoTooltip";
import "../styles/administration.css";

export function AdministrationPanel() {
  const [params, setParams] = useSearchParams();
  const section = params.get("configuracao") === "acesso" ? "acesso" : "coleta";
  const selectSection = (value: string) => {
    const next = new URLSearchParams(params);
    if (value === "coleta") next.delete("configuracao"); else next.set("configuracao", value);
    setParams(next, { replace: true });
  };

  return <section className="administration-panel" aria-labelledby="administration-title">
    <header className="administration-heading">
      <div><h2 id="administration-title">Administração</h2><p>Configurações do ambiente de monitoramento.</p></div>
    </header>

    <div className="administration-workspace">
      <nav className="administration-navigation" aria-label="Configurações do ambiente">
        <p>Configurações</p>
        <button type="button" aria-pressed={section === "coleta"} aria-controls="administration-settings" onClick={() => selectSection("coleta")}>
          <Clock3 size={19} aria-hidden="true" /><span>Coleta de métricas<small>Frequência das consultas</small></span>
        </button>
        <button type="button" aria-pressed={section === "acesso"} aria-controls="administration-settings" onClick={() => selectSection("acesso")}>
          <LockKeyhole size={19} aria-hidden="true" /><span>Acesso<small>Entrada na administração</small></span>
        </button>
      </nav>

      <section className="administration-settings" id="administration-settings" aria-labelledby="administration-section-title">
        <header className="administration-section-heading">
          <h3 id="administration-section-title">{section === "coleta" ? "Coleta de métricas" : "Acesso à administração"}</h3>
          <p>{section === "coleta" ? "Organize a frequência de consulta às aplicações monitoradas." : "Acompanhe como o acesso às configurações está organizado."}</p>
        </header>

        {section === "coleta" ? <form onSubmit={event => event.preventDefault()} aria-label="Configuração da coleta">
          <div className="administration-setting-group">
            <div className="administration-setting-row">
              <div>
                <div className="administration-setting-label"><label htmlFor="administration-interval">Intervalo entre consultas</label><InfoTooltip label="intervalo entre consultas">Define quanto tempo o nosso servidor espera entre consultas. O período representado por cada amostra é informado pela API e pode ser diferente.</InfoTooltip></div>
                <p id="administration-interval-help">Tempo de espera entre uma consulta e a próxima.</p>
              </div>
              <div className="administration-interval"><input id="administration-interval" type="number" defaultValue={30} disabled aria-describedby="administration-interval-help" /><span>segundos</span></div>
            </div>
            <div className="administration-setting-row">
              <div><h4>Descoberta das aplicações</h4><p>As aplicações são identificadas pelo agregador de métricas.</p></div>
              <span className="administration-readonly"><Radar size={15} aria-hidden="true" />Automática</span>
            </div>
          </div>
          <p className="administration-field-note">O intervalo de consulta não altera o período informado nas amostras.</p>
          <footer className="administration-actions">
            <button type="submit" className="administration-save" disabled><Save size={16} aria-hidden="true" />Salvar alterações</button>
          </footer>
        </form> : <>
          <div className="administration-setting-group">
            <div className="administration-setting-row">
              <div><h4>Acesso durante o desenvolvimento</h4><p>Esta prévia pode ser consultada sem uma conta.</p></div>
              <span className="administration-access-badge">Acesso livre</span>
            </div>
            <div className="administration-setting-row">
              <div><h4>Autenticação da conta</h4><p>A integração do login será feita em uma próxima etapa.</p></div>
              <span className="administration-pending"><i aria-hidden="true" />Ainda não conectada</span>
            </div>
          </div>
          <footer className="administration-actions administration-access-actions"><Link to="/login">Ver tela de login<ArrowUpRight size={16} aria-hidden="true" /></Link></footer>
        </>}
      </section>
    </div>
  </section>;
}
