import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetTournamentQueryKey, useGetStageLiveStandings, getGetStageLiveStandingsQueryKey, useUpdateTournament,
  type Match, type TournamentStage,
} from "@workspace/api-client-react";
import { ArrowLeft, Check, CheckCircle2, Copy, ExternalLink, Info, MonitorPlay, RotateCcw, SkipForward, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  OVERLAY_DEFAULTS, OVERLAY_KINDS, OVERLAY_PRESETS, OVERLAY_RESOLUTIONS, eliminationRoundName, overlayUrl, parseOverlayParams,
  type OverlayConfig,
} from "@/lib/broadcast-overlay";
import { tournamentHref } from "./experimental-tournament-routing";

interface BroadcastTournament {
  id: number;
  name: string;
  visibility?: string | null;
  featuredMatchId?: number | null;
  activeStageId?: number | null;
}

type Resolution = (typeof OVERLAY_RESOLUTIONS)[number]["id"];
type PreviewScene = "szachownica" | "jasna" | "ciemna";
const STATUS: Record<string, string> = { in_progress: "na żywo", completed: "zakończony", pending: "przed meczem", postponed: "przełożony", cancelled: "odwołany" };
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

/** V5.9.1 · the panel remembers its choices per tournament (this browser only); read back through the overlay's own parser. */
const storageKey = (tournamentId: number) => `tm_broadcast_v1:${tournamentId}`;
function readSaved(tournamentId: number): { config: OverlayConfig; resolution: Resolution; scene: PreviewScene } {
  const fallback = { config: { ...OVERLAY_DEFAULTS, tournamentId }, resolution: "1080p" as Resolution, scene: "szachownica" as PreviewScene };
  try {
    const raw = window.localStorage.getItem(storageKey(tournamentId));
    if (!raw) return fallback;
    const saved = JSON.parse(raw) as { query?: unknown; resolution?: unknown; scene?: unknown };
    const config = typeof saved.query === "string" ? { ...parseOverlayParams(saved.query), tournamentId } : fallback.config;
    const resolution = OVERLAY_RESOLUTIONS.some((r) => r.id === saved.resolution) ? (saved.resolution as Resolution) : fallback.resolution;
    const scene = saved.scene === "jasna" || saved.scene === "ciemna" ? saved.scene : fallback.scene;
    return { config, resolution, scene };
  } catch {
    return fallback;
  }
}
function writeSaved(tournamentId: number, config: OverlayConfig, resolution: Resolution, scene: PreviewScene) {
  try {
    const query = new URL(overlayUrl("http://x.invalid", "/", config)).search;
    window.localStorage.setItem(storageKey(tournamentId), JSON.stringify({ query, resolution, scene }));
  } catch {
    // storage blocked or full: the panel still works, it just does not remember
  }
}

/** Matches in the host queue's order: the organizer's order first, then round and number. */
const queueOrder = (stagePosition: (m: Match) => number) => (a: Match, b: Match) =>
  stagePosition(a) - stagePosition(b) || (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER)
  || a.round - b.round || a.matchNumber - b.matchNumber || a.id - b.id;

/**
 * V5.9 · "Transmisja": an optional place to pick an overlay, see it on real data and copy its address for OBS.
 * Nothing here is needed to run a tournament. The only change it can make is the existing "Na ekranie" choice.
 * V5.9.1 · six short steps in the order a first-time OBS user needs them; advanced settings stay folded.
 */
export function ExperimentalBroadcastPanel({
  tournament,
  matches,
  stages,
  canFeature,
}: {
  tournament: BroadcastTournament;
  matches: readonly Match[];
  stages: readonly TournamentStage[];
  /** The organizer (or support) may change which match is "Na ekranie". */
  canFeature: boolean;
}) {
  const queryClient = useQueryClient();
  const isPublic = (tournament.visibility ?? "public_online") === "public_online";
  const ordered = useMemo(() => [...stages].sort((a, b) => a.position - b.position), [stages]);
  const [initial] = useState(() => readSaved(tournament.id));
  const [config, setConfig] = useState<OverlayConfig>(initial.config);
  const [resolution, setResolution] = useState<Resolution>(initial.resolution);
  const [scene, setScene] = useState<PreviewScene>(initial.scene);
  const [copied, setCopied] = useState<"ok" | "manual" | null>(null);
  const [candidate, setCandidate] = useState<number | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof OverlayConfig>(key: K, value: OverlayConfig[K]) => { setCopied(null); setConfig((current) => ({ ...current, [key]: value })); };
  useEffect(() => { writeSaved(tournament.id, config, resolution, scene); }, [tournament.id, config, resolution, scene]);
  useEffect(() => {
    if (copied !== "ok") return;
    const timer = setTimeout(() => setCopied(null), 6000);
    return () => clearTimeout(timer);
  }, [copied]);

  const stageById = new Map(ordered.map((stage) => [stage.id, stage]));
  const stagePosition = (m: Match) => stageById.get(m.stageId)?.position ?? 0;
  const featured = matches.find((m) => m.id === tournament.featuredMatchId) ?? null;
  const matchLabel = (m: Match) => {
    const stage = stageById.get(m.stageId);
    return `${stage && ordered.length > 1 ? `${stage.name} · ` : ""}R${m.round} M${m.matchNumber} · ${m.player1Name ?? "?"} – ${m.player2Name ?? "?"} · ${STATUS[m.status] ?? m.status}`;
  };
  const selectable = matches.filter((m) => m.player1Name || m.player2Name).slice().sort(queueOrder(stagePosition));
  const live = selectable.filter((m) => m.status === "in_progress");
  const upcoming = selectable.filter((m) => m.status === "pending" || m.status === "postponed");
  const finished = selectable.filter((m) => m.status === "completed" || m.status === "cancelled");
  const nextMatch = upcoming.find((m) => m.id !== featured?.id && m.player1Id != null && m.player2Id != null && m.status === "pending") ?? null;

  const structureStage = ordered.find((s) => s.id === config.stage) ?? ordered.find((s) => s.id === tournament.activeStageId)
    ?? [...ordered].reverse().find((s) => s.status !== "planned") ?? ordered[0];
  const stageRounds = structureStage?.format === "single_elimination"
    ? [...new Set(matches.filter((m) => m.stageId === structureStage.id).map((m) => m.round))].sort((a, b) => a - b) : [];
  const tablesStage = structureStage && ["group_stage", "round_robin", "swiss"].includes(structureStage.format) && structureStage.status !== "planned" ? structureStage : null;
  const standings = useGetStageLiveStandings(tournament.id, tablesStage?.id ?? 0, {
    query: { enabled: !!tablesStage && config.kind === "struktura", queryKey: getGetStageLiveStandingsQueryKey(tournament.id, tablesStage?.id ?? 0), retry: false },
  });
  const groupLabels = (standings.data?.tables ?? []).map((table) => table.label).filter((label) => !!label);

  const feature = useUpdateTournament({ mutation: {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(tournament.id) }),
  } });
  const putOnScreen = (matchId: number | null) => feature.mutate({ id: tournament.id, data: { featuredMatchId: matchId } as never });

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const local = typeof window !== "undefined" && LOCAL_HOSTS.has(window.location.hostname);
  const url = overlayUrl(origin, import.meta.env?.BASE_URL ?? "/", config);
  const res = OVERLAY_RESOLUTIONS.find((r) => r.id === resolution)!;
  const kind = OVERLAY_KINDS.find((k) => k.id === config.kind)!;
  const preset = OVERLAY_PRESETS.find((p) => p.id === config.preset)!;
  const looksDefault = config.layout === OVERLAY_DEFAULTS.layout && config.scoreSize === OVERLAY_DEFAULTS.scoreSize && config.textScale === OVERLAY_DEFAULTS.textScale
    && config.motion === OVERLAY_DEFAULTS.motion && config.background === OVERLAY_DEFAULTS.background && config.position === OVERLAY_DEFAULTS.position
    && config.showTitle === OVERLAY_DEFAULTS.showTitle && config.showQueue === OVERLAY_DEFAULTS.showQueue;
  const resetLook = () => setConfig((current) => ({ ...current, layout: OVERLAY_DEFAULTS.layout, scoreSize: OVERLAY_DEFAULTS.scoreSize, textScale: OVERLAY_DEFAULTS.textScale,
    motion: OVERLAY_DEFAULTS.motion, background: OVERLAY_DEFAULTS.background, position: OVERLAY_DEFAULTS.position, showTitle: OVERLAY_DEFAULTS.showTitle, showQueue: OVERLAY_DEFAULTS.showQueue }));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied("ok");
    } catch {
      urlRef.current?.focus();
      urlRef.current?.select();
      setCopied("manual");
    }
  };

  const showsMatch = config.kind !== "struktura";
  const noMatchOnScreen = showsMatch && config.match === "ekran" && !featured;
  const step = (n: number, title: string) => <legend className="experimental-broadcast-step text-sm font-semibold"><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs" aria-hidden>{n}</span>{title}</legend>;

  return (
    <section aria-labelledby="broadcast-heading" className="experimental-broadcast space-y-6" data-testid="broadcast-panel">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="broadcast-heading" className="flex items-center gap-2 text-xl font-semibold"><MonitorPlay className="h-5 w-5" aria-hidden /> Transmisja</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Nakładka na obraz w OBS. Dodatek — turniej działa bez niej. Pokazuje tylko zapisane wyniki i dane publiczne.
          </p>
        </div>
        <Button variant="outline" asChild className="min-h-11">
          <Link href={tournamentHref(tournament.id, true, "/host")}><ArrowLeft className="mr-1 h-4 w-4" aria-hidden /> Wróć do prowadzenia</Link>
        </Button>
      </header>

      {!isPublic && (
        <div role="status" className="experimental-broadcast-notice flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            Ten turniej nie jest publiczny, więc nakładka pokaże tylko komunikat „Nakładki działają tylko dla turniejów
            publicznych”. Nakładka nigdy nie używa hasła ani tokenu organizatora. Widoczność zmienisz w{" "}
            <Link className="underline" href={tournamentHref(tournament.id, true, "?tab=sharing")}>Udostępnianiu</Link>.
          </span>
        </div>
      )}

      <section aria-label="Mecz na ekranie" className="experimental-broadcast-onscreen rounded-lg border p-3" data-testid="broadcast-on-screen">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <Star className="h-4 w-4 text-amber-400" aria-hidden />
          <span className="font-semibold">Na ekranie:</span>
          {featured ? <strong data-testid="broadcast-featured">{matchLabel(featured)}</strong> : <span className="text-muted-foreground">żaden mecz</span>}
        </p>
        {canFeature && (
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <label className="flex min-w-[16rem] flex-1 flex-col gap-1 text-sm">
              <span>Zmień mecz na ekranie</span>
              <select className="min-h-11 rounded-md border bg-background px-3" disabled={!selectable.length}
                value={candidate ?? featured?.id ?? ""} onChange={(event) => setCandidate(Number(event.target.value) || null)}>
                {!featured && <option value="">Wybierz mecz…</option>}
                {live.length > 0 && <optgroup label="Na żywo">{live.map((m) => <option key={m.id} value={m.id}>{matchLabel(m)}</option>)}</optgroup>}
                {upcoming.length > 0 && <optgroup label="Przed meczem">{upcoming.map((m) => <option key={m.id} value={m.id}>{matchLabel(m)}</option>)}</optgroup>}
                {finished.length > 0 && <optgroup label="Zakończone">{finished.map((m) => <option key={m.id} value={m.id}>{matchLabel(m)}</option>)}</optgroup>}
              </select>
            </label>
            {candidate != null && candidate !== featured?.id && (
              <Button type="button" className="min-h-11" disabled={feature.isPending} onClick={() => { putOnScreen(candidate); setCandidate(null); }}>
                <Star className="mr-1 h-4 w-4" aria-hidden />Pokaż na ekranie
              </Button>
            )}
            {nextMatch && (candidate == null || candidate === featured?.id) && (
              <Button type="button" variant="outline" className="min-h-11" disabled={feature.isPending} onClick={() => putOnScreen(nextMatch.id)} title={matchLabel(nextMatch)}>
                <SkipForward className="mr-1 h-4 w-4" aria-hidden />Następny mecz
              </Button>
            )}
            {featured && (candidate == null || candidate === featured.id) && (
              <Button type="button" variant="ghost" className="min-h-11" disabled={feature.isPending} onClick={() => putOnScreen(null)}>Usuń z ekranu</Button>
            )}
          </div>
        )}
        {feature.isError && <p role="alert" className="mt-2 text-sm text-destructive">Nie udało się zmienić meczu „Na ekranie”. Spróbuj ponownie.</p>}
        <p className="mt-2 text-xs text-muted-foreground">To samo co gwiazdka w panelu prowadzącego. Nakładka przełączy się sama — adresu w OBS nie zmieniasz.</p>
      </section>

      <fieldset className="space-y-2">
        {step(1, "Nakładka")}
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Rodzaj nakładki">
          {OVERLAY_KINDS.map((option) => (
            <label key={option.id} className="experimental-broadcast-choice flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3" data-selected={config.kind === option.id || undefined}>
              <input type="radio" name="overlay-kind" className="mt-1" checked={config.kind === option.id} onChange={() => set("kind", option.id)} />
              <span className="min-w-0">
                <span className="flex items-center gap-1 font-medium">{option.label}{config.kind === option.id && <Check className="h-4 w-4 text-primary" aria-label="wybrana" />}</span>
                <span className="block text-xs text-muted-foreground">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        {step(2, "Wygląd")}
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Zestaw wyglądu nakładki">
          {OVERLAY_PRESETS.map((option) => (
            <label key={option.id} className="experimental-broadcast-preset flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4" data-preset={option.id} data-selected={config.preset === option.id || undefined}>
              <input type="radio" name="overlay-preset" checked={config.preset === option.id} onChange={() => set("preset", option.id)} />
              <span className="font-medium">{option.label}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{preset.label}: {preset.description}</p>
      </fieldset>

      <fieldset className="space-y-3">
        {step(3, showsMatch ? "Mecz" : "Etap")}
        {showsMatch ? (
          <div className="space-y-2">
            <label className="flex min-h-11 items-start gap-3">
              <input type="radio" name="overlay-match" className="mt-1" checked={config.match === "ekran"} onChange={() => set("match", "ekran")} />
              <span><span className="block font-medium">Mecz „Na ekranie” (zalecane)</span>
                <span className="block text-sm text-muted-foreground">Zmieniasz go wyżej albo gwiazdką w panelu prowadzącego.</span></span>
            </label>
            <label className="flex min-h-11 items-start gap-3">
              <input type="radio" name="overlay-match" className="mt-1" checked={config.match !== "ekran"} onChange={() => set("match", featured?.id ?? selectable[0]?.id ?? "ekran")} disabled={!selectable.length} />
              <span className="block font-medium">Zawsze ten sam mecz</span>
            </label>
            {config.match !== "ekran" && (
              <label className="ml-7 flex max-w-xl flex-col gap-1 text-sm">
                <span>Mecz</span>
                <select className="min-h-11 rounded-md border bg-background px-3" value={config.match} onChange={(event) => set("match", Number(event.target.value))}>
                  {selectable.map((m) => <option key={m.id} value={m.id}>{matchLabel(m)}</option>)}
                </select>
              </label>
            )}
            {noMatchOnScreen && <p role="status" className="text-sm text-amber-500">Żaden mecz nie jest „Na ekranie” — nakładka pokaże komunikat zamiast wyniku.</p>}
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span>Etap</span>
              <select className="min-h-11 rounded-md border bg-background px-3" value={config.stage ?? ""} onChange={(event) => setConfig((current) => ({ ...current, stage: event.target.value ? Number(event.target.value) : null, round: null, group: null }))}>
                <option value="">Bieżący etap{structureStage ? ` (${structureStage.name})` : ""}</option>
                {ordered.map((stage) => <option key={stage.id} value={stage.id}>{stage.position}. {stage.name}</option>)}
              </select>
            </label>
            {stageRounds.length > 1 && (
              <label className="flex flex-col gap-1 text-sm">
                <span>Zakres</span>
                <select className="min-h-11 rounded-md border bg-background px-3" value={config.round ?? ""} onChange={(event) => set("round", event.target.value ? Number(event.target.value) : null)}>
                  <option value="">{stageRounds.length > 4 ? "Bieżąca część drabinki" : "Cała drabinka"}</option>
                  {stageRounds.map((round) => <option key={round} value={round}>{eliminationRoundName(round, stageRounds.at(-1)!)}</option>)}
                </select>
              </label>
            )}
            {groupLabels.length > 1 && (
              <label className="flex flex-col gap-1 text-sm">
                <span>Zakres</span>
                <select className="min-h-11 rounded-md border bg-background px-3" value={config.group ?? ""} onChange={(event) => set("group", event.target.value || null)}>
                  <option value="">Wszystkie grupy</option>
                  {groupLabels.map((label) => <option key={label} value={label}>{label}</option>)}
                </select>
              </label>
            )}
            {structureStage?.status === "planned" && <p role="status" className="w-full text-sm text-amber-500">Ten etap jeszcze się nie zaczął — nakładka pokaże to wprost.</p>}
            {stageRounds.length > 4 && config.round == null && <p className="w-full text-xs text-muted-foreground">Duża drabinka: nakładka pokazuje bieżącą rundę i dwie następne; jedną rundę wybierzesz w „Zakres”.</p>}
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        {step(4, "Podgląd")}
        <div className="flex flex-wrap items-end gap-2">
          <Choice label="Tło podglądu" value={scene} options={[["szachownica", "Przezroczystość"], ["jasna", "Jasna gra"], ["ciemna", "Ciemna gra"]]} onChange={(v) => setScene(v as PreviewScene)} />
          <Choice label="Rozdzielczość w OBS" value={resolution} options={OVERLAY_RESOLUTIONS.map((r) => [r.id, r.label])} onChange={(v) => setResolution(v as Resolution)} />
        </div>
        <OverlayPreview src={url} width={res.width} height={res.height} scene={scene} />
        <p className="text-xs text-muted-foreground">To ta sama strona co w OBS, na danych turnieju. Sprawdź czytelność na jasnej i ciemnej grze.</p>
      </fieldset>

      <fieldset className="space-y-2">
        {step(5, "Adres do OBS")}
        <div className="flex flex-wrap gap-2">
          <label htmlFor="overlay-url" className="sr-only">Adres nakładki</label>
          <input id="overlay-url" ref={urlRef} readOnly value={url} className="min-h-11 min-w-0 flex-1 rounded-md border bg-background px-3 font-mono text-xs" onFocus={(event) => event.currentTarget.select()} />
          <Button type="button" className="min-h-11" onClick={() => void copy()}>{copied === "ok" ? <Check className="mr-1 h-4 w-4" aria-hidden /> : <Copy className="mr-1 h-4 w-4" aria-hidden />}{copied === "ok" ? "Skopiowano" : "Kopiuj adres"}</Button>
          <Button type="button" variant="outline" className="min-h-11" asChild><a href={url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-4 w-4" aria-hidden />Otwórz</a></Button>
        </div>
        <div role="status" aria-live="polite">
          {copied === "ok" && (
            <p className="experimental-broadcast-copied flex items-start gap-2 rounded-md border border-emerald-500/50 bg-emerald-500/10 p-2 text-sm" data-testid="broadcast-copied">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />Adres jest w schowku. Teraz wklej go w OBS (krok 6).
            </p>
          )}
          {copied === "manual" && <p className="text-sm text-amber-500">Schowek jest niedostępny — adres jest zaznaczony, skopiuj go skrótem Ctrl+C.</p>}
        </div>
        {local && (
          <p className="text-xs text-muted-foreground" data-testid="broadcast-local-note">
            Adres z „127.0.0.1” / „localhost” działa tylko na tym komputerze — OBS musi działać tutaj. Dla OBS na innym komputerze
            aplikacja musi być dostępna pod adresem w sieci.
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        {step(6, "Dodaj do OBS")}
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          <li>OBS → okno <strong>Źródła</strong> → <strong>+</strong> → <strong>Przeglądarka</strong>.</li>
          <li>W polu <strong>URL</strong> wklej adres; <strong>szerokość {res.width}</strong>, <strong>wysokość {res.height}</strong>.</li>
          <li>Zatwierdź <strong>OK</strong>. Wynik zapisany w panelu prowadzącego pojawi się po kilku sekundach.</li>
        </ol>
        <details className="rounded-lg border p-3">
          <summary className="min-h-11 cursor-pointer content-center text-sm font-medium">Więcej o OBS</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>Pole „Własny CSS” zostaw takie, jakie wstawia OBS — ono już ustawia przezroczyste tło.</li>
            <li>„Wyłącz źródło, gdy nie jest widoczne” możesz zostawić wyłączone; po powrocie do sceny nakładka i tak odświeży się od razu.</li>
            <li>Jeśli coś wygląda nieaktualnie: prawym na źródle → „Odśwież” (Refresh). Przy braku połączenia nakładka zostawia ostatni zapisany stan i po ok. 15 s pokazuje mały znacznik.</li>
            <li>Nakładka nie ma przycisków, nie loguje się i nie zmienia wyników. Działa dla turniejów publicznych.</li>
          </ul>
        </details>
      </fieldset>

      <details className="rounded-lg border p-3" data-testid="broadcast-advanced">
        <summary className="min-h-11 cursor-pointer content-center font-medium">Ustawienia zaawansowane{!looksDefault && <span className="ml-2 text-xs font-normal text-muted-foreground">(zmienione)</span>}</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Choice label="Wariant" value={config.layout} options={[["pelny", "Rozbudowany"], ["kompakt", "Kompaktowy"]]} onChange={(v) => set("layout", v as OverlayConfig["layout"])} />
          <Choice label="Rozmiar wyniku" value={config.scoreSize} options={[["s", "Mały"], ["m", "Średni"], ["l", "Duży"]]} onChange={(v) => set("scoreSize", v as OverlayConfig["scoreSize"])} />
          <Choice label="Tekst" value={String(config.textScale)} options={[["1", "100%"], ["1.25", "125%"], ["1.5", "150%"]]} onChange={(v) => set("textScale", Number(v) as OverlayConfig["textScale"])} />
          <Choice label="Animacje" value={String(config.motion)} options={[["0", "Bez ruchu"], ["1", "Łagodne"], ["2", "Wyraźniejsze"]]} onChange={(v) => set("motion", Number(v) as OverlayConfig["motion"])} />
          <Choice label="Tło" value={config.background} options={[["przezroczyste", "Przezroczyste (na obraz gry)"], ["pelne", "Pełne (osobna scena)"]]} onChange={(v) => set("background", v as OverlayConfig["background"])} />
          <Choice label="Położenie paska" value={config.position} options={[["dol", "Na dole"], ["gora", "Na górze"]]} onChange={(v) => set("position", v as OverlayConfig["position"])} />
          <Choice label="Tytuł turnieju" value={config.showTitle ? "1" : "0"} options={[["1", "Pokaż"], ["0", "Ukryj"]]} onChange={(v) => set("showTitle", v === "1")} />
          {config.kind === "zapowiedz" && <Choice label="Kolejne mecze" value={config.showQueue ? "1" : "0"} options={[["0", "Ukryj"], ["1", "Pokaż 3 następne"]]} onChange={(v) => set("showQueue", v === "1")} />}
        </div>
        <Button type="button" variant="outline" className="mt-3 min-h-11" disabled={looksDefault} onClick={resetLook}><RotateCcw className="mr-1 h-4 w-4" aria-hidden />Przywróć domyślne</Button>
        <p className="mt-1 text-xs text-muted-foreground">Rodzaj nakładki, zestaw wyglądu i mecz zostają; wracają tylko powyższe ustawienia. Wybrana nakładka: {kind.label}.</p>
      </details>
    </section>
  );
}

function Choice({ label, value, options, onChange }: { label: string; value: string; options: ReadonlyArray<readonly [string, string]>; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span>{label}</span>
      <select className="min-h-11 rounded-md border bg-background px-3" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}
      </select>
    </label>
  );
}

/** The real overlay page in a frame, scaled down from the OBS resolution, over a checkerboard or a bright / dark game scene. */
function OverlayPreview({ src, width, height, scene }: { src: string; width: number; height: number; scene: PreviewScene }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  useEffect(() => {
    const node = box.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / width));
    observer.observe(node);
    return () => observer.disconnect();
  }, [width]);
  return (
    <div ref={box} className="experimental-broadcast-preview relative w-full max-w-4xl overflow-hidden rounded-lg border" data-scene={scene} style={{ aspectRatio: `${width} / ${height}` }}>
      {/* Nothing to operate inside the overlay, so the preview is not a keyboard stop (V5.9 a11y check). */}
      <iframe title="Podgląd nakładki" tabIndex={-1} src={src} width={width} height={height} className="absolute left-0 top-0 origin-top-left border-0" style={{ transform: `scale(${scale})` }} />
    </div>
  );
}
