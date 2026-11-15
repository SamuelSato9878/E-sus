import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, getErrorMessage } from "../lib/api";
import { PageHeader } from "./PageHeader";
import { DateInput } from "./DateInput";

export interface Field {
  key: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "tel"
    | "password"
    | "number"
    | "date"
    | "time"
    | "textarea"
    | "select"
    | "multiselect"
    | "checkboxes"
    | "checkbox";
  required?: boolean;
  numeric?: boolean;
  createOnly?: boolean;
  updateOnly?: boolean;
  minLength?: number;
  maxLength?: number;
  options?: { value: string | number; label: string }[];
  source?: { url: string; label: string; value?: string };
  min?: number;
  max?: number;
  placeholder?: string;
}
export interface EntityConfig {
  title: string;
  description: string;
  notice?: string;
  endpoint: string;
  createEndpoint?: string;
  fields: Field[];
  columns: {
    key: string;
    label: string;
    render?: (value: unknown, row: Record<string, unknown>) => string;
  }[];
  search?: string[];
  filterRows?: (row: Row) => boolean;
  updateMethod?: "patch" | "put";
  delete?: boolean;
}
type Row = Record<string, unknown> & { id: number };

export function EntityPage({ config }: { config: EntityConfig }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Row | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [sourceOptions, setSourceOptions] = useState<
    Record<string, { value: string | number; label: string }[]>
  >({});
  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Row[]>(config.endpoint);
      setRows(data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [config.endpoint]);
  useEffect(() => {
    void load();
  }, [load]);
  const visibleRows = rows.filter((row) => config.filterRows?.(row) ?? true);
  const filtered = visibleRows.filter((row) =>
    (config.search ?? config.columns.map((c) => c.key)).some((key) =>
      String(row[key] ?? "")
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
    ),
  );
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};
    for (const field of config.fields) {
      if (editing && field.createOnly) continue;
      if (!editing && field.updateOnly) continue;
      const value = form.getAll(field.key);
      const type = field.type;
      if (type === "checkbox")
        payload[field.key] = form.get(field.key) === "on";
      else if (type === "multiselect" || type === "checkboxes")
        payload[field.key] =
          field.numeric === false ? value : value.map(Number);
      else {
        const raw =
          type === "password"
            ? String(value[0] ?? "")
            : String(value[0] ?? "").trim();
        if (raw !== "")
          payload[field.key] =
            type === "number" || field.numeric ? Number(raw) : raw;
      }
    }
    try {
      if (editing)
        await api[config.updateMethod ?? "patch"](
          `${config.endpoint}${editing.id}`,
          payload,
        );
      else await api.post(config.createEndpoint ?? config.endpoint, payload);
      setEditing(undefined);
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove(row: Row) {
    if (
      !window.confirm(
        `Excluir ${String(row[config.columns[0].key] ?? `#${row.id}`)}?`,
      )
    )
      return;
    try {
      await api.delete(`${config.endpoint}${row.id}`);
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }
  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        action={
          <button className="button primary" onClick={() => setEditing(null)}>
            ＋ Novo cadastro
          </button>
        }
      />
      {config.notice && (
        <div className="notice-card">
          <div className="notice-icon">i</div>
          <div>
            <p>{config.notice}</p>
          </div>
        </div>
      )}
      {error && (
        <div className="alert error" role="alert">
          {error}
          <button className="alert-close" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
      <section className="panel table-panel">
        <div className="table-toolbar">
          <div>
            <h3>Todos os registros</h3>
            <span className="muted small-text">
              {visibleRows.length} registros
            </span>
          </div>
          <label className="search-box">
            <span>⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
            />
          </label>
        </div>
        {loading ? (
          <div className="empty-state">
            <span className="spinner" /> Carregando registros…
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⌕</div>
            <b>
              {visibleRows.length
                ? "Nenhum resultado"
                : "Nenhum registro cadastrado"}
            </b>
            <span className="muted">
              {visibleRows.length
                ? "Tente outro termo de busca."
                : "Adicione o primeiro registro para começar."}
            </span>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {config.columns.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                  <th className="actions-col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    {config.columns.map((c) => (
                      <td key={c.key}>
                        {c.render
                          ? c.render(row[c.key], row)
                          : String(row[c.key] ?? "—")}
                      </td>
                    ))}
                    <td className="actions">
                      <button
                        className="icon-button"
                        title="Editar"
                        onClick={() => setEditing(row)}
                      >
                        ✎
                      </button>
                      {config.delete && (
                        <button
                          className="icon-button danger-text"
                          title="Excluir"
                          onClick={() => void remove(row)}
                        >
                          ⌫
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
      {editing !== undefined && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditing(undefined);
          }}
        >
          <section className="modal" role="dialog" aria-modal="true">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">
                  {editing ? "ATUALIZAR DADOS" : "NOVO REGISTRO"}
                </p>
                <h2>
                  {editing ? "Editar" : "Adicionar"}{" "}
                  {config.title.toLocaleLowerCase().replace(/s$/, "")}
                </h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setEditing(undefined)}
              >
                ×
              </button>
            </div>
            {error && (
              <div className="alert error" role="alert">
                {error}
              </div>
            )}
            <form onSubmit={save} className="entity-form">
              <div className="form-grid">
                {config.fields
                  .filter((f) => (editing ? !f.createOnly : !f.updateOnly))
                  .map((field) => {
                    const current = editing?.[field.key];
                    const cls =
                      field.type === "checkbox"
                        ? "field-check"
                        : field.type === "textarea"
                          ? "field-wide"
                          : "";
                    const options = field.source
                      ? (sourceOptions[field.key] ?? [])
                      : (field.options ?? []);
                    return field.type === "checkboxes" ? (
                      <fieldset
                        key={field.key}
                        className="checkbox-field field-wide"
                      >
                        <legend>{field.label}</legend>
                        {options.length ? (
                          <div className="checkbox-grid">
                            {options.map((opt) => (
                              <label
                                className="checkbox-option"
                                key={`${field.key}-${options.length}-${opt.value}`}
                              >
                                <input
                                  type="checkbox"
                                  name={field.key}
                                  value={opt.value}
                                  defaultChecked={
                                    Array.isArray(current) &&
                                    current.some(
                                      (value) =>
                                        String(value) === String(opt.value),
                                    )
                                  }
                                />
                                {opt.label}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <p className="muted small-text">
                            Nenhuma opção disponível.
                          </p>
                        )}
                      </fieldset>
                    ) : (
                      <label key={field.key} className={cls}>
                        {field.type === "checkbox" ? (
                          <>
                            <input
                              type="checkbox"
                              name={field.key}
                              defaultChecked={Boolean(current)}
                            />{" "}
                            {field.label}
                          </>
                        ) : (
                          <>
                            {field.label}
                            {field.type === "textarea" ? (
                              <textarea
                                name={field.key}
                                required={field.required && !editing}
                                defaultValue={String(current ?? "")}
                                placeholder={field.placeholder}
                              />
                            ) : field.type === "select" ||
                              field.type === "multiselect" ? (
                              <select
                                name={field.key}
                                multiple={field.type === "multiselect"}
                                required={field.required && !editing}
                                defaultValue={
                                  field.type === "multiselect"
                                    ? Array.isArray(current)
                                      ? current.map(String)
                                      : []
                                    : String(current ?? "")
                                }
                              >
                                <option value="">Selecione…</option>
                                {options.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            ) : field.type === "date" ? (
                              <DateInput
                                name={field.key}
                                defaultValue={String(current ?? "")}
                                required={field.required && !editing}
                              />
                            ) : (
                              <input
                                name={field.key}
                                type={field.type ?? "text"}
                                required={field.required && !editing}
                                min={field.min}
                                max={field.max}
                                minLength={field.minLength}
                                maxLength={field.maxLength}
                                autoComplete={
                                  field.type === "password"
                                    ? "new-password"
                                    : undefined
                                }
                                defaultValue={String(current ?? "")}
                                placeholder={field.placeholder}
                              />
                            )}
                          </>
                        )}
                      </label>
                    );
                  })}
              </div>
              {config.fields.some((f) => f.source) && (
                <LoadSources
                  fields={config.fields}
                  onLoaded={setSourceOptions}
                />
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setEditing(undefined)}
                >
                  Cancelar
                </button>
                <button className="button primary" disabled={busy}>
                  {busy ? "Salvando…" : "Salvar alterações"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

function LoadSources({
  fields,
  onLoaded,
}: {
  fields: Field[];
  onLoaded: (
    value: Record<string, { value: string | number; label: string }[]>,
  ) => void;
}) {
  useEffect(() => {
    let active = true;
    Promise.all(
      fields
        .filter((f) => f.source)
        .map(async (f) => {
          const { data } = await api.get<Record<string, unknown>[]>(
            f.source!.url,
          );
          return [
            f.key,
            data.map((row) => ({
              value: row[f.source!.value ?? "id"] as string | number,
              label: String(row[f.source!.label]),
            })),
          ] as const;
        }),
    )
      .then((items) => {
        if (active) onLoaded(Object.fromEntries(items));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [fields, onLoaded]);
  return null;
}
