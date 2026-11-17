/**
 * V5.4-005 · participant fields in the Experimental organiser panel.
 *
 * - ParticipantFieldsManager: organiser picks fields from the library or creates their own, orders
 *   them, sets visibility; saved sets can be reused (this browser) or moved as a JSON file.
 * - ParticipantFieldInputs: the add/edit form shows only the enabled fields (required ones first).
 * - ParticipantFieldChips: compact values on the participant list.
 * Fields never affect ranking, results or seeding; the server enforces types and visibility.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetParticipantFieldsQueryKey,
  getListPlayersQueryKey,
  useGetParticipantFieldLibrary,
  useGetParticipantFields,
  useSaveParticipantFields,
  useSetPlayerCustomFields,
} from "@workspace/api-client-react";
import { ArrowDown, ArrowUp, Check, ChevronDown, Download, ListPlus, Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { getApiErrorMessage } from "@/lib/tournament-stages-ui";
import {
  KIND_LABELS,
  VISIBILITY_LABELS,
  VISIBILITY_SHORT,
  deleteSavedSet,
  formValuesToPayload,
  formatFieldValue,
  keyForLabel,
  missingRequired,
  parseFieldSetFile,
  readSavedSets,
  writeSavedSet,
  type FieldDef,
  type FieldValue,
  type SavedFieldSet,
} from "./participant-fields-model";

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Definitions the current viewer may see (organiser: all). */
export function useParticipantFields(tournamentId: number, enabled = true): FieldDef[] {
  const query = useGetParticipantFields(tournamentId, {
    query: { enabled: enabled && !!tournamentId, queryKey: getGetParticipantFieldsQueryKey(tournamentId), staleTime: 15_000, retry: false },
  });
  return query.data?.fields?.fields ?? [];
}

const TYPE_ORDER: FieldDef["type"][] = ["short_text", "long_text", "number", "select", "multi_select", "boolean", "date", "color", "url"];

interface Impact { key: string; label: string; count: number }

// ── inputs ───────────────────────────────────────────────────────────────────────────────────────

export function ParticipantFieldInputs({
  fields,
  values,
  onChange,
  idPrefix,
  disabled = false,
}: {
  fields: readonly FieldDef[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  idPrefix: string;
  disabled?: boolean;
}) {
  if (fields.length === 0) return null;
  return (
    <div className="participant-field-inputs grid gap-3">
      {fields.map((field) => {
        const id = `${idPrefix}-${field.key}`;
        const value = values[field.key] ?? (field.defaultValue as unknown) ?? (field.type === "multi_select" ? [] : field.type === "boolean" ? false : "");
        const label = (
          <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive" aria-hidden="true">*</span>}
            {field.required && <span className="sr-only">(wymagane)</span>}
            {field.visibility !== "public" && <span className="participant-field-visibility" title={VISIBILITY_LABELS[field.visibility]}>{VISIBILITY_SHORT[field.visibility]}</span>}
          </label>
        );
        const common = { id, disabled, "aria-describedby": field.description ? `${id}-help` : undefined, className: "participant-field-control" } as const;
        let control: React.ReactNode;
        switch (field.type) {
          case "long_text":
            control = <textarea {...common} rows={3} maxLength={field.maxLength ?? 2000} value={String(value ?? "")} onChange={(event) => onChange(field.key, event.target.value)} />;
            break;
          case "number":
            control = <input {...common} type="number" inputMode="decimal" min={field.min} max={field.max} value={value === null ? "" : String(value)} onChange={(event) => onChange(field.key, event.target.value)} />;
            break;
          case "select":
            control = (
              <select {...common} value={String(value ?? "")} onChange={(event) => onChange(field.key, event.target.value)}>
                <option value="">— wybierz —</option>
                {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            );
            break;
          case "multi_select": {
            const selected = Array.isArray(value) ? value as string[] : [];
            control = (
              <div role="group" aria-labelledby={`${id}-label`} className="flex flex-wrap gap-1.5">
                {(field.options ?? []).map((option) => {
                  const on = selected.includes(option);
                  return (
                    <button key={option} type="button" disabled={disabled} aria-pressed={on} className="participant-field-chip-toggle" onClick={() => onChange(field.key, on ? selected.filter((item) => item !== option) : [...selected, option])}>
                      {option}
                    </button>
                  );
                })}
              </div>
            );
            break;
          }
          case "boolean":
            control = (
              <span className="flex items-center gap-2 text-sm">
                <input {...common} type="checkbox" className="h-4 w-4" checked={value === true} onChange={(event) => onChange(field.key, event.target.checked)} />
                <span>{value === true ? "Tak" : "Nie"}</span>
              </span>
            );
            break;
          case "date":
            control = <input {...common} type="date" value={String(value ?? "")} onChange={(event) => onChange(field.key, event.target.value)} />;
            break;
          case "color":
            control = (
              <span className="flex items-center gap-2">
                <input {...common} type="color" className="h-9 w-14 rounded border" value={typeof value === "string" && value ? value : "#3b82f6"} onChange={(event) => onChange(field.key, event.target.value)} />
                {value ? <button type="button" className="text-xs underline" onClick={() => onChange(field.key, "")}>wyczyść</button> : <span className="text-xs text-muted-foreground">nie wybrano</span>}
              </span>
            );
            break;
          case "url":
            control = <input {...common} type="url" inputMode="url" placeholder="https://" maxLength={500} value={String(value ?? "")} onChange={(event) => onChange(field.key, event.target.value)} />;
            break;
          default:
            control = <input {...common} type="text" maxLength={field.maxLength ?? 200} value={String(value ?? "")} onChange={(event) => onChange(field.key, event.target.value)} />;
        }
        return (
          <div key={field.key} className="grid gap-1" id={`${id}-label`}>
            {label}
            {control}
            {field.description && <p id={`${id}-help`} className="text-xs text-muted-foreground">{field.description}</p>}
          </div>
        );
      })}
    </div>
  );
}

export function ParticipantFieldChips({ fields, values, limit = 4 }: { fields: readonly FieldDef[]; values?: Record<string, unknown> | null; limit?: number }) {
  if (!values || fields.length === 0) return null;
  const shown = fields.filter((field) => values[field.key] !== undefined && values[field.key] !== null && values[field.key] !== "");
  if (shown.length === 0) return null;
  return (
    <ul className="participant-field-chips" aria-label="Dane uczestnika">
      {shown.slice(0, limit).map((field) => (
        <li key={field.key} title={`${field.label}: ${formatFieldValue(field, values[field.key] as FieldValue)}`}>
          <span className="participant-field-chip-label">{field.label}</span>
          {field.type === "color" && typeof values[field.key] === "string"
            ? <span className="participant-field-swatch" style={{ background: values[field.key] as string }} aria-label={String(values[field.key])} />
            : field.type === "url" && typeof values[field.key] === "string"
              ? <a href={values[field.key] as string} target="_blank" rel="noopener noreferrer nofollow">link</a>
              : <span>{formatFieldValue(field, values[field.key] as FieldValue)}</span>}
        </li>
      ))}
      {shown.length > limit && <li className="participant-field-more">+{shown.length - limit}</li>}
    </ul>
  );
}

/** Edits only the field values of one participant — allowed in every tournament state. */
export function ParticipantFieldValuesEditor({
  tournamentId,
  playerId,
  fields,
  values,
  onDone,
}: {
  tournamentId: number;
  playerId: number;
  fields: readonly FieldDef[];
  values?: Record<string, unknown> | null;
  onDone: () => void;
}) {
  const client = useQueryClient();
  const save = useSetPlayerCustomFields();
  const [form, setForm] = useState<Record<string, unknown>>(() => ({ ...(values ?? {}) }));
  const [error, setError] = useState<string | null>(null);
  const missing = missingRequired(fields, form);
  return (
    <form
      className="participant-field-editor space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        if (missing.length) { setError(`Uzupełnij: ${missing.map((field) => field.label).join(", ")}.`); return; }
        save.mutate({ id: playerId, data: { values: formValuesToPayload(fields, form) } }, {
          onSuccess: () => {
            void client.invalidateQueries({ queryKey: getListPlayersQueryKey(tournamentId) });
            onDone();
          },
          onError: (failure) => {
            const problems = (failure as { data?: { problems?: Array<{ message: string }> } }).data?.problems;
            setError(problems?.length ? problems.map((problem) => problem.message).join(" ") : getApiErrorMessage(failure));
          },
        });
      }}
    >
      <ParticipantFieldInputs fields={fields} values={form} idPrefix={`pf-edit-${playerId}`} onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={onDone}><X className="h-4 w-4" aria-hidden="true" /> Anuluj</button>
        <button type="submit" className="experimental-v4-btn" data-variant="primary" disabled={save.isPending}><Check className="h-4 w-4" aria-hidden="true" /> {save.isPending ? "Zapisywanie…" : "Zapisz dane"}</button>
      </div>
    </form>
  );
}

// ── manager ─────────────────────────────────────────────────────────────────────────────────────

interface Draft {
  label: string;
  type: FieldDef["type"];
  optionsText: string;
  required: boolean;
  visibility: FieldDef["visibility"];
  kind: FieldDef["kind"];
  description: string;
  min: string;
  max: string;
}

const EMPTY_DRAFT: Draft = { label: "", type: "short_text", optionsText: "", required: false, visibility: "organizer", kind: "profile", description: "", min: "", max: "" };

function draftToField(draft: Draft, key: string, base?: FieldDef): FieldDef {
  const options = draft.optionsText.split("\n").map((line) => line.trim()).filter(Boolean);
  return {
    ...(base?.libraryId ? { libraryId: base.libraryId } : {}),
    key,
    label: draft.label.trim(),
    type: draft.type,
    category: base?.category ?? "other",
    kind: draft.kind,
    required: draft.required,
    visibility: draft.visibility,
    ...(draft.description.trim() ? { description: draft.description.trim() } : {}),
    ...(draft.type === "select" || draft.type === "multi_select" ? { options } : {}),
    ...(draft.type === "number" && draft.min.trim() !== "" ? { min: Number(draft.min) } : {}),
    ...(draft.type === "number" && draft.max.trim() !== "" ? { max: Number(draft.max) } : {}),
    ...(base?.defaultValue !== undefined && base.type === draft.type ? { defaultValue: base.defaultValue } : {}),
  };
}

function fieldToDraft(field: FieldDef): Draft {
  return {
    label: field.label, type: field.type, optionsText: (field.options ?? []).join("\n"), required: field.required,
    visibility: field.visibility, kind: field.kind, description: field.description ?? "",
    min: field.min != null ? String(field.min) : "", max: field.max != null ? String(field.max) : "",
  };
}

export function ParticipantFieldsManager({ tournamentId, participantNoun = "uczestnika" }: { tournamentId: number; participantNoun?: string }) {
  const client = useQueryClient();
  const saved = useParticipantFields(tournamentId);
  const library = useGetParticipantFieldLibrary({ query: { staleTime: Infinity } as never });
  const save = useSaveParticipantFields();
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<FieldDef[]>(saved);
  const [dirty, setDirty] = useState(false);
  const [panel, setPanel] = useState<"none" | "library" | "custom">("none");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [impact, setImpact] = useState<{ removed: Impact[]; retyped: Impact[]; invalid: Impact[] } | null>(null);
  const [sets, setSets] = useState<SavedFieldSet[]>(() => readSavedSets(safeLocalStorage()));
  const fileRef = useRef<HTMLInputElement>(null);
  const [setName, setSetName] = useState("");

  const savedSignature = JSON.stringify(saved);
  useEffect(() => {
    if (!dirty) setFields(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedSignature]);

  const libraryFields = library.data?.fields ?? [];
  const categories = library.data?.categories ?? [];
  const typeLabels = new Map((library.data?.types ?? []).map((type) => [type.id, type.label]));
  const used = useMemo(() => new Set(fields.map((field) => field.libraryId ?? field.key)), [fields]);

  const change = (next: FieldDef[]) => { setFields(next); setDirty(true); setMessage(null); };
  const move = (index: number, delta: number) => {
    const next = [...fields];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    change(next);
  };

  const submit = (confirmDropValues = false) => {
    setMessage(null);
    save.mutate({ id: tournamentId, data: { fields, confirmDropValues } }, {
      onSuccess: (result) => {
        setDirty(false);
        setImpact(null);
        setMessage({ tone: "ok", text: result.prunedParticipants ? `Zapisano. Usunięto nieaktualne dane u ${result.prunedParticipants} uczestników.` : "Zapisano pola." });
        void client.invalidateQueries({ queryKey: getGetParticipantFieldsQueryKey(tournamentId) });
        void client.invalidateQueries({ queryKey: getListPlayersQueryKey(tournamentId) });
      },
      onError: (failure) => {
        const data = (failure as { data?: { code?: string; problems?: Array<{ message: string }>; impact?: { removedWithValues: Impact[]; retypedWithValues: Impact[]; invalidAfterChange: Impact[] } } }).data;
        if (data?.code === "PARTICIPANT_FIELD_VALUES_AFFECTED" && data.impact) {
          setImpact({ removed: data.impact.removedWithValues, retyped: data.impact.retypedWithValues, invalid: data.impact.invalidAfterChange });
          return;
        }
        setMessage({ tone: "error", text: data?.problems?.length ? data.problems.map((problem) => problem.message).join(" ") : getApiErrorMessage(failure) });
      },
    });
  };

  const commitDraft = () => {
    if (!draft.label.trim()) { setMessage({ tone: "error", text: "Podaj nazwę pola." }); return; }
    if ((draft.type === "select" || draft.type === "multi_select") && !draft.optionsText.trim()) { setMessage({ tone: "error", text: "Lista wyboru potrzebuje co najmniej jednej opcji (każda w osobnej linii)." }); return; }
    if (editing) {
      change(fields.map((field) => (field.key === editing ? draftToField(draft, field.key, field) : field)));
    } else {
      change([...fields, draftToField(draft, keyForLabel(draft.label, fields.map((field) => field.key)))]);
    }
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setPanel("none");
  };

  const summary = saved.length === 0 ? "Tylko nazwa i podstawowe dane" : `${saved.length} ${saved.length === 1 ? "pole" : saved.length < 5 ? "pola" : "pól"}: ${saved.slice(0, 3).map((field) => field.label).join(", ")}${saved.length > 3 ? "…" : ""}`;

  return (
    <section className="participant-fields-manager" aria-label="Pola uczestników">
      <button type="button" className="participant-fields-head" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <ListPlus className="h-4 w-4" aria-hidden="true" />
        <span className="participant-fields-title">Dane zbierane od {participantNoun}</span>
        <span className="participant-fields-summary">{summary}</span>
        <ChevronDown className="participant-fields-chevron h-4 w-4" aria-hidden="true" />
      </button>
      {open && (
        <div className="participant-fields-body">
          <p className="text-xs text-muted-foreground">
            Formularz pokazuje tylko włączone pola. Dane nie wpływają na wyniki, tabelę ani rozstawienie. Nowe pola są domyślnie widoczne tylko dla organizatora.
          </p>
          {fields.length > 0 ? (
            <ol className="participant-fields-list">
              {fields.map((field, index) => (
                <li key={field.key}>
                  <span className="participant-fields-name">{field.label}{field.required && <span className="text-destructive"> *</span>}</span>
                  <span className="participant-fields-meta">{typeLabels.get(field.type) ?? field.type} · {VISIBILITY_SHORT[field.visibility]} · {KIND_LABELS[field.kind]}</span>
                  <span className="participant-fields-actions">
                    <button type="button" aria-label={`Przesuń wyżej: ${field.label}`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button type="button" aria-label={`Przesuń niżej: ${field.label}`} disabled={index === fields.length - 1} onClick={() => move(index, 1)}><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button type="button" aria-label={`Edytuj pole: ${field.label}`} onClick={() => { setEditing(field.key); setDraft(fieldToDraft(field)); setPanel("custom"); }}><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" aria-label={`Usuń pole: ${field.label}`} onClick={() => change(fields.filter((item) => item.key !== field.key))}><Trash2 className="h-3.5 w-3.5" /></button>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">Brak dodatkowych pól — dodaj z biblioteki albo utwórz własne.</p>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="button" className="experimental-v4-btn" data-variant="ghost" aria-expanded={panel === "library"} onClick={() => setPanel(panel === "library" ? "none" : "library")}><Plus className="h-4 w-4" aria-hidden="true" /> Z biblioteki</button>
            <button type="button" className="experimental-v4-btn" data-variant="ghost" aria-expanded={panel === "custom"} onClick={() => { setEditing(null); setDraft(EMPTY_DRAFT); setPanel(panel === "custom" ? "none" : "custom"); }}><Plus className="h-4 w-4" aria-hidden="true" /> Własne pole</button>
          </div>

          {panel === "library" && (
            <div className="participant-fields-library">
              {categories.map((category) => {
                const entries = libraryFields.filter((entry) => entry.category === category.id);
                if (!entries.length) return null;
                return (
                  <fieldset key={category.id}>
                    <legend>{category.label}</legend>
                    <div className="flex flex-wrap gap-1.5">
                      {entries.map((entry) => {
                        const added = used.has(entry.libraryId ?? entry.key);
                        return (
                          <button key={entry.key} type="button" className="participant-field-chip-toggle" aria-pressed={added} disabled={added}
                            title={`${typeLabels.get(entry.type) ?? entry.type} · ${VISIBILITY_LABELS[entry.visibility]}`}
                            onClick={() => change([...fields, { ...entry, key: keyForLabel(entry.key, fields.map((field) => field.key)), required: false } as FieldDef])}>
                            {added ? <Check className="h-3 w-3" aria-hidden="true" /> : <Plus className="h-3 w-3" aria-hidden="true" />} {entry.label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
            </div>
          )}

          {panel === "custom" && (
            <div className="participant-fields-custom" role="group" aria-label={editing ? "Edycja pola" : "Nowe pole"}>
              <label className="grid gap-1 text-sm">Nazwa pola<input className="participant-field-control" maxLength={60} value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} placeholder="Np. Ulubione zwierzę" /></label>
              <label className="grid gap-1 text-sm">Typ
                <select className="participant-field-control" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as FieldDef["type"] })}>
                  {TYPE_ORDER.map((type) => <option key={type} value={type}>{typeLabels.get(type) ?? type}</option>)}
                </select>
              </label>
              {(draft.type === "select" || draft.type === "multi_select") && (
                <label className="grid gap-1 text-sm">Opcje (każda w osobnej linii)<textarea className="participant-field-control" rows={3} value={draft.optionsText} onChange={(event) => setDraft({ ...draft, optionsText: event.target.value })} /></label>
              )}
              {draft.type === "number" && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1 text-sm">Najmniej<input className="participant-field-control" type="number" value={draft.min} onChange={(event) => setDraft({ ...draft, min: event.target.value })} /></label>
                  <label className="grid gap-1 text-sm">Najwięcej<input className="participant-field-control" type="number" value={draft.max} onChange={(event) => setDraft({ ...draft, max: event.target.value })} /></label>
                </div>
              )}
              <label className="grid gap-1 text-sm">Kto widzi
                <select className="participant-field-control" value={draft.visibility} onChange={(event) => setDraft({ ...draft, visibility: event.target.value as FieldDef["visibility"] })}>
                  {(Object.keys(VISIBILITY_LABELS) as FieldDef["visibility"][]).map((value) => <option key={value} value={value}>{VISIBILITY_LABELS[value]}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm">Dotyczy
                <select className="participant-field-control" value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as FieldDef["kind"] })}>
                  <option value="profile">Uczestnika (np. nick, miasto)</option>
                  <option value="entry">Zgłoszenia do tego turnieju (np. status, opłata)</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm">Opis (opcjonalnie)<input className="participant-field-control" maxLength={200} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={draft.required} onChange={(event) => setDraft({ ...draft, required: event.target.checked })} /> Wymagane przy dodawaniu</label>
              <div className="flex justify-end gap-2">
                <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={() => { setPanel("none"); setEditing(null); }}>Anuluj</button>
                <button type="button" className="experimental-v4-btn" data-variant="primary" onClick={commitDraft}>{editing ? "Zmień pole" : "Dodaj pole"}</button>
              </div>
            </div>
          )}

          {impact && (
            <div role="alert" className="participant-fields-impact">
              <p className="font-semibold">Ta zmiana usunie zapisane dane:</p>
              <ul>
                {impact.removed.map((item) => <li key={`r-${item.key}`}>„{item.label}” — pole usunięte, dane {item.count} {item.count === 1 ? "uczestnika" : "uczestników"}</li>)}
                {impact.retyped.map((item) => <li key={`t-${item.key}`}>„{item.label}” — zmieniony typ, dane {item.count} {item.count === 1 ? "uczestnika" : "uczestników"} nie zostaną przekonwertowane</li>)}
                {impact.invalid.map((item) => <li key={`i-${item.key}`}>„{item.label}” — {item.count} {item.count === 1 ? "wartość nie pasuje" : "wartości nie pasują"} do nowych ustawień</li>)}
              </ul>
              <div className="flex gap-2">
                <button type="button" className="experimental-v4-btn" data-variant="danger" onClick={() => submit(true)}>Usuń te dane i zapisz</button>
                <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={() => setImpact(null)}>Wróć do edycji</button>
              </div>
            </div>
          )}
          {message && <p role={message.tone === "error" ? "alert" : "status"} className={message.tone === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{message.text}</p>}

          <div className="participant-fields-footer">
            <details className="participant-fields-sets">
              <summary>Zestawy pól</summary>
              <div className="grid gap-2 pt-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <input className="participant-field-control flex-1" aria-label="Nazwa zestawu" maxLength={60} value={setName} onChange={(event) => setSetName(event.target.value)} placeholder="Nazwa zestawu, np. Liga CS" />
                  <button type="button" className="experimental-v4-btn" data-variant="ghost" disabled={fields.length === 0 || !setName.trim()} onClick={() => {
                    setSets(writeSavedSet(safeLocalStorage(), { name: setName.trim().slice(0, 60), savedAt: new Date().toISOString(), fields }));
                    setMessage({ tone: "ok", text: `Zapamiętano zestaw „${setName.trim()}”.` });
                    setSetName("");
                  }}><Save className="h-4 w-4" aria-hidden="true" /> Zapamiętaj zestaw</button>
                </div>
                {sets.map((set) => (
                  <div key={set.name} className="flex items-center gap-2">
                    <button type="button" className="experimental-wizard-link" onClick={() => change(set.fields.map((field) => ({ ...field })))}>Wczytaj „{set.name}” ({set.fields.length})</button>
                    <button type="button" aria-label={`Usuń zestaw ${set.name}`} onClick={() => setSets(deleteSavedSet(safeLocalStorage(), set.name))}><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="experimental-v4-btn" data-variant="ghost" disabled={fields.length === 0} onClick={() => {
                    const blob = new Blob([JSON.stringify({ version: 1, fields }, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = "pola-uczestnikow.json";
                    link.click();
                    URL.revokeObjectURL(url);
                  }}><Download className="h-4 w-4" aria-hidden="true" /> Pobierz plik</button>
                  <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" aria-hidden="true" /> Wczytaj plik</button>
                  <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={async (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file || file.size > 100_000) { setMessage({ tone: "error", text: "Plik jest za duży albo pusty." }); return; }
                    const parsed = parseFieldSetFile(await file.text());
                    if (!parsed) { setMessage({ tone: "error", text: "To nie jest plik z zestawem pól." }); return; }
                    change(parsed);
                    setMessage({ tone: "ok", text: `Wczytano ${parsed.length} pól — sprawdź i zapisz.` });
                  }} />
                </div>
                <p className="text-xs text-muted-foreground">Zestaw zapamiętany w przeglądarce działa tylko na tym urządzeniu. Plik możesz przenieść na inne.</p>
              </div>
            </details>
            <div className="flex gap-2">
              {dirty && <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={() => { setFields(saved); setDirty(false); setImpact(null); setMessage(null); }}>Cofnij zmiany</button>}
              <button type="button" className="experimental-v4-btn" data-variant="primary" disabled={!dirty || save.isPending} onClick={() => submit(false)}><Save className="h-4 w-4" aria-hidden="true" /> {save.isPending ? "Zapisywanie…" : "Zapisz pola"}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
