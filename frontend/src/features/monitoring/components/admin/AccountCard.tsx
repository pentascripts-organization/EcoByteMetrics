import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { LogOut, Pencil, UserRound, X } from "lucide-react";
import { validateRegistration } from "@/features/auth/api";
import type { AuthSession, RegistrationErrors } from "@/features/auth/api";
import { useAuth } from "@/features/auth/useAuth";
import { RequestError } from "@/shared/lib/http";

export function AccountCard({ session, signOut, pending }: { session: AuthSession; signOut: () => void; pending: boolean }) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const edit = useRef<HTMLButtonElement>(null);

  return <section className="administration-card" aria-labelledby="account-title">
    <header className="administration-card-heading">
      <UserRound size={22} aria-hidden="true" />
      <div><h3 id="account-title">Minha conta</h3><p>Dados da sua conta e permissões de acesso.</p></div>
    </header>
    <dl className="administration-details">
      <div><dt>E-mail</dt><dd>{session.email}</dd></div>
      <div><dt>Perfil de acesso</dt><dd><span className="administration-tag administration-tag--profile">{session.role}</span></dd></div>
    </dl>
    <div className="administration-actions">
      <button ref={edit} type="button" disabled={pending} onClick={() => { setSaved(false); setEditing(true); }}><Pencil size={15} aria-hidden="true" />Editar conta</button>
      <button type="button" disabled={pending} onClick={signOut}><LogOut size={15} aria-hidden="true" />{pending ? "Aguarde…" : "Sair"}</button>
    </div>
    {saved && <p className="administration-success" role="status">Conta atualizada com sucesso.</p>}
    {editing && <EditAccountDialog session={session} onClose={success => {
      setEditing(false);
      setSaved(success);
      requestAnimationFrame(() => edit.current?.focus());
    }} />}
  </section>;
}

function EditAccountDialog({ session, onClose }: { session: AuthSession; onClose: (saved: boolean) => void }) {
  const { request, renewSession } = useAuth();
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(session.email);
  const [password, setPassword] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<RegistrationErrors>({});
  const resource = "/api/users/" + session.id;
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void request(resource, { signal: controller.signal }).then(value => {
      if (!value || typeof value !== "object" || !("id_user" in value) || value.id_user !== session.id ||
        !("name_user" in value) || typeof value.name_user !== "string" ||
        !("email_user" in value) || typeof value.email_user !== "string") throw new Error("Conta inválida.");
      if (!controller.signal.aborted) { setName(value.name_user); setEmail(value.email_user); setLoaded(true); }
    }).catch(() => { if (!controller.signal.aborted) setError("Não foi possível carregar sua conta. Feche e tente novamente."); });
    return () => controller.abort();
  }, [request, resource, session.id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loaded || saving) return;
    setError("");
    const invalid = validateRegistration({ name, email, password });
    setFields(invalid);
    if (Object.keys(invalid).length) return;
    setSaving(true);
    const nextEmail = email.trim().toLowerCase();
    try {
      await request(resource, {
        method: "PUT",
        body: JSON.stringify({ name_user: name.trim(), email_user: nextEmail, password_user: password }),
      });
      const renewed = await renewSession({ email: nextEmail, password }, session);
      onClose(renewed);
    } catch (cause) {
      setError(cause instanceof RequestError && cause.status === 409
        ? "Este e-mail já está em uso."
        : "Não foi possível confirmar a atualização da conta. Confira os dados e tente novamente.");
    } finally {
      setPassword("");
      setSaving(false);
    }
  }

  return <dialog ref={dialog} className="administration-dialog" aria-labelledby={title} onCancel={event => {
    event.preventDefault();
    if (!saving) onClose(false);
  }}>
    <header><h3 id={title}>Editar conta</h3><button type="button" aria-label="Fechar edição" disabled={saving} onClick={() => onClose(false)}><X size={19} aria-hidden="true" /></button></header>
    {error && <p role="alert">{error}</p>}
    {!loaded && !error && <p role="status">Consultando sua conta…</p>}
    {loaded && <form onSubmit={submit} noValidate>
      <p>Para salvar, defina uma nova senha. A API exige esse campo em toda atualização.</p>
      <fieldset disabled={saving}>
        <label>Nome<input name="name" autoComplete="name" value={name} onChange={event => setName(event.target.value)} aria-invalid={Boolean(fields.name)} aria-describedby={fields.name ? title + "-name" : undefined} />{fields.name && <small id={title + "-name"}>{fields.name}</small>}</label>
        <label>E-mail<input name="email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} aria-invalid={Boolean(fields.email)} aria-describedby={fields.email ? title + "-email" : undefined} />{fields.email && <small id={title + "-email"}>{fields.email}</small>}</label>
        <label>Nova senha<input name="password" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} aria-invalid={Boolean(fields.password)} aria-describedby={fields.password ? title + "-password" : undefined} />{fields.password && <small id={title + "-password"}>{fields.password}</small>}</label>
      </fieldset>
      <footer className="administration-actions">
        {Object.keys(fields).length > 0 && <span className="sr-only" role="alert">Confira os campos indicados.</span>}
        <button type="button" disabled={saving} onClick={() => onClose(false)}>Cancelar</button>
        <button className="administration-primary" type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}</button>
      </footer>
    </form>}
  </dialog>;
}
