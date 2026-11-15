import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../app/useAuth";

const links = [
  ["/", "Visão geral", "⌂"],
  ["/patients", "Pacientes", "♡"],
  ["/professionals", "Profissionais", "＋"],
  ["/specialties", "Especialidades", "✳"],
  ["/services", "Serviços", "▤"],
  ["/schedules", "Agendas", "▦"],
  ["/appointments", "Consultas", "◷"],
  ["/notifications", "Notificações", "◉"],
  ["/users", "Usuários", "♙"],
];

export function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  async function leave() {
    await signOut();
    navigate("/login");
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark small">e</span>
          <span>
            <b>e-SUS</b>
            <small>PAINEL ADMINISTRATIVO</small>
          </span>
        </div>
        <nav aria-label="Navegação principal">
          {links.map(([to, label, icon]) => (
            <NavLink
              end={to === "/"}
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-chip">
            <div className="avatar">
              {user?.user_name?.slice(0, 1).toUpperCase() ?? "A"}
            </div>
            <span>
              <b>{user?.user_name ?? "Administrador"}</b>
              <small>Administrador</small>
            </span>
          </div>
          <button className="logout" onClick={leave}>
            ↪ <span>Sair</span>
          </button>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div>
            <span className="eyebrow">SISTEMA DE GESTÃO</span>
            <h2>Administração</h2>
          </div>
          <div className="topbar-profile">
            Acesso administrativo{" "}
            <span className="avatar tiny">
              {user?.user_name?.slice(0, 1).toUpperCase() ?? "A"}
            </span>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
        <footer className="footer">e-SUS · Painel administrativo</footer>
      </div>
    </div>
  );
}
