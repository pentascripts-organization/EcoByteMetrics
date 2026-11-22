import { Download, LogOut, SlidersHorizontal, Users } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { AccountCard } from "./admin/AccountCard";
import { MonitoringSettingsCard, MonitoredServicesCard } from "./admin/MonitoringCards";
import "../styles/administration.css";

const futureFeatures = [
  { title: "Gerenciamento de usuários", description: "Cadastrar, editar e gerenciar contas.", Icon: Users },
  { title: "Controle da coleta", description: "Pausar, retomar ou ajustar o intervalo.", Icon: SlidersHorizontal },
  { title: "Exportação", description: "Exportar relatórios em CSV ou JSON.", Icon: Download },
];

export function AdministrationPanel() {
  const { session, logout, pending, error } = useAuth();
  if (!session) return null;

  const signOut = () => void logout();
  return <section className="administration-panel" aria-labelledby="administration-title">
    <header className="administration-heading">
      <h2 id="administration-title">Administração</h2>
      <div className="administration-account">
        <span>{session.email}</span>
        <button type="button" disabled={pending} onClick={signOut}><LogOut size={16} aria-hidden="true" />{pending ? "Saindo…" : "Sair"}</button>
      </div>
    </header>
    {error && <p className="monitoring-notice" role="alert">{error}</p>}
    <div className="administration-grid">
      <AccountCard session={session} signOut={signOut} pending={pending} />
      <MonitoringSettingsCard />
    </div>
    <MonitoredServicesCard />
    <section className="administration-future" aria-labelledby="future-title">
      <h3 id="future-title">Recursos futuros</h3>
      <p>Funcionalidades planejadas para próximas versões.</p>
      <div className="administration-grid administration-grid--future">
        {futureFeatures.map(({ title, description, Icon }) => <article className="administration-card administration-card--future" key={title}>
          <Icon size={20} aria-hidden="true" />
          <div><h4>{title}</h4><p>{description}</p></div>
          <span className="administration-tag">Indisponível</span>
        </article>)}
      </div>
    </section>
  </section>;
}
