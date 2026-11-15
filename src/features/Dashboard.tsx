import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import type { Appointment } from "../types/api";

export function Dashboard() {
  const [stats, setStats] = useState({
    patients: 0,
    professionals: 0,
    specialties: 0,
    services: 0,
    appointments: 0,
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.allSettled([
      api.get("/patients/"),
      api.get("/professionals/"),
      api.get("/specialties/"),
      api.get("/services/"),
      api.get<Appointment[]>("/appointments/"),
    ]).then((results) => {
      const counts = results.map((r) =>
        r.status === "fulfilled" && Array.isArray(r.value.data)
          ? r.value.data.length
          : 0,
      );
      setStats({
        patients: counts[0],
        professionals: counts[1],
        specialties: counts[2],
        services: counts[3],
        appointments: counts[4],
      });
      const appt = results[4];
      if (appt.status === "fulfilled")
        setAppointments(
          appt.value.data
            .filter((a) => a.status === "SCHEDULED")
            .sort((a, b) => a.start_at.localeCompare(b.start_at))
            .slice(0, 6),
        );
      else setError(getErrorMessage(appt.reason));
    });
  }, []);
  const cards = [
    ["Pacientes", stats.patients, "/patients", "♡", "teal"],
    ["Profissionais", stats.professionals, "/professionals", "＋", "blue"],
    ["Especialidades", stats.specialties, "/specialties", "✳", "violet"],
    ["Serviços", stats.services, "/services", "▤", "amber"],
  ];
  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Acompanhe os cadastros e a agenda da clínica."
      />
      {error && <div className="alert error">{error}</div>}
      <div className="stats-grid">
        {cards.map(([label, value, to, icon, color]) => (
          <Link className="stat-card" to={String(to)} key={String(label)}>
            <div className={`stat-icon ${color}`}>{icon}</div>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
            <span className="stat-arrow">↗</span>
          </Link>
        ))}
      </div>
      <section className="panel table-panel dashboard-appointments">
        <div className="table-toolbar">
          <div>
            <p className="eyebrow">AGENDA</p>
            <h3>Próximas consultas</h3>
          </div>
          <Link className="text-link" to="/appointments">
            Ver todas ↗
          </Link>
        </div>
        {appointments.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Profissional</th>
                  <th>Serviço</th>
                  <th>Data e horário</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.patient_name}</td>
                    <td>{a.professional_name}</td>
                    <td>{a.service_name}</td>
                    <td>
                      {new Date(a.start_at).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td>
                      <span className="badge success">Agendada</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">◷</div>
            <b>Nenhuma consulta próxima</b>
            <span className="muted">
              As consultas agendadas aparecerão aqui.
            </span>
          </div>
        )}
      </section>
      <div className="notice-card">
        <div className="notice-icon">i</div>
        <div>
          <b>Integração com a API</b>
          <p>
            Os indicadores são calculados a partir das listas disponíveis no
            backend. A API ainda não oferece um endpoint agregado de dashboard.
          </p>
        </div>
      </div>
    </>
  );
}
