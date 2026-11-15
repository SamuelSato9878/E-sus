import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, getErrorMessage } from "../lib/api";
import type { NotificationRule } from "../types/api";
import { PageHeader } from "../components/PageHeader";

const labels: Record<string, string> = {
  BOOKED: "Consulta agendada",
  CANCELLED: "Consulta cancelada",
  RESCHEDULED: "Consulta remarcada",
  REMINDER: "Lembrete",
  COMPLETED: "Consulta finalizada",
};
export function NotificationsPage() {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<NotificationRule | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const { data } = await api.get<NotificationRule[]>(
        "/notifications/rules",
      );
      setRules(data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const payload = {
      is_enabled: f.get("is_enabled") === "on",
      title_template: String(f.get("title_template")),
      body_template: String(f.get("body_template")),
      ...(editing.event_type === "REMINDER"
        ? { reminder_minutes_before: Number(f.get("reminder_minutes_before")) }
        : {}),
    };
    try {
      await api.patch(`/notifications/rules/${editing.event_type}`, payload);
      setEditing(null);
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
        title="Notificações"
        description="Configure os eventos e modelos de mensagens persistidas no sistema."
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
            <h3>Regras de notificação</h3>
            <span className="muted small-text">
              Modelos aceitam {"{patient_name}"}, {"{professional_name}"},{" "}
              {"{service_name}"}, {"{date}"} e {"{time}"}.
            </span>
          </div>
        </div>
        {loading ? (
          <div className="empty-state">
            <span className="spinner" /> Carregando regras…
          </div>
        ) : (
          <div className="rule-list">
            {rules.map((rule) => (
              <article className="rule-card" key={rule.event_type}>
                <div className="rule-icon">◉</div>
                <div className="rule-content">
                  <div className="rule-title">
                    <h3>{labels[rule.event_type] ?? rule.event_type}</h3>
                    <span
                      className={`badge ${rule.is_enabled ? "success" : "neutral"}`}
                    >
                      {rule.is_enabled ? "Ativa" : "Desativada"}
                    </span>
                  </div>
                  <p>
                    <b>{rule.title_template}</b>
                  </p>
                  <p className="muted">{rule.body_template}</p>
                  {rule.event_type === "REMINDER" && (
                    <small className="muted">
                      Antecedência: {rule.reminder_minutes_before ?? 1440}{" "}
                      minutos
                    </small>
                  )}
                </div>
                <button
                  className="button secondary"
                  onClick={() => setEditing(rule)}
                >
                  Editar regra
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
      <div className="notice-card">
        <div className="notice-icon">i</div>
        <div>
          <b>Sobre as notificações</b>
          <p>
            O sistema armazena notificações para consulta no app. Não há envio
            push para dispositivos com o app fechado.
          </p>
        </div>
      </div>
      {editing && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditing(null);
          }}
        >
          <section className="modal" role="dialog" aria-modal="true">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">PREFERÊNCIAS</p>
                <h2>
                  Editar {labels[editing.event_type] ?? editing.event_type}
                </h2>
              </div>
              <button className="icon-button" onClick={() => setEditing(null)}>
                ×
              </button>
            </div>
            {error && <div className="alert error">{error}</div>}
            <form className="entity-form" onSubmit={save}>
              <label className="field-check">
                <input
                  name="is_enabled"
                  type="checkbox"
                  defaultChecked={editing.is_enabled}
                />{" "}
                Notificação ativa
              </label>
              <label>
                Título
                <input
                  name="title_template"
                  required
                  maxLength={150}
                  defaultValue={editing.title_template}
                />
              </label>
              <label>
                Mensagem
                <textarea
                  name="body_template"
                  required
                  maxLength={1000}
                  rows={4}
                  defaultValue={editing.body_template}
                />
              </label>
              {editing.event_type === "REMINDER" && (
                <label>
                  Antecedência do lembrete (minutos)
                  <input
                    name="reminder_minutes_before"
                    type="number"
                    min={1}
                    max={43200}
                    required
                    defaultValue={editing.reminder_minutes_before ?? 1440}
                  />
                </label>
              )}
              <p className="muted small-text">
                Placeholders disponíveis: {"{patient_name}"},{" "}
                {"{professional_name}"}, {"{service_name}"}, {"{date}"},{" "}
                {"{time}"}.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </button>
                <button className="button primary" disabled={busy}>
                  {busy ? "Salvando…" : "Salvar regra"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
