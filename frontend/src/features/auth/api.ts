import { requestJson, RequestError } from "../../shared/lib/http.ts";

export interface Credentials { email: string; password: string }
export interface AuthSession { token: string; email: string; expiresAt: number }

const backend = (import.meta.env?.VITE_BACKEND_URL ?? "/backend").replace(/\/+$/, "");

export function parseSession(value: unknown, now = Date.now()): AuthSession {
  const invalid = () => new RequestError("format", "O servidor retornou uma sessão inválida. Tente entrar novamente.");
  if (!value || typeof value !== "object" || !("token" in value) || !("tokenType" in value) || value.tokenType !== "Bearer" ||
    typeof value.token !== "string" || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(value.token)) throw invalid();
  try {
    const encoded = value.token.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const payload: unknown = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded), char => char.charCodeAt(0))));
    if (!payload || typeof payload !== "object" || !("exp" in payload) || !("email" in payload) ||
      typeof payload.exp !== "number" || !Number.isSafeInteger(payload.exp) || payload.exp * 1000 <= now ||
      typeof payload.email !== "string" || !payload.email.trim()) throw invalid();
    // O payload orienta a interface e o prazo; a assinatura e as permissões são validadas pelo backend.
    return { token: value.token, email: payload.email, expiresAt: payload.exp * 1000 };
  } catch { throw invalid(); }
}

export async function login(credentials: Credentials, signal: AbortSignal): Promise<AuthSession> {
  const result = await requestJson(backend + "/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: credentials.email.trim().toLowerCase(), password: credentials.password }), signal,
  });
  return parseSession(result);
}

export function loginErrorMessage(error: unknown): string {
  if (error instanceof RequestError) {
    if (error.kind === "network") return "Não foi possível conectar ao serviço de acesso. Verifique a conexão e tente novamente.";
    if (error.kind === "timeout") return "O serviço de acesso demorou para responder. Tente novamente.";
    if (error.kind === "format") return "A resposta do serviço de acesso é inválida. Tente novamente mais tarde.";
    if (error.status === 401) return "E-mail ou senha incorretos. Confira os dados e tente novamente.";
    if (error.status === 400) return "Confira o e-mail e a senha informados.";
    if (error.status === 429) return "Muitas tentativas de acesso. Aguarde um pouco antes de tentar novamente.";
  }
  return "O serviço de acesso está indisponível no momento. Tente novamente mais tarde.";
}

export function authenticatedRequest(path: string, session: AuthSession, options: { signal?: AbortSignal } = {}) {
  if (!path.startsWith("/api/") || /[\\#?]/.test(path)) throw new Error("Caminho de API autenticada inválido.");
  return requestJson(backend + path, { ...options, headers: { Authorization: "Bearer " + session.token } });
}

const defaultReturn = "/dashboard?aba=administracao";

export function safeReturnPath(value: string | null): string {
  try {
    const url = new URL(value ?? defaultReturn, "https://ecobytemetrics.invalid");
    if (url.origin === "https://ecobytemetrics.invalid" && url.pathname === "/dashboard") return url.pathname + url.search;
  } catch { /* Um destino inválido volta à administração. */ }
  return defaultReturn;
}

export function loginLocation(returnTo: string, expired = false): string {
  const params = new URLSearchParams({ retorno: safeReturnPath(returnTo) });
  if (expired) params.set("motivo", "expirada");
  return "/login?" + params;
}
