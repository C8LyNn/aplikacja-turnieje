import { type FormEvent, useState } from "react";
import {
  ToolButton,
  ToolEmptyState,
  ToolInput,
  ToolNotice,
  ToolPanel,
  ToolSelect,
  ToolTextarea,
} from "@/components/tool-ui";
import { ModuleHeader } from "@/components/portfolio-ui";
import { useResearchProject } from "./use-research-project";

const BASE = "/ludology/statement-classification";

function PageHeader({ section, title, description }: { section: string; title: string; description: string }) {
  return (
    <ModuleHeader
      code={`LUDO 02 / ${section}`}
      title={title}
      description={description}
      accent="amber"
      backHref={BASE}
      backLabel="Kategoryzacja wypowiedzi i poglądów"
    />
  );
}

export default function ResearchWorkspace() {
  const { data, updateSource, addArgument, updateArgument, deleteArgument, addExcerpt, updateExcerpt, deleteExcerpt } = useResearchProject();
  const [sourceId, setSourceId] = useState("");
  const selectedSource = data.sources.find((source) => source.id === sourceId);
  const [transcript, setTranscript] = useState("");
  const [argumentTitle, setArgumentTitle] = useState("");
  const [argumentSummary, setArgumentSummary] = useState("");
  const [excerptText, setExcerptText] = useState("");
  const [excerptContext, setExcerptContext] = useState("");
  const [excerptContextAfter, setExcerptContextAfter] = useState("");
  const [argumentId, setArgumentId] = useState("");
  const [timestampStart, setTimestampStart] = useState("");
  const [timestampEnd, setTimestampEnd] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<"unverified" | "checked" | "verified">("unverified");
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [editingArgumentId, setEditingArgumentId] = useState("");
  const [editArgumentTitle, setEditArgumentTitle] = useState("");
  const [editArgumentSummary, setEditArgumentSummary] = useState("");
  const [editingExcerptId, setEditingExcerptId] = useState("");
  const [editExcerptText, setEditExcerptText] = useState("");
  const [editExcerptContextBefore, setEditExcerptContextBefore] = useState("");
  const [editExcerptContextAfter, setEditExcerptContextAfter] = useState("");
  const [editExcerptTimestampStart, setEditExcerptTimestampStart] = useState("");
  const [editExcerptTimestampEnd, setEditExcerptTimestampEnd] = useState("");
  const [editExcerptArgumentId, setEditExcerptArgumentId] = useState("");

  function chooseSource(nextId: string) {
    setSourceId(nextId);
    const source = data.sources.find((item) => item.id === nextId);
    setTranscript(source?.transcript ?? "");
    setArgumentId("");
  }

  function saveTranscript() {
    if (!selectedSource) return;
    updateSource(selectedSource.id, {
      transcript,
      transcriptType: selectedSource.transcriptType ?? "manual",
    });
  }

  function useTranscriptSelection() {
    if (selectionEnd <= selectionStart) return;
    const text = transcript.slice(selectionStart, selectionEnd).trim();
    if (!text) return;
    const before = transcript.slice(Math.max(0, selectionStart - 280), selectionStart).trim();
    const after = transcript.slice(selectionEnd, Math.min(transcript.length, selectionEnd + 280)).trim();
    setExcerptText(text);
    setExcerptContext(before);
    setExcerptContextAfter(after);
  }

  function submitArgument(event: FormEvent) {
    event.preventDefault();
    if (!selectedSource || !argumentTitle.trim()) return;
    addArgument({
      sourceId: selectedSource.id,
      title: argumentTitle.trim(),
      summary: argumentSummary.trim() || undefined,
    });
    setArgumentTitle("");
    setArgumentSummary("");
  }

  function startArgumentEdit(argumentId: string) {
    const argument = data.arguments.find((item) => item.id === argumentId);
    if (!argument) return;
    setEditingArgumentId(argument.id);
    setEditArgumentTitle(argument.title ?? "");
    setEditArgumentSummary(argument.summary ?? "");
  }

  function saveArgumentEdit(argumentId: string) {
    if (!editArgumentTitle.trim()) return;
    updateArgument(argumentId, {
      title: editArgumentTitle.trim(),
      summary: editArgumentSummary.trim() || undefined,
    });
    setEditingArgumentId("");
  }

  function startExcerptEdit(excerptId: string) {
    const excerpt = data.excerpts.find((item) => item.id === excerptId);
    if (!excerpt) return;
    setEditingExcerptId(excerpt.id);
    setEditExcerptText(excerpt.text);
    setEditExcerptContextBefore(excerpt.contextBefore ?? "");
    setEditExcerptContextAfter(excerpt.contextAfter ?? "");
    setEditExcerptTimestampStart(excerpt.timestampStart === undefined ? "" : String(excerpt.timestampStart));
    setEditExcerptTimestampEnd(excerpt.timestampEnd === undefined ? "" : String(excerpt.timestampEnd));
    setEditExcerptArgumentId(excerpt.argumentId ?? "");
  }

  function saveExcerptEdit(excerptId: string) {
    if (!editExcerptText.trim()) return;
    updateExcerpt(excerptId, {
      text: editExcerptText.trim(),
      contextBefore: editExcerptContextBefore.trim() || undefined,
      contextAfter: editExcerptContextAfter.trim() || undefined,
      timestampStart: editExcerptTimestampStart === "" ? undefined : Number(editExcerptTimestampStart),
      timestampEnd: editExcerptTimestampEnd === "" ? undefined : Number(editExcerptTimestampEnd),
      argumentId: editExcerptArgumentId || undefined,
    });
    setEditingExcerptId("");
  }

  function submitExcerpt(event: FormEvent) {
    event.preventDefault();
    if (!selectedSource || !excerptText.trim()) return;
    addExcerpt({
      sourceId: selectedSource.id,
      argumentId: argumentId || undefined,
      text: excerptText.trim(),
      contextBefore: excerptContext.trim() || undefined,
      contextAfter: excerptContextAfter.trim() || undefined,
      timestampStart: timestampStart === "" ? undefined : Number(timestampStart),
      timestampEnd: timestampEnd === "" ? undefined : Number(timestampEnd),
      verificationStatus,
    });
    setExcerptText("");
    setExcerptContext("");
    setExcerptContextAfter("");
    setTimestampStart("");
    setTimestampEnd("");
    setVerificationStatus("unverified");
  }

  const sourceArguments = data.arguments.filter((argument) => argument.sourceId === sourceId);
  const sourceExcerpts = data.excerpts.filter((excerpt) => excerpt.sourceId === sourceId);

  return (
    <>
      <PageHeader
        section="WORK"
        title="Warsztat źródeł"
        description="Z materiału źródłowego wydzielaj argumenty i konkretne fragmenty bez utraty kontekstu."
      />
      {data.sources.length === 0 ? (
        <ToolPanel>
          <ToolEmptyState title="Najpierw potrzebne jest źródło" description="Dodaj osobę i materiał w sekcji Źródła." />
        </ToolPanel>
      ) : (
        <div className="space-y-4">
          <ToolPanel title="Wybierz materiał">
            <ToolSelect value={sourceId} onChange={(event) => chooseSource(event.target.value)}>
              <option value="">Wybierz źródło…</option>
              {data.sources.map((source) => {
                const person = data.people.find((item) => item.id === source.personId);
                return <option key={source.id} value={source.id}>{person?.displayName ?? "?"} — {source.title}</option>;
              })}
            </ToolSelect>
          </ToolPanel>

          {selectedSource && (
            <>
              <ToolPanel
                title="Transkrypcja / tekst źródłowy"
                description="Na razie zapis lokalny. Docelowo importer i wersjonowanie transkrypcji."
                actions={<ToolButton type="button" variant="primary" onClick={saveTranscript}>Zapisz tekst</ToolButton>}
              >
                <ToolTextarea
                  rows={14}
                  value={transcript}
                  onChange={(event) => setTranscript(event.target.value)}
                  onSelect={(event) => {
                    setSelectionStart(event.currentTarget.selectionStart);
                    setSelectionEnd(event.currentTarget.selectionEnd);
                  }}
                  placeholder="Wklej transkrypcję, artykuł albo tekst wypowiedzi…"
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ToolButton type="button" onClick={useTranscriptSelection} disabled={selectionEnd <= selectionStart}>
                    Użyj zaznaczenia jako fragmentu
                  </ToolButton>
                  <span className="text-xs text-muted-foreground">
                    {selectionEnd > selectionStart ? `Zaznaczono ${selectionEnd - selectionStart} znaków` : "Zaznacz tekst w transkrypcji."}
                  </span>
                </div>
              </ToolPanel>

              <div className="grid gap-4 xl:grid-cols-2">
                <ToolPanel title="Dodaj argument" description="Kilka cytatów z jednego argumentu pozostaje częścią jednej jednostki argumentacyjnej.">
                  <form className="space-y-3" onSubmit={submitArgument}>
                    <ToolInput value={argumentTitle} onChange={(e) => setArgumentTitle(e.target.value)} placeholder="Krótka nazwa argumentu" />
                    <ToolTextarea rows={4} value={argumentSummary} onChange={(e) => setArgumentSummary(e.target.value)} placeholder="Streszczenie argumentacji (opcjonalnie)" />
                    <ToolButton type="submit" variant="primary">Dodaj argument</ToolButton>
                  </form>
                  {sourceArguments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {sourceArguments.map((argument) => (
                        <div key={argument.id} className="rounded-xl border border-border bg-background/40 p-3">
                          {editingArgumentId === argument.id ? (
                            <div className="space-y-3">
                              <ToolInput value={editArgumentTitle} onChange={(e) => setEditArgumentTitle(e.target.value)} />
                              <ToolTextarea rows={3} value={editArgumentSummary} onChange={(e) => setEditArgumentSummary(e.target.value)} placeholder="Streszczenie argumentu" />
                              <div className="flex flex-wrap gap-2">
                                <ToolButton type="button" variant="primary" onClick={() => saveArgumentEdit(argument.id)}>Zapisz</ToolButton>
                                <ToolButton type="button" variant="ghost" onClick={() => setEditingArgumentId("")}>Anuluj</ToolButton>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-bold">{argument.title || "Argument bez tytułu"}</div>
                                {argument.summary && <div className="mt-1 text-xs text-muted-foreground">{argument.summary}</div>}
                              </div>
                              <div className="flex shrink-0 gap-1">
                                <ToolButton type="button" variant="ghost" onClick={() => startArgumentEdit(argument.id)}>Edytuj</ToolButton>
                                <ToolButton type="button" variant="ghost" onClick={() => deleteArgument(argument.id)}>Usuń</ToolButton>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ToolPanel>

                <ToolPanel title="Dodaj fragment" description="Fragment jest materiałem dowodowym, a nie jeszcze wnioskiem o poglądzie osoby.">
                  <form className="space-y-3" onSubmit={submitExcerpt}>
                    <ToolSelect value={argumentId} onChange={(e) => setArgumentId(e.target.value)}>
                      <option value="">Bez przypisanego argumentu</option>
                      {sourceArguments.map((argument) => <option key={argument.id} value={argument.id}>{argument.title || "Argument"}</option>)}
                    </ToolSelect>
                    <ToolTextarea rows={6} value={excerptText} onChange={(e) => setExcerptText(e.target.value)} placeholder="Dokładny cytat / fragment…" />
                    <ToolTextarea rows={3} value={excerptContext} onChange={(e) => setExcerptContext(e.target.value)} placeholder="Kontekst przed fragmentem…" />
                    <ToolTextarea rows={3} value={excerptContextAfter} onChange={(e) => setExcerptContextAfter(e.target.value)} placeholder="Kontekst po fragmencie…" />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ToolInput type="number" min="0" step="0.1" value={timestampStart} onChange={(e) => setTimestampStart(e.target.value)} placeholder="Start [s]" />
                      <ToolInput type="number" min="0" step="0.1" value={timestampEnd} onChange={(e) => setTimestampEnd(e.target.value)} placeholder="Koniec [s]" />
                    </div>
                    <ToolSelect value={verificationStatus} onChange={(e) => setVerificationStatus(e.target.value as typeof verificationStatus)}>
                      <option value="unverified">Status: nieweryfikowany</option>
                      <option value="checked">Status: sprawdzony</option>
                      <option value="verified">Status: zweryfikowany</option>
                    </ToolSelect>
                    <ToolButton type="submit" variant="primary">Utwórz fragment</ToolButton>
                  </form>
                </ToolPanel>
              </div>

              <ToolPanel title={`Fragmenty tego źródła (${sourceExcerpts.length})`}>
                {sourceExcerpts.length === 0 ? (
                  <ToolEmptyState title="Brak fragmentów" description="Wydziel pierwszy fragment, który później trafi do Coding Lab." />
                ) : (
                  <div className="space-y-3">
                    {sourceExcerpts.map((excerpt) => {
                      const argument = data.arguments.find((item) => item.id === excerpt.argumentId);
                      return (
                        <div key={excerpt.id} className="rounded-xl border border-border bg-background/40 p-4">
                          {editingExcerptId === excerpt.id ? (
                            <div className="space-y-3">
                              <ToolSelect value={editExcerptArgumentId} onChange={(e) => setEditExcerptArgumentId(e.target.value)}>
                                <option value="">Bez przypisanego argumentu</option>
                                {sourceArguments.map((item) => <option key={item.id} value={item.id}>{item.title || "Argument"}</option>)}
                              </ToolSelect>
                              <ToolTextarea rows={5} value={editExcerptText} onChange={(e) => setEditExcerptText(e.target.value)} />
                              <ToolTextarea rows={3} value={editExcerptContextBefore} onChange={(e) => setEditExcerptContextBefore(e.target.value)} placeholder="Kontekst przed" />
                              <ToolTextarea rows={3} value={editExcerptContextAfter} onChange={(e) => setEditExcerptContextAfter(e.target.value)} placeholder="Kontekst po" />
                              <div className="grid gap-3 sm:grid-cols-2">
                                <ToolInput type="number" min="0" step="0.1" value={editExcerptTimestampStart} onChange={(e) => setEditExcerptTimestampStart(e.target.value)} placeholder="Start [s]" />
                                <ToolInput type="number" min="0" step="0.1" value={editExcerptTimestampEnd} onChange={(e) => setEditExcerptTimestampEnd(e.target.value)} placeholder="Koniec [s]" />
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <ToolButton type="button" variant="primary" onClick={() => saveExcerptEdit(excerpt.id)}>Zapisz fragment</ToolButton>
                                <ToolButton type="button" variant="ghost" onClick={() => setEditingExcerptId("")}>Anuluj</ToolButton>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                  {argument?.title ?? "Bez argumentu"}
                                  {excerpt.timestampStart !== undefined ? ` · ${excerpt.timestampStart}s${excerpt.timestampEnd !== undefined ? `–${excerpt.timestampEnd}s` : ""}` : ""}
                                </div>
                                <div className="flex items-center gap-2">
                                  <ToolSelect
                                    className="w-auto py-1 text-xs"
                                    value={excerpt.verificationStatus ?? "unverified"}
                                    onChange={(e) => updateExcerpt(excerpt.id, { verificationStatus: e.target.value as "unverified" | "checked" | "verified" })}
                                  >
                                    <option value="unverified">nieweryfikowany</option>
                                    <option value="checked">sprawdzony</option>
                                    <option value="verified">zweryfikowany</option>
                                  </ToolSelect>
                                  <ToolButton type="button" variant="ghost" onClick={() => startExcerptEdit(excerpt.id)}>Edytuj</ToolButton>
                                  <ToolButton type="button" variant="ghost" onClick={() => deleteExcerpt(excerpt.id)}>Usuń</ToolButton>
                                </div>
                              </div>
                              <blockquote className="text-sm leading-6">“{excerpt.text}”</blockquote>
                              {excerpt.contextBefore && <div className="mt-2 text-xs text-muted-foreground">Przed: {excerpt.contextBefore}</div>}
                              {excerpt.contextAfter && <div className="mt-1 text-xs text-muted-foreground">Po: {excerpt.contextAfter}</div>}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ToolPanel>
            </>
          )}
        </div>
      )}
    </>
  );
}
