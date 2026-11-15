import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { api, getErrorMessage } from "../lib/api";
import type {
  Appointment,
  MedicalService,
  Patient,
  Professional,
} from "../types/api";
import { PageHeader } from "../components/PageHeader";
import { DateInput, DateTimeInput } from "../components/DateInput";

export function AppointmentsPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<MedicalService[]>([]);
  const [status, setStatus] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<Record<string, any> | null>(null);
  const [create, setCreate] = useState(false);
  const [reschedule, setReschedule] = useState<Appointment | null>(null);
  const [busy, setBusy] = useState(false);
  const [clock, setClock] = useState(0);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingProfessional, setBookingProfessional] = useState("");
  const [bookingService, setBookingService] = useState("");
  const [availableWindows, setAvailableWindows] = useState<
    { start_at: string; end_at: string }[]
  >([]);
  useEffect(() => {
    const initial = window.setTimeout(() => setClock(Date.now()), 0);
    const timer = window.setInterval(() => setClock(Date.now()), 30000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, []);
  const load = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      if (start) params.start = start;
      if (end) params.end = end;
      const { data } = await api.get<Appointment[]>("/appointments/", {
        params,
      });
      setItems(data);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, [status, start, end]);
  useEffect(() => {
    void load();
    void Promise.all([
      api.get("/patients/"),
      api.get("/professionals/"),
      api.get("/services/"),
    ])
      .then(([p, r, s]) => {
        setPatients(p.data);
        setProfessionals(r.data);
        setServices(s.data);
      })
      .catch((e) => setError(getErrorMessage(e)));
  }, [load]);
  async function openDetail(id: number) {
    try {
      const { data } = await api.get(`/appointments/${id}`);
      setDetail(data);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }
  async function action(id: number, kind: "cancel" | "complete") {
    const reason =
      kind === "cancel"
        ? window.prompt("Motivo do cancelamento (opcional):")
        : null;
    if (kind === "cancel" && reason === null) return;
    try {
      await api.post(
        `/appointments/${id}/${kind}`,
        kind === "cancel" ? { reason } : {},
      );
      setError("");
      await load();
      if (detail?.id === id) await openDetail(id);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }
  async function checkBookingAvailability() {
    if (!bookingDate || !bookingProfessional || !bookingService) {
      setError(
        "Selecione profissional, serviço e data para consultar horários.",
      );
      return;
    }
    try {
      setError("");
      const { data } = await api.get<{
        windows: { start_at: string; end_at: string }[];
      }>("/availability/windows", {
        params: {
          professional_id: bookingProfessional,
          service_id: bookingService,
          date: bookingDate,
        },
      });
      setAvailableWindows(data.windows);
    } catch (x) {
      setError(getErrorMessage(x));
      setAvailableWindows([]);
    }
  }
  async function createAppointment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const localDateTime = `${bookingDate}T${bookingTime}`;
    const startAt = new Date(localDateTime);
    const available = availableWindows.some(
      (w) => startAt >= new Date(w.start_at) && startAt <= new Date(w.end_at),
    );
    if (!available) {
      setError(
        "Consulte a disponibilidade e escolha um horário dentro de uma das janelas apresentadas.",
      );
      return;
    }
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.post("/appointments/", {
        patient_id: Number(form.get("patient_id")),
        professional_id: Number(bookingProfessional),
        service_id: Number(bookingService),
        start_at: startAt.toISOString(),
      });
      setCreate(false);
      setAvailableWindows([]);
      await load();
    } catch (x) {
      setError(getErrorMessage(x));
    } finally {
      setBusy(false);
    }
  }
  async function moveAppointment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!reschedule) return;
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.post(`/appointments/${reschedule.id}/reschedule`, {
        start_at: new Date(String(form.get("start_at"))).toISOString(),
        reason: String(form.get("reason") || "") || null,
      });
      setReschedule(null);
      await load();
    } catch (x) {
      setError(getErrorMessage(x));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Consultas"
        description="Consulte a agenda e gerencie cancelamentos, remarcações e finalizações."
        action={
          <button className="button primary" onClick={() => setCreate(true)}>
            ＋ Agendar consulta
          </button>
        }
      />
      {error && (
        <div className="alert error">
          {error}
          <button className="alert-close" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
      <section className="panel table-panel">
        <div className="table-toolbar">
          <div>
            <h3>Agenda de consultas</h3>
            <span className="muted small-text">{items.length} consultas</span>
          </div>
          <div className="filters">
            <select
              aria-label="Filtrar por status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="SCHEDULED">Agendadas</option>
              <option value="CANCELLED">Canceladas</option>
              <option value="COMPLETED">Finalizadas</option>
            </select>
            <DateInput
              ariaLabel="Data inicial"
              value={start}
              onChange={setStart}
            />
            <DateInput
              ariaLabel="Data final"
              value={end}
              onChange={setEnd}
            />
          </div>
        </div>
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◷</div>
            <b>Nenhuma consulta encontrada</b>
            <span className="muted">
              Ajuste os filtros ou agende uma consulta.
            </span>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Profissional</th>
                  <th>Serviço</th>
                  <th>Data e horário</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
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
                      <span
                        className={`badge ${a.status === "SCHEDULED" ? "success" : a.status === "COMPLETED" ? "neutral" : "danger"}`}
                      >
                        {a.status === "SCHEDULED"
                          ? "Agendada"
                          : a.status === "COMPLETED"
                            ? "Finalizada"
                            : "Cancelada"}
                      </span>
                    </td>
                    <td className="actions">
                      <button
                        className="text-button"
                        onClick={() => void openDetail(a.id)}
                      >
                        Detalhes
                      </button>
                      {a.status === "SCHEDULED" && (
                        <>
                          <button
                            className="text-button"
                            onClick={() => setReschedule(a)}
                          >
                            Remarcar
                          </button>
                          <button
                            className="icon-button danger-text"
                            title="Cancelar"
                            onClick={() => void action(a.id, "cancel")}
                          >
                            ×
                          </button>
                          {clock > 0 &&
                            new Date(a.start_at).getTime() <= clock && (
                              <button
                                className="icon-button"
                                title="Finalizar"
                                onClick={() => void action(a.id, "complete")}
                              >
                                ✓
                              </button>
                            )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {create && (
        <Modal
          title="Agendar consulta"
          onClose={() => {
            setCreate(false);
            setAvailableWindows([]);
          }}
        >
          <form className="entity-form" onSubmit={createAppointment}>
            <div className="form-grid">
              <label>
                Paciente
                <select name="patient_id" required>
                  <option value="">Selecione…</option>
                  {patients
                    .filter((p) => p.is_active)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.user_name} · {p.cpf}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Profissional
                <select
                  required
                  value={bookingProfessional}
                  onChange={(e) => {
                    setBookingProfessional(e.target.value);
                    setAvailableWindows([]);
                  }}
                >
                  <option value="">Selecione…</option>
                  {professionals
                    .filter((p) => p.is_active)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Serviço
                <select
                  required
                  value={bookingService}
                  onChange={(e) => {
                    setBookingService(e.target.value);
                    setAvailableWindows([]);
                  }}
                >
                  <option value="">Selecione…</option>
                  {services
                    .filter((s) => s.is_active)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Data
                <DateInput
                  required
                  value={bookingDate}
                  onChange={(value) => {
                    setBookingDate(value);
                    setAvailableWindows([]);
                  }}
                />
              </label>
            </div>
            <button
              type="button"
              className="button secondary"
              onClick={() => void checkBookingAvailability()}
            >
              Consultar horários disponíveis
            </button>
            {availableWindows.length > 0 ? (
              <div className="window-results">
                <b>Janelas disponíveis para esta data</b>
                {availableWindows.map((w, i) => (
                  <span key={i}>
                    {new Date(w.start_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    até{" "}
                    {new Date(w.end_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    (último início possível)
                  </span>
                ))}
              </div>
            ) : (
              bookingDate &&
              bookingProfessional &&
              bookingService && (
                <p className="muted small-text">
                  Consulte a disponibilidade antes de escolher o horário.
                </p>
              )
            )}
            <label>
              Horário de início
              <input
                type="time"
                required
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
              />
            </label>
            <div className="notice-card compact">
              <span>i</span>
              <p>
                Selecione um horário dentro de uma das janelas. A API valida a
                disponibilidade novamente ao gravar.
              </p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setCreate(false)}
              >
                Cancelar
              </button>
              <button className="button primary" disabled={busy}>
                {busy ? "Agendando…" : "Agendar consulta"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {reschedule && (
        <Modal title="Remarcar consulta" onClose={() => setReschedule(null)}>
          <form className="entity-form" onSubmit={moveAppointment}>
            <label>
              Nova data e horário
              <DateTimeInput
                name="start_at"
                required
                defaultValue={new Date(
                  new Date(reschedule.start_at).getTime() -
                    new Date(reschedule.start_at).getTimezoneOffset() * 60000,
                )
                  .toISOString()
                  .slice(0, 16)}
              />
            </label>
            <label>
              Motivo
              <textarea name="reason" maxLength={500} />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setReschedule(null)}
              >
                Cancelar
              </button>
              <button className="button primary" disabled={busy}>
                {busy ? "Salvando…" : "Confirmar remarcação"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {detail && (
        <Modal title={`Consulta #${detail.id}`} onClose={() => setDetail(null)}>
          <div className="detail-list">
            {[
              ["Paciente", detail.patient_name],
              ["Profissional", detail.professional_name],
              ["Serviço", detail.service_name],
              ["Início", new Date(detail.start_at).toLocaleString("pt-BR")],
              ["Término", new Date(detail.end_at).toLocaleString("pt-BR")],
              ["Status", detail.status],
            ].map(([k, v]) => (
              <div key={String(k)}>
                <span>{k}</span>
                <b>{v}</b>
              </div>
            ))}
          </div>
          <h3 className="history-title">Histórico</h3>
          {detail.history?.map((h: Record<string, any>) => (
            <div className="history-item" key={h.id}>
              <b>{h.action}</b>
              <span>{h.reason || "Sem observação"}</span>
              <small>{new Date(h.created_at).toLocaleString("pt-BR")}</small>
            </div>
          ))}
          {detail.history?.length === 0 && (
            <p className="muted">Sem alterações registradas.</p>
          )}
        </Modal>
      )}
    </>
  );
}
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="modal" role="dialog" aria-modal="true">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">GESTÃO DA AGENDA</p>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
