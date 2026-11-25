import { useContext, useSyncExternalStore } from "react";
import { AuthContext } from "./AuthContext";

export function useAuth() {
  const store = useContext(AuthContext);
  if (!store) throw new Error("useAuth requires AuthProvider");
  return { ...useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot),
    acknowledgeSignOut: store.acknowledgeSignOut, signIn: store.signIn, signUp: store.signUp, cancelLogin: store.cancelLogin, logout: store.logout, request: store.request, expireSession: store.expireSession, renewSession: store.renewSession };
}
