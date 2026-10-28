import { ArrowLeft, ArrowRight, ArrowUpRight, Eye, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "@/shared/ui/Brand";
import { TopographicSides } from "@/features/monitoring/components/TopographicSides";
import "./styles.css";

export function LoginPage({ register = false }: { register?: boolean }) {
  return (
    <div className="login-page">
      <a className="skip-link" href="#login-content">Pular para o formulário</a>
      <TopographicSides />
      <header className="login-header">
        <Brand />
        <Link className="login-back" to="/dashboard" aria-label="Voltar ao monitoramento">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Voltar ao monitoramento</span>
        </Link>
      </header>

      <main className="login-content" id="login-content" tabIndex={-1}>
        <div className="login-shell">
          <section className="login-form-panel" aria-labelledby="login-title">
            <nav className="login-view-tabs" aria-label="Formulários de acesso">
              <Link to="/login" aria-current={!register ? "page" : undefined}>Entrar</Link>
              <Link to="/cadastro" aria-current={register ? "page" : undefined}>Criar conta</Link>
            </nav>

            <div className="login-form-intro">
              <span className="login-access-icon"><LockKeyhole size={22} strokeWidth={1.6} aria-hidden="true" /></span>
              <h1 id="login-title">{register ? "Crie sua conta." : "Bem-vindo de volta."}</h1>
              <p>{register ? "Prepare seu acesso à administração do ambiente." : "Entre para acessar as configurações do seu ambiente."}</p>
            </div>

            <form aria-label={register ? "Cadastro de conta" : "Acesso à administração"} onSubmit={event => event.preventDefault()}>
              {register && <div className="login-field">
                <label htmlFor="name">Nome</label>
                <div className="login-input"><input disabled id="name" autoComplete="name" placeholder="Seu nome" required /></div>
              </div>}

              <div className="login-field">
                <label htmlFor="email">E-mail</label>
                <div className="login-input"><input disabled id="email" type="email" autoComplete={register ? "email" : "username"} placeholder="voce@exemplo.com" required /></div>
              </div>

              <div className="login-field">
                <label htmlFor="password">Senha</label>
                <div className="login-input">
                  <input disabled id="password" type="password" autoComplete={register ? "new-password" : "current-password"} placeholder="Sua senha" required minLength={register ? 8 : 1} />
                  <button type="button" disabled aria-label="Mostrar senha"><Eye size={17} aria-hidden="true" /></button>
                </div>
                {register && <p className="login-field-help">Use pelo menos 8 caracteres.</p>}
              </div>

              <button disabled className="login-submit" type="submit">
                <span>{register ? "Criar conta" : "Entrar no ambiente"}</span><ArrowRight size={17} aria-hidden="true" />
              </button>

            </form>
          </section>

          <div className="login-public-access">
            <Link to="/dashboard">Explorar monitoramento<ArrowUpRight size={16} aria-hidden="true" /></Link>
            <p>Consulte os indicadores sem precisar entrar.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
