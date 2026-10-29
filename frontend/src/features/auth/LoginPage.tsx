import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { Brand } from "@/shared/ui/Brand";
import { TopographicSides } from "@/features/monitoring/components/TopographicSides";
import { useAuth } from "./useAuth";
import { safeReturnPath } from "./api";
import "./styles.css";

export function LoginPage({ register = false }: { register?: boolean }) {
  const { session, pending, error, invalidCredentials, notice, signIn, cancelLogin } = useAuth();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const returnTo = safeReturnPath(params.get("retorno"));
  const returnQuery = params.has("retorno") ? "?" + new URLSearchParams({ retorno: returnTo }) : "";
  useEffect(() => cancelLogin, [cancelLogin]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (register || pending) return;
    await signIn({ email, password });
    setPassword("");
    setShowPassword(false);
  }
  if (session && !register) return <Navigate to={returnTo} replace />;
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
              <Link to={"/login" + returnQuery} aria-current={!register ? "page" : undefined}>Entrar</Link>
              <Link to={"/cadastro" + returnQuery} aria-current={register ? "page" : undefined}>Criar conta</Link>
            </nav>

            <div className="login-form-intro">
              <span className="login-access-icon"><LockKeyhole size={22} strokeWidth={1.6} aria-hidden="true" /></span>
              <h1 id="login-title">{register ? "Crie sua conta." : "Bem-vindo de volta."}</h1>
              <p>{register ? "Prepare seu acesso à administração do ambiente." : "Entre para acessar as configurações do seu ambiente."}</p>
            </div>

            {!register && (notice === "expired" || params.get("motivo") === "expirada") && <p className="login-notice" role="status">Sua sessão expirou. Entre novamente para continuar.</p>}
            <form aria-label={register ? "Cadastro de conta" : "Acesso à administração"} aria-busy={pending} onSubmit={submit}>
              {register && <div className="login-field">
                <label htmlFor="name">Nome</label>
                <div className="login-input"><input disabled id="name" autoComplete="name" placeholder="Seu nome" required /></div>
              </div>}

              <div className="login-field">
                <label htmlFor="email">E-mail</label>
                <div className="login-input"><input disabled={register || pending} id="email" name="email" type="email" autoComplete={register ? "email" : "username"} autoCapitalize="none" spellCheck={false} placeholder="voce@exemplo.com" required value={email} onChange={event => setEmail(event.target.value)} aria-invalid={invalidCredentials} aria-describedby={error ? "login-error" : undefined} /></div>
              </div>

              <div className="login-field">
                <label htmlFor="password">Senha</label>
                <div className="login-input">
                  <input disabled={register || pending} id="password" name="password" type={showPassword ? "text" : "password"} autoComplete={register ? "new-password" : "current-password"} placeholder="Sua senha" required minLength={register ? 8 : 1} value={password} onChange={event => setPassword(event.target.value)} aria-invalid={invalidCredentials} aria-describedby={error ? "login-error" : undefined} />
                  <button type="button" disabled={register || pending} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} aria-pressed={showPassword} aria-controls="password" onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}</button>
                </div>
                {register && <p className="login-field-help">Use pelo menos 8 caracteres.</p>}
              </div>

              {!register && error && <p className="login-error" id="login-error" role="alert">{error}</p>}
              <button disabled={register || pending} className="login-submit" type="submit">
                <span role="status">{register ? "Criar conta" : pending ? "Entrando…" : "Entrar no ambiente"}</span><ArrowRight size={17} aria-hidden="true" />
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
