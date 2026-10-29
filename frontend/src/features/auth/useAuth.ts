import { useContext, useSyncExternalStore } from "react";
import { AuthContext } from "./AuthContext";

export function useAuth() {
  const store = useContext(AuthContext);
  if (!store) throw new Error("useAuth requires AuthProvider");
  return { ...useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot),
    signIn: store.signIn, cancelLogin: store.cancelLogin, logout: store.logout, request: store.request };
}
