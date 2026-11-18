import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetTournamentQueryKey, useGetStageLiveStandings, getGetStageLiveStandingsQueryKey, useUpdateTournament,
  type Match, type TournamentStage,
} from "@workspace/api-client-react";
import { ArrowLeft, Check, Copy, ExternalLink, Info, MonitorPlay, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  OVERLAY_DEFAULTS, OVERLAY_KINDS, OVERLAY_PRESETS, OVERLAY_RESOLUTIONS, eliminationRoundName, overlayUrl,
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

const STATUS: Record<string, string> = { in_progress: "na żywo", completed: "zakończony", pending: "przed meczem", postponed: "przełożony", cancelled: "odwołany" };

/**
 * V5.9 · "Transmisja": an optional place to pick an overlay, see it on real data and copy its address for OBS.
 * Nothing here is needed to run a tournament. The only change it can make is the existing "Na ekranie" choice.
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
  const [config, setConfig] = useState<OverlayConfig>({ ...OVERLAY_DEFAULTS, tournamentId: tournament.id });
  const [resolution, setResolution] = useState<(typeof OVERLAY_RESOLUTIONS)[number]["id"]>("1080p");
  const [copied, setCopied] = useState<"ok" | "manual" | null>(null);
  const [candidate, setCandidate] = useState<number | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof OverlayConfig>(key: K, value: OverlayConfig[K]) => { setCopied(null); setConfig((current) => ({ ...current, [key]: value })); };

  const featured = matches.find((m) => m.id === tournament.featuredMatchId) ?? null;
  const stageById = new Map(ordered.map((stage) => [stage.id, stage]));
  const matchLabel = (m: Match) => {
    const stage = stageById.get(m.stageId);
    return `${stage ? `${stage.name} · ` : ""}R${m.round} M${m.matchNumber}: ${m.player1Name ?? "?"} – ${m.player2Name ?? "?"} (${STATUS[m.status] ?? m.status})`;
  };
  const selectableMatches = matches.filter((m) => m.player1Name || m.player2Name)
    .slice().sort((a, b) => (stageById.get(a.stageId)?.position ?? 0) - (stageById.get(b.stageId)?.position ?? 0) || a.round - b.round || a.matchNumber - b.matchNumber);

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
  const url = overlayUrl(origin, import.meta.env?.BASE_URL ?? "/", config);
  const res = OVERLAY_RESOLUTIONS.find((r) => r.id === resolution)!;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied("ok");
    } catch {
      urlRef.current?.select();
      setCopied("manual");
    }
  };

  const showsMatch = config.kind !== "struktura";
  const noMatchOnScreen = showsMatch && config.match === "ekran" && !featured;

  return (
    <section aria-labelledby="broadcast-heading" className="experimental-broadcast space-y-6" data-testid="broadcast-panel">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="broadcast-heading" className="flex items-center gap-2 text-xl font-semibold"><MonitorPlay className="h-5 w-5" aria-hidden /> Transmisja</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Nakładki na obraz transmisji w OBS (źródło „Przeglądarka”). To dodatek — turniej działa bez nich. Nakładka
            pokazuje tylko zapisane wyniki i tylko dane publiczne; niczego nie zmienia.
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

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">1. Co pokazać</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {OVERLAY_KINDS.map((kind) => (
            <label key={kind.id} className={`experimental-broadcast-choice flex min-h-11 cursor-pointer gap-3 rounded-lg border p-3 ${config.kind === kind.id ? "border-primary bg-primary/10" : ""}`}>
              <input type="radio" name="overlay-kind" className="mt-1" checked={config.kind === kind.id} onChange={() => set("kind", kind.id)} />
              <span><span className="block font-medium">{kind.label}</span><span className="block text-xs text-muted-foreground">{kind.description}</span></span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">2. {showsMatch ? "Który mecz" : "Który etap"}</legend>
        {showsMatch ? (
          <div className="space-y-3">
            <label className="flex min-h-11 items-start gap-3">
              <input type="radio" name="overlay-match" className="mt-1" checked={config.match === "ekran"} onChange={() => set("match", "ekran")} />
              <span>
                <span className="block font-medium">Mecz „Na ekranie”</span>
                <span className="block text-sm text-muted-foreground">
                  Nakładka sama przełączy się, gdy wskażesz inny mecz — adres w OBS się nie zmienia.{" "}
                  {featured ? <>Teraz: <strong>{matchLabel(featured)}</strong>.</> : "Teraz żaden mecz nie jest „Na ekranie”."}
                </span>
              </span>
            </label>
            <label className="flex min-h-11 items-start gap-3">
              <input type="radio" name="overlay-match" className="mt-1" checked={config.match !== "ekran"} onChange={() => set("match", selectableMatches[0]?.id ?? "ekran")} disabled={!selectableMatches.length} />
              <span className="block font-medium">Zawsze ten sam mecz</span>
            </label>
            <div className="flex flex-wrap items-end gap-2 pl-7">
              <label className="flex min-w-[16rem] flex-1 flex-col gap-1 text-sm">
                <span>Mecz</span>
                <select className="min-h-11 rounded-md border bg-background px-3" disabled={!selectableMatches.length}
                  value={config.match === "ekran" ? candidate ?? featured?.id ?? "" : config.match}
                  onChange={(event) => { const id = Number(event.target.value); if (config.match !== "ekran") set("match", id); else setCandidate(id || null); }}>
                  {config.match === "ekran" && !featured && <option value="">Wybierz mecz…</option>}
                  {selectableMatches.map((m) => <option key={m.id} value={m.id}>{matchLabel(m)}</option>)}
                </select>
              </label>
              {config.match === "ekran" && canFeature && candidate != null && candidate !== featured?.id && (
                <Button type="button" className="min-h-11" disabled={feature.isPending} onClick={() => { putOnScreen(candidate); setCandidate(null); }}>
                  <Star className="mr-1 h-4 w-4" aria-hidden />Pokaż na ekranie
                </Button>
              )}
              {config.match === "ekran" && canFeature && featured && (candidate == null || candidate === featured.id) && (
                <Button type="button" variant="ghost" className="min-h-11" disabled={feature.isPending} onClick={() => putOnScreen(null)}>Usuń z ekranu</Button>
              )}
            </div>
            {config.match === "ekran" && canFeature && (
              <p className="pl-7 text-xs text-muted-foreground"><Star className="mr-1 inline h-3 w-3" aria-hidden />„Pokaż na ekranie” działa tak samo jak gwiazdka w panelu prowadzącego; widzowie też zobaczą ten mecz jako bieżący.</p>
            )}
            {feature.isError && <p role="alert" className="pl-7 text-sm text-destructive">Nie udało się zmienić meczu „Na ekranie”. Spróbuj ponownie.</p>}
            {noMatchOnScreen && <p role="status" className="pl-7 text-sm text-amber-500">Bez meczu „Na ekranie” nakładka pokaże komunikat zamiast wyniku.</p>}
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span>Etap</span>
              <select className="min-h-11 rounded-md border bg-background px-3" value={config.stage ?? ""} onChange={(event) => { set("stage", event.target.value ? Number(event.target.value) : null); set("round", null); set("group", null); }}>
                <option value="">Bieżący etap{structureStage ? ` (${structureStage.name})` : ""}</option>
                {ordered.map((stage) => <option key={stage.id} value={stage.id}>{stage.position}. {stage.name}</option>)}
              </select>
            </label>
            {stageRounds.length > 1 && (
              <label className="flex flex-col gap-1 text-sm">
                <span>Zakres</span>
                <select className="min-h-11 rounded-md border bg-background px-3" value={config.round ?? ""} onChange={(event) => set("round", event.target.value ? Number(event.target.value) : null)}>
                  <option value="">Cała drabinka</option>
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
            {structureStage?.status === "planned" && <p role="status" className="text-sm text-amber-500">Ten etap jeszcze się nie zaczął — nakładka pokaże to wprost.</p>}
            {stageRounds.length > 3 && config.round == null && <p className="w-full text-xs text-muted-foreground">Duża drabinka: na mniejszej nakładce czytelniejsza będzie jedna runda (Zakres).</p>}
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">3. Wygląd</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5" role="radiogroup" aria-label="Zestaw wyglądu nakładki">
          {OVERLAY_PRESETS.map((preset) => (
            <label key={preset.id} className={`experimental-broadcast-preset flex min-h-11 cursor-pointer flex-col gap-1 rounded-lg border p-3 ${config.preset === preset.id ? "border-primary bg-primary/10" : ""}`} data-preset={preset.id}>
              <span className="flex items-center gap-2 font-medium"><input type="radio" name="overlay-preset" checked={config.preset === preset.id} onChange={() => set("preset", preset.id)} />{preset.label}</span>
              <span className="text-xs text-muted-foreground">{preset.description}</span>
            </label>
          ))}
        </div>
        <details className="rounded-lg border p-3">
          <summary className="min-h-11 cursor-pointer content-center font-medium">Szczegóły wyglądu</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Choice label="Wariant" value={config.layout} options={[["pelny", "Rozbudowany"], ["kompakt", "Kompaktowy"]]} onChange={(v) => set("layout", v as OverlayConfig["layout"])} />
            <Choice label="Rozmiar wyniku" value={config.scoreSize} options={[["s", "Mały"], ["m", "Średni"], ["l", "Duży"]]} onChange={(v) => set("scoreSize", v as OverlayConfig["scoreSize"])} />
            <Choice label="Tekst" value={String(config.textScale)} options={[["1", "100%"], ["1.25", "125%"], ["1.5", "150%"]]} onChange={(v) => set("textScale", Number(v) as OverlayConfig["textScale"])} />
            <Choice label="Animacje" value={String(config.motion)} options={[["0", "Brak"], ["1", "Łagodne"], ["2", "Wyraźne"]]} onChange={(v) => set("motion", Number(v) as OverlayConfig["motion"])} />
            <Choice label="Tło" value={config.background} options={[["przezroczyste", "Przezroczyste (na obraz gry)"], ["pelne", "Pełne (osobna scena)"]]} onChange={(v) => set("background", v as OverlayConfig["background"])} />
            <Choice label="Położenie paska" value={config.position} options={[["dol", "Na dole"], ["gora", "Na górze"]]} onChange={(v) => set("position", v as OverlayConfig["position"])} />
            <Choice label="Tytuł turnieju" value={config.showTitle ? "1" : "0"} options={[["1", "Pokaż"], ["0", "Ukryj"]]} onChange={(v) => set("showTitle", v === "1")} />
            {config.kind === "zapowiedz" && <Choice label="Kolejne mecze" value={config.showQueue ? "1" : "0"} options={[["0", "Ukryj"], ["1", "Pokaż 3 następne"]]} onChange={(v) => set("showQueue", v === "1")} />}
          </div>
        </details>
      </fieldset>

      <div className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-sm font-semibold">Podgląd na danych turnieju</h3>
          <Choice label="Rozdzielczość w OBS" value={resolution} options={OVERLAY_RESOLUTIONS.map((r) => [r.id, r.label])} onChange={(v) => setResolution(v as typeof resolution)} />
        </div>
        <OverlayPreview src={url} width={res.width} height={res.height} />
        <p className="text-xs text-muted-foreground">Podgląd to ta sama strona co w OBS: odświeża się sama i pokazuje tylko zapisane wyniki. Szachownica oznacza przezroczyste tło.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="overlay-url" className="text-sm font-semibold">Adres nakładki</label>
        <div className="flex flex-wrap gap-2">
          <input id="overlay-url" ref={urlRef} readOnly value={url} className="min-h-11 min-w-0 flex-1 rounded-md border bg-background px-3 font-mono text-xs" onFocus={(event) => event.currentTarget.select()} />
          <Button type="button" className="min-h-11" onClick={() => void copy()}>{copied === "ok" ? <Check className="mr-1 h-4 w-4" aria-hidden /> : <Copy className="mr-1 h-4 w-4" aria-hidden />}{copied === "ok" ? "Skopiowano" : "Kopiuj adres"}</Button>
          <Button type="button" variant="outline" className="min-h-11" asChild><a href={url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-4 w-4" aria-hidden />Otwórz</a></Button>
        </div>
        <p role="status" className="text-xs text-muted-foreground">{copied === "manual" ? "Adres jest zaznaczony — skopiuj go skrótem Ctrl+C." : copied === "ok" ? "Adres jest w schowku. Wklej go w OBS." : ""}</p>
      </div>

      <details className="rounded-lg border p-3" open>
        <summary className="min-h-11 cursor-pointer content-center font-medium">Jak dodać nakładkę w OBS</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
          <li>W OBS, w oknie „Źródła”, kliknij <strong>+</strong> i wybierz <strong>Przeglądarka</strong> (Browser).</li>
          <li>Wklej skopiowany adres w polu <strong>URL</strong>.</li>
          <li>Ustaw <strong>szerokość {res.width}</strong> i <strong>wysokość {res.height}</strong> — tak jak rozdzielczość sceny.</li>
          <li>Zostaw puste pole „Własny CSS”; tło nakładki jest przezroczyste, gdy wybierzesz takie tło.</li>
          <li>Mecz zmieniasz gwiazdką „Na ekranie” w panelu prowadzącego albo tutaj — bez zmiany adresu w OBS.</li>
          <li>Sprawdź odświeżanie: zapisz wynik w panelu prowadzącego; nakładka pokaże go po kilku sekundach (sprawdza dane co 5 s).</li>
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">Nakładka jest stroną tylko do odczytu: nie ma przycisków, nie loguje się i nie zmienia wyników. Działa dla turniejów publicznych.</p>
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

/** The real overlay page in a frame, scaled down from the OBS resolution; a checkerboard shows the transparency. */
function OverlayPreview({ src, width, height }: { src: string; width: number; height: number }) {
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
    <div ref={box} className="experimental-broadcast-preview relative w-full max-w-4xl overflow-hidden rounded-lg border" style={{ aspectRatio: `${width} / ${height}` }}>
      <iframe title="Podgląd nakładki" src={src} width={width} height={height} className="absolute left-0 top-0 origin-top-left border-0" style={{ transform: `scale(${scale})` }} />
    </div>
  );
}
