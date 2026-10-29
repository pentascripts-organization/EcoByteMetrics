import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
import { loginLocation } from "./api";

export function AdministrationAccess({ children }: { children: ReactNode }) {
  const { session, notice } = useAuth();
  const { pathname, search } = useLocation();
  if (!session)
    return <Navigate to={loginLocation(pathname + search, notice === "expired")} replace />;
  return children;
}
