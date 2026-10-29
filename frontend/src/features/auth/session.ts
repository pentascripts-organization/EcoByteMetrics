import { authenticatedRequest, login, loginErrorMessage } from "./api.ts";
import type { AuthSession, Credentials } from "./api.ts";
import { RequestError } from "../../shared/lib/http.ts";

export interface AuthState {
  session: AuthSession | null;
  pending: boolean;
  error: string | null;
  invalidCredentials: boolean;
  notice: "expired" | null;
}

export function createAuthStore() {
  const initial: AuthState = { session: null, pending: false, error: null, invalidCredentials: false, notice: null };
  let state = initial;
  let pending: AbortController | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const update = (next: AuthState) => { state = next; listeners.forEach(listener => listener()); };
  const clear = (notice: AuthState["notice"] = null) => {
    pending?.abort(); pending = null;
    clearTimeout(timer); timer = undefined;
    update({ ...initial, notice });
  };
  const checkExpiration = () => {
    if (state.session && state.session.expiresAt <= Date.now()) clear("expired");
    return state.session;
  };
  const scheduleExpiration = () => {
    clearTimeout(timer);
    if (checkExpiration()) timer = setTimeout(scheduleExpiration, Math.min(state.session!.expiresAt - Date.now(), 2_147_483_647));
  };

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    checkExpiration,
    async signIn(credentials: Credentials): Promise<boolean> {
      if (pending) return false;
      const controller = new AbortController();
      pending = controller;
      clearTimeout(timer);
      update({ ...initial, pending: true });
      try {
        const session = await login(credentials, controller.signal);
        if (pending !== controller || controller.signal.aborted) return false;
        update({ ...initial, session });
        scheduleExpiration();
        return true;
      } catch (error) {
        if (pending === controller && !controller.signal.aborted) update({ ...initial, error: loginErrorMessage(error),
          invalidCredentials: error instanceof RequestError && (error.status === 401 || error.status === 400) });
        return false;
      } finally {
        if (pending === controller) pending = null;
      }
    },
    cancelLogin() {
      pending?.abort(); pending = null;
      if (state.pending || state.error) update({ ...state, pending: false, error: null, invalidCredentials: false });
    },
    logout: () => clear(),
    dispose: () => clear(),
    async request(path: string, options?: { signal?: AbortSignal }) {
      const session = checkExpiration();
      if (!session) throw new RequestError("http", "Entre para continuar.", 401);
      try {
        const result = await authenticatedRequest(path, session, options);
        if (checkExpiration() !== session) throw new DOMException("Sessão encerrada", "AbortError");
        return result;
      }
      catch (error) {
        if (error instanceof RequestError && error.status === 401 && state.session === session) clear("expired");
        throw error;
      }
    },
  };
}

export type AuthStore = ReturnType<typeof createAuthStore>;
