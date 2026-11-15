import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { getErrorMessage } from "../lib/api";
import { supabase } from "../lib/supabase";

export function LoginPage() {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signIn(email, password);
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <section className="login-card">
        <div className="brand-mark">e</div>
        <p className="eyebrow">GESTÃO EM SAÚDE</p>
        <h1>Entrar no painel</h1>
        <p className="muted">Use suas credenciais administrativas.</p>
        {!supabase && (
          <div className="alert error">
            Configure as variáveis do Supabase em <code>.env.local</code> antes
            de entrar.
          </div>
        )}
        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={submit}>
          <label>
            E-mail
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="button primary full" disabled={busy || !supabase}>
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="login-foot">
          Acesso destinado exclusivamente a administradores.
        </p>
      </section>
    </div>
  );
}
