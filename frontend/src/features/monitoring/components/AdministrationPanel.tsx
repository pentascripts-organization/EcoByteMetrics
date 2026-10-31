import { Clock3, LogOut, Radar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InfoTooltip } from "@/shared/ui/InfoTooltip";
import { useAuth } from "@/features/auth/useAuth";
import "../styles/administration.css";

export function AdministrationPanel() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  return <section className="administration-panel" aria-labelledby="administration-title">
    <header className="administration-heading">
      <div><h2 id="administration-title">Administração</h2><p>Configurações do ambiente de monitoramento.</p></div>
      {session && <div className="administration-account"><span title={session.email}>{session.email}</span><button type="button" onClick={() => { logout(); navigate("/dashboard", { replace: true }); }}><LogOut size={16} aria-hidden="true" />Sair</button></div>}
    </header>

    <div className="administration-workspace">
      <aside className="administration-navigation" aria-label="Configurações do ambiente">
        <p>Configurações</p>
        <div className="administration-current">
          <Clock3 size={19} aria-hidden="true" /><span>Coleta de métricas<small>Frequência das consultas</small></span>
        </div>
      </aside>

      <section className="administration-settings" id="administration-settings" aria-labelledby="administration-section-title">
        <header className="administration-section-heading">
          <h3 id="administration-section-title">Configuração atual da coleta</h3>
          <p>O monitoramento consulta as aplicações automaticamente a cada 30 segundos.</p>
        </header>

        <div className="administration-settings-body">
          <div className="administration-setting-group">
            <div className="administration-setting-row">
              <div>
                <div className="administration-setting-label"><span id="administration-interval-label">Intervalo entre consultas</span><InfoTooltip label="intervalo entre consultas">Define quanto tempo o nosso servidor espera entre consultas. O período representado por cada amostra é informado pela API e pode ser diferente.</InfoTooltip></div>
                <p id="administration-interval-help">Tempo de espera entre uma consulta e a próxima.</p>
              </div>
              <div className="administration-interval"><output id="administration-interval" aria-labelledby="administration-interval-label" aria-describedby="administration-interval-help">30</output><span>segundos</span></div>
            </div>
            <div className="administration-setting-row">
              <div><h4>Descoberta das aplicações</h4><p>As aplicações são identificadas pelo agregador de métricas.</p></div>
              <span className="administration-readonly"><Radar size={15} aria-hidden="true" />Automática</span>
            </div>
          </div>
          <p className="administration-field-note">O intervalo de consulta não altera o tempo representado por cada leitura.</p>
          <p className="administration-field-note">Esta configuração é somente para consulta. A alteração do intervalo ainda não está disponível.</p>
        </div>
      </section>
    </div>
  </section>;
}
