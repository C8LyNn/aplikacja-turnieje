import { type FormEvent, useMemo, useState } from "react";
import { ModuleHeader } from "@/components/portfolio-ui";
import {
  ToolButton,
  ToolEmptyState,
  ToolInput,
  ToolNotice,
  ToolPanel,
  ToolSelect,
  ToolTextarea,
} from "@/components/tool-ui";
import {
  discussionSummary,
  discussionTimeline,
} from "./discussion-analysis";
import type {
  DiscussionArgumentRole,
  DiscussionStatus,
} from "./model";
import { useResearchProject } from "./use-research-project";

const BASE = "/ludology/statement-classification";

const ROLE_LABELS: Record<DiscussionArgumentRole, string> = {
  primary: "Główny argument",
  response: "Odpowiedź",
  follow_up: "Dalszy ciąg",
  background: "Kontekst",
};

function PageHeader() {
  return (
    <ModuleHeader
      code="LUDO 02 / DEBATES"
      title="Debates / Discussions"
      description="Łącz argumenty z wielu źródeł i osób w jedną śledzalną dyskusję bez spłaszczania debaty do profilu pojedynczej osoby."
      accent="amber"
      backHref={BASE}
      backLabel="Kategoryzacja wypowiedzi i poglądów"
    />
  );
}

export default function DiscussionLab() {
  const {
    data,
    addDiscussion,
    updateDiscussion,
    deleteDiscussion,
    upsertDiscussionLink,
    deleteDiscussionLink,
  } = useResearchProject();

  const [selectedDiscussionId, setSelectedDiscussionId] = useState(
    data.discussions[0]?.id ?? "",
  );
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [argumentId, setArgumentId] = useState("");
  const [role, setRole] = useState<DiscussionArgumentRole>("primary");
  const [note, setNote] = useState("");
  const [order, setOrder] = useState("");

  const selected = data.discussions.find(
    (discussion) => discussion.id === selectedDiscussionId,
  );
  const timeline = selected
    ? discussionTimeline(data, selected.id)
    : [];
  const summary = selected
    ? discussionSummary(data, selected.id)
    : null;

  const linkedArgumentIds = new Set(timeline.map((item) => item.argument.id));
  const availableArguments = data.arguments.filter(
    (argument) => !linkedArgumentIds.has(argument.id),
  );

  const sourceById = useMemo(
    () => new Map(data.sources.map((source) => [source.id, source] as const)),
    [data.sources],
  );
  const personById = useMemo(
    () => new Map(data.people.map((person) => [person.id, person] as const)),
    [data.people],
  );

  function createDiscussion(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    const id = addDiscussion({
      title: title.trim(),
      question: question.trim() || undefined,
      description: description.trim() || undefined,
      status: "draft",
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    setSelectedDiscussionId(id);
    setTitle("");
    setQuestion("");
    setDescription("");
    setTags("");
  }

  function removeDiscussion() {
    if (!selected) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Usunąć debatę „${selected.title}” i jej powiązania z argumentami?`)
    ) return;
    deleteDiscussion(selected.id);
    setSelectedDiscussionId(
      data.discussions.find((discussion) => discussion.id !== selected.id)?.id ?? "",
    );
  }

  function linkArgument(event: FormEvent) {
    event.preventDefault();
    if (!selected || !argumentId) return;
    upsertDiscussionLink(
      { discussionId: selected.id, argumentId },
      {
        role,
        note: note.trim() || undefined,
        order: order.trim() ? Math.max(0, Number(order) || 0) : undefined,
      },
    );
    setArgumentId("");
    setRole("primary");
    setNote("");
    setOrder("");
  }

  return (
    <>
      <PageHeader />

      <div className="space-y-4">
        <ToolNotice>
          Debata jest obiektem ponad źródłami. Ten sam twórca może pojawiać się po kilku stronach różnych dyskusji, a argument nie jest automatycznie utożsamiany z trwałym „poglądem osoby”.
        </ToolNotice>

        <div className="grid gap-4 xl:grid-cols-[390px_1fr]">
          <ToolPanel
            title="Nowa debata"
            description="Najlepiej formułuj temat jako konkretne pytanie badawcze."
          >
            <form className="space-y-3" onSubmit={createDiscussion}>
              <ToolInput
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Nazwa, np. Walking simulators"
              />
              <ToolInput
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Pytanie, np. Czy walking simulatory są grami?"
              />
              <ToolTextarea
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Zakres i kontekst dyskusji"
              />
              <ToolInput
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="Tagi po przecinku"
              />
              <ToolButton type="submit" variant="primary">
                Utwórz debatę
              </ToolButton>
            </form>
          </ToolPanel>

          <ToolPanel title={`Debaty w korpusie (${data.discussions.length})`}>
            {data.discussions.length === 0 ? (
              <ToolEmptyState
                title="Brak debat"
                description="Utwórz pierwszą dyskusję i przypisz do niej argumenty z istniejących źródeł."
              />
            ) : (
              <div className="space-y-3">
                <ToolSelect
                  value={selectedDiscussionId}
                  onChange={(event) => setSelectedDiscussionId(event.target.value)}
                >
                  {data.discussions.map((discussion) => (
                    <option key={discussion.id} value={discussion.id}>
                      {discussion.title} · {discussion.status}
                    </option>
                  ))}
                </ToolSelect>

                {selected && (
                  <div className="rounded-xl border border-border bg-background/40 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-lg font-black">{selected.title}</div>
                        {selected.question && (
                          <div className="mt-1 text-sm font-semibold">{selected.question}</div>
                        )}
                        {selected.description && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            {selected.description}
                          </div>
                        )}
                        {selected.tags && selected.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {selected.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <ToolSelect
                          className="w-auto"
                          value={selected.status}
                          onChange={(event) =>
                            updateDiscussion(selected.id, {
                              status: event.target.value as DiscussionStatus,
                            })
                          }
                        >
                          <option value="draft">draft</option>
                          <option value="active">active</option>
                          <option value="closed">closed</option>
                          <option value="archived">archived</option>
                        </ToolSelect>
                        <ToolButton type="button" variant="ghost" onClick={removeDiscussion}>
                          Usuń
                        </ToolButton>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ToolPanel>
        </div>

        {selected && summary && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <div className="rounded-2xl border border-border bg-card/60 p-4">
                <div className="text-2xl font-black">{summary.arguments}</div>
                <div className="text-xs text-muted-foreground">argumentów</div>
              </div>
              <div className="rounded-2xl border border-border bg-card/60 p-4">
                <div className="text-2xl font-black">{summary.sources}</div>
                <div className="text-xs text-muted-foreground">źródeł</div>
              </div>
              <div className="rounded-2xl border border-border bg-card/60 p-4">
                <div className="text-2xl font-black">{summary.people}</div>
                <div className="text-xs text-muted-foreground">osób</div>
              </div>
              <div className="rounded-2xl border border-border bg-card/60 p-4">
                <div className="text-xl font-black">{summary.firstPublishedAt ?? "—"}</div>
                <div className="text-xs text-muted-foreground">pierwszy materiał</div>
              </div>
              <div className="rounded-2xl border border-border bg-card/60 p-4">
                <div className="text-xl font-black">{summary.lastPublishedAt ?? "—"}</div>
                <div className="text-xs text-muted-foreground">ostatni materiał</div>
              </div>
              <div className="rounded-2xl border border-border bg-card/60 p-4">
                <div className="text-2xl font-black">{summary.undatedArguments}</div>
                <div className="text-xs text-muted-foreground">argumentów bez daty</div>
              </div>
            </div>

            <ToolPanel
              title="Dodaj argument do debaty"
              description="Rola opisuje funkcję argumentu w historii dyskusji, nie jego ideologiczny kierunek."
            >
              {data.arguments.length === 0 ? (
                <ToolEmptyState
                  title="Brak argumentów"
                  description="Najpierw wydziel argumenty w Warsztacie źródeł."
                />
              ) : availableArguments.length === 0 ? (
                <ToolNotice>Wszystkie istniejące argumenty są już przypisane do tej debaty.</ToolNotice>
              ) : (
                <form className="grid gap-3 lg:grid-cols-[2fr_1fr_100px] lg:items-end" onSubmit={linkArgument}>
                  <div>
                    <div className="mb-1 text-xs font-bold text-muted-foreground">Argument</div>
                    <ToolSelect
                      value={argumentId}
                      onChange={(event) => setArgumentId(event.target.value)}
                    >
                      <option value="">Wybierz argument…</option>
                      {availableArguments.map((argument) => {
                        const source = sourceById.get(argument.sourceId);
                        const person = source ? personById.get(source.personId) : undefined;
                        return (
                          <option key={argument.id} value={argument.id}>
                            {person?.displayName ?? "?"} · {source?.title ?? "?"} · {argument.title ?? argument.topic ?? argument.id}
                          </option>
                        );
                      })}
                    </ToolSelect>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-bold text-muted-foreground">Rola</div>
                    <ToolSelect
                      value={role}
                      onChange={(event) => setRole(event.target.value as DiscussionArgumentRole)}
                    >
                      <option value="primary">Główny argument</option>
                      <option value="response">Odpowiedź</option>
                      <option value="follow_up">Dalszy ciąg</option>
                      <option value="background">Kontekst</option>
                    </ToolSelect>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-bold text-muted-foreground">Kolejność</div>
                    <ToolInput
                      type="number"
                      min="0"
                      value={order}
                      onChange={(event) => setOrder(event.target.value)}
                      placeholder="auto"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <ToolInput
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Notatka: jak ten argument wchodzi do debaty?"
                    />
                  </div>
                  <ToolButton type="submit" variant="primary" disabled={!argumentId}>
                    Dodaj
                  </ToolButton>
                </form>
              )}
            </ToolPanel>

            <ToolPanel
              title="Chronologia argumentów"
              description="Sortowanie używa daty materiału, następnie timestampu argumentu. Materiały bez daty pozostają jawnie oznaczone i trafiają na koniec."
            >
              {timeline.length === 0 ? (
                <ToolEmptyState
                  title="Debata nie ma jeszcze argumentów"
                  description="Dodaj argumenty z kilku źródeł, aby odtworzyć przebieg dyskusji."
                />
              ) : (
                <div className="space-y-3">
                  {timeline.map((item, index) => (
                    <div
                      key={item.link.id}
                      className="rounded-xl border border-border bg-background/40 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                            {String(index + 1).padStart(2, "0")} · {ROLE_LABELS[item.link.role]} · {item.publishedAt ?? "brak daty"}
                          </div>
                          <div className="mt-1 font-bold">
                            {item.argument.title ?? item.argument.topic ?? "Argument bez tytułu"}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {item.person?.displayName ?? "Nieznana osoba"} · {item.source.title}
                            {item.argument.timestampStart !== undefined ? ` · ${Math.round(item.argument.timestampStart)} s` : ""}
                          </div>
                          {item.argument.summary && (
                            <div className="mt-2 text-sm">{item.argument.summary}</div>
                          )}
                          {item.link.note && (
                            <div className="mt-2 text-sm text-muted-foreground">{item.link.note}</div>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <ToolSelect
                            className="w-auto"
                            value={item.link.role}
                            onChange={(event) =>
                              upsertDiscussionLink(
                                {
                                  discussionId: selected.id,
                                  argumentId: item.argument.id,
                                },
                                {
                                  role: event.target.value as DiscussionArgumentRole,
                                  note: item.link.note,
                                  order: item.link.order,
                                },
                              )
                            }
                          >
                            <option value="primary">Główny</option>
                            <option value="response">Odpowiedź</option>
                            <option value="follow_up">Dalszy ciąg</option>
                            <option value="background">Kontekst</option>
                          </ToolSelect>
                          <ToolButton
                            type="button"
                            variant="ghost"
                            onClick={() => deleteDiscussionLink(item.link.id)}
                          >
                            Odepnij
                          </ToolButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ToolPanel>

            <ToolPanel
              title="Granica interpretacji"
              description="Debata porządkuje relacje między publicznymi argumentami; nie rozstrzyga automatycznie, kto ma rację."
            >
              <div className="text-sm leading-6 text-muted-foreground">
                Argument może należeć do więcej niż jednej debaty, jeżeli rzeczywiście dotyczy kilku pytań. Powiązanie jest jawne i audytowalne, a późniejsza analiza może porównywać strony sporu bez przepisywania źródeł lub kodowań.
              </div>
            </ToolPanel>
          </>
        )}
      </div>
    </>
  );
}
