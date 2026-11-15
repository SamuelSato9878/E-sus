import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";
import type { User } from "../types/api";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUser(session: Session | null) {
    if (!session) {
      await Promise.resolve();
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get<User>("/auth/me");
      if (data.role !== "ADMIN") {
        await supabase?.auth.signOut();
        setUser(null);
        return;
      }
      setUser(data);
    } catch {
      await supabase?.auth.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!supabase) {
      Promise.resolve().then(() => setLoading(false));
      return;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) void loadUser(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted)
          setTimeout(() => {
            if (mounted) void loadUser(session);
          }, 0);
      },
    );
    const expire = () => {
      setUser(null);
      setLoading(false);
    };
    window.addEventListener("admin-session-expired", expire);
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
      window.removeEventListener("admin-session-expired", expire);
    };
  }, []);

  async function signIn(email: string, password: string) {
    if (!supabase)
      throw new Error(
        "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local.",
      );
    const { data } = await api.post<{
      access_token: string;
      refresh_token: string;
    }>("/auth/login", { email, password });
    if (!data.access_token || !data.refresh_token)
      throw new Error("A API não retornou os tokens de sessão.");
    const { error } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
    if (error) throw error;
    const { data: profile } = await api.get<User>("/auth/me");
    if (profile.role !== "ADMIN") {
      await supabase.auth.signOut();
      throw new Error("Acesso restrito a usuários administradores.");
    }
    setUser(profile);
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setUser(null);
  }
  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
