import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";

export function RequireAdmin() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="loading-screen">
        <span className="spinner" />
        Verificando sessão…
      </div>
    );
  return user?.role === "ADMIN" ? <Outlet /> : <Navigate to="/login" replace />;
}
