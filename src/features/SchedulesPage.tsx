import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, getErrorMessage } from "../lib/api";
import type {
  MedicalService,
  Professional,
  Schedule,
  ScheduleDay,
} from "../types/api";
import { PageHeader } from "../components/PageHeader";
import { DateInput, fromIsoDate } from "../components/DateInput";

const weekdays = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];
type Exception = {
  id: number;
  exception_date: string;
  mode: string;
  reason: string | null;
  is_active: boolean;
  periods: { start_time: string; end_time: string }[];
};
type Block = {
  id: number;
  start_at: string;
  end_at: string;
  reason: string;
  is_active: boolean;
};
export function SchedulesPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<MedicalService[]>([]);
  const [professionalId, setProfessionalId] = useState("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleId, setScheduleId] = useState("");
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<
    "week" | "exceptions" | "blocks" | "availability"
  >("week");
  const [modal, setModal] = useState<
    | "schedule"
    | "schedule-edit"
    | "day"
    | "exception"
    | "block"
    | "replicate"
    | "exception-edit"
    | "block-edit"
    | null
  >(null);
  const [day, setDay] = useState<ScheduleDay | null>(null);
  const [editException, setEditException] = useState<Exception | null>(null);
  const [editBlock, setEditBlock] = useState<Block | null>(null);
  const [busy, setBusy] = useState(false);
  const [serviceId, setServiceId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [daysSearched, setDaysSearched] = useState(false);
  const [windows, setWindows] = useState<
    { start_at: string; end_at: string }[]
  >([]);
  useEffect(() => {
    Promise.all([
      api.get<Professional[]>("/professionals/"),
      api.get<MedicalService[]>("/services/"),
    ])
      .then(([r, s]) => {
        setProfessionals(r.data);
        setServices(s.data);
        if (r.data[0]) setProfessionalId(String(r.data[0].id));
        if (s.data[0]) setServiceId(String(s.data[0].id));
      })
      .catch((e) => setError(getErrorMessage(e)));
  }, []);
  const schedule = schedules.find((s) => String(s.id) === scheduleId);
  const load = useCallback(async () => {
    if (!professionalId) return;
    try {
      const [s, e, b] = await Promise.all([
        api.get<Schedule[]>(`/professionals/${professionalId}/schedules`),
        api.get<Exception[]>(
          `/professionals/${professionalId}/schedule-exceptions`,
        ),
        api.get<Block[]>(`/professionals/${professionalId}/schedule-blocks`),
      ]);
      setSchedules(s.data);
      setExceptions(e.data);
      setBlocks(b.data);
      if (s.data.length && !s.data.some((x) => String(x.id) === scheduleId))
        setScheduleId(String(s.data[0].id));
    } catch (x) {
      setError(getErrorMessage(x));
    }
  }, [professionalId, scheduleId]);
  useEffect(() => {
    void load();
  }, [load]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      if (modal === "schedule") {
        const { data } = await api.post<Schedule>(
          `/professionals/${professionalId}/schedules`,
          {
            valid_from: f.get("valid_from"),
            valid_until: f.get("valid_until") || null,
            timezone_name: "America/Sao_Paulo",
          },
        );
        setScheduleId(String(data.id));
      } else if (modal === "schedule-edit" && schedule) {
        await api.patch(`/schedules/${schedule.id}`, {
            valid_from: f.get("valid_from"),
          valid_until: f.get("valid_until") || null,
        });
      } else if (modal === "day" && schedule && day) {
        const checked = f.get("is_active") === "on";
        const starts = f.getAll("start_time").map(String);
        const ends = f.getAll("end_time").map(String);
        const periods = checked
          ? starts
              .map((start_time, i) => ({ start_time, end_time: ends[i] }))
              .filter((p) => p.start_time && p.end_time)
          : [];
        await api.put(`/schedules/${schedule.id}/days/${day.weekday}`, {
          is_active: checked,
          periods,
        });
      } else if (modal === "exception" || modal === "exception-edit") {
        const mode = String(f.get("mode"));
        const periods =
          mode === "REPLACE"
            ? [
                {
                  start_time: String(f.get("start_time")),
                  end_time: String(f.get("end_time")),
                },
              ]
            : [];
        const payload = {
          ...(modal === "exception"
            ? { exception_date: f.get("exception_date") }
            : {}),
          ...(modal === "exception-edit"
            ? { is_active: f.get("is_active") === "on" }
            : {}),
          mode,
          reason: f.get("reason") || null,
          periods,
        };
        if (modal === "exception-edit" && editException)
          await api.patch(`/schedule-exceptions/${editException.id}`, payload);
        else {
          const exceptionDate = String(f.get("exception_date"));
          if (exceptions.some((item) => item.exception_date === exceptionDate))
            throw new Error("Já tem um dia cadastrado para esse profissional nessa data.");
          await api.post(
            `/professionals/${professionalId}/schedule-exceptions`,
            payload,
          );
        }
      } else if (modal === "block" || modal === "block-edit") {
        const startDate = String(f.get("block_date"));
        const endDate = String(f.get("block_end_date"));
        if (endDate < startDate)
          throw new Error("A data final deve ser igual ou posterior à data inicial.");
        const startAt = new Date(`${startDate}T00:00:00`).toISOString();
        const nextDate = new Date(`${endDate}T00:00:00`);
        nextDate.setDate(nextDate.getDate() + 1);
        const endAt = nextDate.toISOString();
        const payload = {
          start_at: startAt,
          end_at: endAt,
          reason: f.get("reason"),
          ...(modal === "block-edit"
            ? { is_active: f.get("is_active") === "on" }
            : {}),
        };
        if (modal === "block-edit" && editBlock)
          await api.patch(`/schedule-blocks/${editBlock.id}`, payload);
        else
          await api.post(
            `/professionals/${professionalId}/schedule-blocks`,
            payload,
          );
      } else if (modal === "replicate" && schedule) {
        const ids = f.getAll("professional_ids").map(Number).filter(Boolean);
        if (!ids.length) throw new Error("Selecione ao menos um profissional.");
        await api.post(`/schedules/${schedule.id}/copy-to-professionals`, {
          professional_ids: ids,
        });
      }
      setModal(null);
      setEditException(null);
      setEditBlock(null);
      await load();
    } catch (x) {
      setError(getErrorMessage(x));
    } finally {
      setBusy(false);
    }
  }
  async function deactivate(url: string) {
    if (!window.confirm("Deseja desativar este registro?")) return;
    try {
      await api.delete(url);
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }
  async function copyDay() {
    if (!schedule) return;
    const source = window.prompt("Dia de origem (0 segunda a 6 domingo):");
    if (source === null) return;
    const targets = window.prompt(
      "Dias de destino separados por vírgula (ex.: 1,2,3):",
    );
    if (!targets) return;
    try {
      await api.post(`/schedules/${schedule.id}/copy-days`, {
        source_weekday: Number(source),
        target_weekdays: targets.split(",").map(Number),
      });
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }
  async function findAvailableDays(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!professionalId || !serviceId) return;
    try {
      const { data } = await api.get<string[]>("/availability/days", {
        params: {
          professional_id: professionalId,
          service_id: serviceId,
          start: fromDate,
          end: toDate,
        },
      });
      setAvailableDays(data);
      setDaysSearched(true);
      setWindows([]);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }
  async function findWindows(date: string) {
    try {
      const { data } = await api.get<{
        windows: { start_at: string; end_at: string }[];
      }>("/availability/windows", {
        params: {
          professional_id: professionalId,
          service_id: serviceId,
          date,
        },
      });
      setWindows(data.windows);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }
  return (
    <>
      <PageHeader
        title="Agendas"
        description="Configure escalas semanais, exceções e bloqueios de profissionais."
        action={
          <button
            className="button primary"
            disabled={!professionalId}
            onClick={() => setModal("schedule")}
          >
            ＋ Nova escala
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
      <section className="panel schedule-controls">
        <label>
          Profissional
          <select
            value={professionalId}
            onChange={(e) => {
              setProfessionalId(e.target.value);
              setScheduleId("");
            }}
          >
            <option value="">Selecione um profissional…</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Escala
          <select
            value={scheduleId}
            onChange={(e) => setScheduleId(e.target.value)}
          >
            <option value="">Selecione uma escala…</option>
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                #{s.id} · {fromIsoDate(s.valid_from)} – {s.valid_until ? fromIsoDate(s.valid_until) : "Sem término"}
                {s.is_active ? "" : " · Inativa"}
              </option>
            ))}
          </select>
        </label>
        {schedule && (
          <>
            <button
              className="button secondary"
              onClick={() => setModal("replicate")}
            >
              Replicar escala
            </button>
            <button
              className="text-button"
              onClick={async () => {
                try {
                  await api.patch(`/schedules/${schedule.id}`, {
                    is_active: !schedule.is_active,
                  });
                  await load();
                } catch (e) {
                  setError(getErrorMessage(e));
                }
              }}
            >
              {schedule.is_active ? "Desativar escala" : "Ativar escala"}
            </button>
          </>
        )}
      </section>
      {!professionalId ? (
        <div className="empty-state panel">
          <b>Cadastre um profissional primeiro</b>
        </div>
      ) : !schedule ? (
        <div className="empty-state panel">
          <div className="empty-icon">▦</div>
          <b>Nenhuma escala selecionada</b>
          <span className="muted">
            Crie uma escala para configurar a disponibilidade semanal.
          </span>
        </div>
      ) : (
        <>
          <div className="tab-bar">
            <button
              className={tab === "week" ? "selected" : ""}
              onClick={() => setTab("week")}
            >
              Semana padrão
            </button>
            <button
              className={tab === "exceptions" ? "selected" : ""}
              onClick={() => setTab("exceptions")}
            >
              Exceções{" "}
              <span>{exceptions.filter((x) => x.is_active).length}</span>
            </button>
            <button
              className={tab === "blocks" ? "selected" : ""}
              onClick={() => setTab("blocks")}
            >
              Bloqueios <span>{blocks.filter((x) => x.is_active).length}</span>
            </button>
            <button
              className={tab === "availability" ? "selected" : ""}
              onClick={() => setTab("availability")}
            >
              Disponibilidade
            </button>
          </div>
          {tab === "week" && (
            <>
              <div className="schedule-summary">
                <div>
                  <span>Vigência</span>
                  <b>
                    {fromIsoDate(schedule.valid_from)} –{" "}
                    {schedule.valid_until ? fromIsoDate(schedule.valid_until) : "Indefinida"}
                  </b>
                </div>
                <button
                  className="text-button"
                  onClick={() => setModal("schedule-edit")}
                >
                  Editar vigência
                </button>
                <div>
                  <span>Fuso horário</span>
                  <b>{schedule.timezone_name}</b>
                </div>
                <div>
                  <span>Status</span>
                  <b>{schedule.is_active ? "Ativa" : "Inativa"}</b>
                </div>
                <button className="text-button" onClick={() => void copyDay()}>
                  Copiar configuração de dia
                </button>
              </div>
              <div className="weekday-grid">
                {weekdays.map((name, i) => {
                  const d = schedule.days.find((x) => x.weekday === i);
                  return (
                    <article
                      className={`weekday-card ${d?.is_active ? "open" : ""}`}
                      key={i}
                    >
                      <div className="weekday-heading">
                        <b>{name}</b>
                        <span
                          className={`badge ${d?.is_active ? "success" : "neutral"}`}
                        >
                          {d?.is_active ? "Ativo" : "Fechado"}
                        </span>
                      </div>
                      {d?.periods.length ? (
                        <div className="periods">
                          {d.periods.map((p) => (
                            <span key={p.id}>
                              {p.start_time.slice(0, 5)} –{" "}
                              {p.end_time.slice(0, 5)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="muted">Sem atendimento</p>
                      )}
                      <button
                        className="text-button"
                        onClick={() => {
                          setDay(
                            d ?? {
                              id: 0,
                              weekday: i,
                              is_active: false,
                              periods: [],
                            },
                          );
                          setModal("day");
                        }}
                      >
                        {d ? "Editar horários" : "Configurar dia"}
                      </button>
                    </article>
                  );
                })}
              </div>
            </>
          )}
          {tab === "exceptions" && (
            <section className="panel table-panel">
              <div className="table-toolbar">
                <div>
                  <h3>Exceções de agenda</h3>
                  <span className="muted small-text">
                    Fechamentos ou horários especiais por data.
                  </span>
                </div>
                <button
                  className="button secondary"
                  onClick={() => setModal("exception")}
                >
                  ＋ Adicionar exceção
                </button>
              </div>
              {exceptions.length === 0 ? (
                <div className="empty-state">Nenhuma exceção registrada.</div>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Tipo</th>
                        <th>Motivo</th>
                        <th>Horários</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {exceptions.map((x) => (
                        <tr key={x.id}>
                          <td>{fromIsoDate(x.exception_date)}</td>
                          <td>
                            {x.mode === "CLOSED" ? "Fechado" : "Substituição"}
                          </td>
                          <td>{x.reason || "—"}</td>
                          <td>
                            {x.periods
                              .map((p) => `${p.start_time}–${p.end_time}`)
                              .join(", ") || "—"}
                          </td>
                          <td>
                            <span
                              className={`badge ${x.is_active ? "success" : "neutral"}`}
                            >
                              {x.is_active ? "Ativa" : "Inativa"}
                            </span>
                          </td>
                          <td className="actions">
                            <button
                              className="text-button"
                              onClick={() => {
                                setEditException(x);
                                setModal("exception-edit");
                              }}
                            >
                              Editar
                            </button>
                            {x.is_active && (
                              <button
                                className="text-button danger-text"
                                onClick={() =>
                                  void deactivate(
                                    `/schedule-exceptions/${x.id}`,
                                  )
                                }
                              >
                                Desativar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
          {tab === "blocks" && (
            <section className="panel table-panel">
              <div className="table-toolbar">
                <div>
                  <h3>Bloqueios de agenda</h3>
                  <span className="muted small-text">
                    Períodos indisponíveis para atendimento.
                  </span>
                </div>
                <button
                  className="button secondary"
                  onClick={() => setModal("block")}
                >
                  ＋ Adicionar bloqueio
                </button>
              </div>
              {blocks.length === 0 ? (
                <div className="empty-state">Nenhum bloqueio registrado.</div>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Período</th>
                        <th>Motivo</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {blocks.map((b) => (
                        <tr key={b.id}>
                          <td>
                            {toLocalDate(b.start_at)} – {toLocalDate(b.end_at, true)}
                          </td>
                          <td>{b.reason}</td>
                          <td>
                            <span
                              className={`badge ${b.is_active ? "success" : "neutral"}`}
                            >
                              {b.is_active ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td className="actions">
                            <button
                              className="text-button"
                              onClick={() => {
                                setEditBlock(b);
                                setModal("block-edit");
                              }}
                            >
                              Editar
                            </button>
                            {b.is_active && (
                              <button
                                className="text-button danger-text"
                                onClick={() =>
                                  void deactivate(`/schedule-blocks/${b.id}`)
                                }
                              >
                                Desativar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
          {tab === "availability" && (
            <section className="panel table-panel">
              <div className="table-toolbar">
                <div>
                  <h3>Consultar disponibilidade</h3>
                  <span className="muted small-text">
                    Confira os dias e horários oferecidos para um serviço.
                  </span>
                </div>
              </div>
              <form
                className="availability-search"
                onSubmit={findAvailableDays}
              >
                <label>
                  Serviço
                  <select
                    value={serviceId}
                    onChange={(e) => {
                      setServiceId(e.target.value);
                      setAvailableDays([]);
                      setWindows([]);
                    }}
                  >
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
                  De
                  <DateInput
                    required
                    value={fromDate}
                    onChange={setFromDate}
                  />
                </label>
                <label>
                  Até
                  <DateInput
                    required
                    value={toDate}
                    onChange={setToDate}
                  />
                </label>
                <button className="button primary">Buscar dias</button>
              </form>
              {availableDays.length > 0 && (
                <div className="availability-days">
                  {availableDays.map((d) => (
                    <button
                      className="button secondary"
                      key={d}
                      onClick={() => void findWindows(d)}
                    >
                      {new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      })}
                    </button>
                  ))}
                </div>
              )}
              {windows.length > 0 && (
                <div className="window-results">
                  <h3>Janelas disponíveis</h3>
                  {windows.map((w, i) => (
                    <div key={i}>
                      <span>
                        {new Date(w.start_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span>
                        até{" "}
                        {new Date(w.end_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        (último início possível)
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {daysSearched && availableDays.length === 0 && (
                <p className="muted availability-empty">
                  Nenhum dia disponível nesse intervalo.
                </p>
              )}
            </section>
          )}
        </>
      )}
      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <section className="modal" role="dialog" aria-modal="true">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">CONFIGURAÇÃO DA AGENDA</p>
                <h2>
                  {modal === "schedule"
                    ? "Nova escala"
                    : modal === "schedule-edit"
                      ? "Editar vigência"
                      : modal === "day"
                        ? weekdays[day?.weekday ?? 0]
                        : modal === "exception"
                          ? "Adicionar exceção"
                          : modal === "exception-edit"
                            ? "Editar exceção"
                            : modal === "block"
                              ? "Adicionar bloqueio"
                              : modal === "block-edit"
                                ? "Editar bloqueio"
                                : "Replicar escala"}
                </h2>
              </div>
              <button className="icon-button" onClick={() => setModal(null)}>
                ×
              </button>
            </div>
            {error && <div className="alert error">{error}</div>}
            <form
              key={`${modal}-${editException?.id ?? "new"}`}
              className="entity-form"
              onSubmit={submit}
            >
              {(modal === "schedule" || modal === "schedule-edit") && (
                <div className="form-grid">
                  <label>
                    Início da vigência
                    <DateInput
                      name="valid_from"
                      required
                      defaultValue={
                        modal === "schedule-edit" ? schedule?.valid_from : ""
                      }
                    />
                  </label>
                  <label>
                    Fim da vigência (opcional)
                    <DateInput
                      name="valid_until"
                      defaultValue={
                        modal === "schedule-edit"
                          ? (schedule?.valid_until ?? "")
                          : ""
                      }
                    />
                  </label>
                </div>
              )}
              {modal === "day" && (
                <>
                  <label className="field-check">
                    <input
                      type="checkbox"
                      name="is_active"
                      defaultChecked={day?.is_active}
                    />{" "}
                    Atende neste dia
                  </label>
                  <p className="muted small-text">
                    Adicione um ou mais períodos sem sobreposição.
                  </p>
                  {[0, 1, 2].map((i) => (
                    <div className="form-grid period-editor" key={i}>
                      <label>
                        Início
                        <input
                          name="start_time"
                          type="time"
                          defaultValue={day?.periods[i]?.start_time?.slice(
                            0,
                            5,
                          )}
                        />
                      </label>
                      <label>
                        Término
                        <input
                          name="end_time"
                          type="time"
                          defaultValue={day?.periods[i]?.end_time?.slice(0, 5)}
                        />
                      </label>
                    </div>
                  ))}
                </>
              )}
              {(modal === "exception" || modal === "exception-edit") && (
                <div className="form-grid">
                  <label>
                    Data
                    <DateInput
                      name="exception_date"
                      required
                      readOnly={modal === "exception-edit"}
                      defaultValue={editException?.exception_date ?? ""}
                    />
                  </label>
                  <label>
                    Tipo
                    <select
                      name="mode"
                      defaultValue={editException?.mode ?? "CLOSED"}
                    >
                      <option value="CLOSED">Fechado</option>
                      <option value="REPLACE">Substituir horários</option>
                    </select>
                  </label>
                  <label className="field-wide">
                    Motivo
                    <input
                      name="reason"
                      maxLength={500}
                      defaultValue={editException?.reason ?? ""}
                    />
                  </label>
                  {modal === "exception-edit" && (
                    <label className="field-check field-wide">
                      <input
                        type="checkbox"
                        name="is_active"
                        defaultChecked={editException?.is_active}
                      />{" "}
                      Exceção ativa
                    </label>
                  )}
                  <p className="muted small-text field-wide">
                    Para uma exceção do tipo substituição, informe o horário no
                    formato HH:MM.
                  </p>
                  <label>
                    Início
                    <input
                      type="time"
                      name="start_time"
                      defaultValue={editException?.periods[0]?.start_time?.slice(
                        0,
                        5,
                      )}
                    />
                  </label>
                  <label>
                    Término
                    <input
                      type="time"
                      name="end_time"
                      defaultValue={editException?.periods[0]?.end_time?.slice(
                        0,
                        5,
                      )}
                    />
                  </label>
                </div>
              )}
              {(modal === "block" || modal === "block-edit") && (
                <div className="form-grid">
                  <label>
                    Data inicial
                    <DateInput
                      name="block_date"
                      required
                      defaultValue={
                        editBlock ? toLocalDate(editBlock.start_at) : ""
                      }
                    />
                  </label>
                  <label>
                    Data final
                    <DateInput
                      name="block_end_date"
                      required
                      defaultValue={
                        editBlock ? toLocalDate(editBlock.end_at, true) : ""
                      }
                    />
                  </label>
                  <label className="field-wide">
                    Motivo
                    <input
                      name="reason"
                      maxLength={500}
                      required
                      defaultValue={editBlock?.reason ?? ""}
                    />
                  </label>
                  {modal === "block-edit" && (
                    <label className="field-check field-wide">
                      <input
                        type="checkbox"
                        name="is_active"
                        defaultChecked={editBlock?.is_active}
                      />{" "}
                      Bloqueio ativo
                    </label>
                  )}
                </div>
              )}
              {modal === "replicate" && (
                <>
                  <p className="muted">
                    Selecione os profissionais que receberão uma cópia da escala
                    atual.
                  </p>
                  <div className="form-grid">
                    {professionals.map((professional) => (
                      <label className="field-check" key={professional.id}>
                        <input
                          type="checkbox"
                          name="professional_ids"
                          value={professional.id}
                        />{" "}
                        {professional.name}
                      </label>
                    ))}
                  </div>
                </>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setModal(null)}
                >
                  Cancelar
                </button>
                <button className="button primary" disabled={busy}>
                  {busy ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

function toLocalDate(value: string, previousDay = false) {
  const date = new Date(value);
  if (previousDay) date.setDate(date.getDate() - 1);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}
