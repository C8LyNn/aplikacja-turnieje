import { t } from "@/i18n";
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
import { CopyLinkButton } from "@/components/copy-link-button";
import { streamElementsOverlayWidget } from "@/lib/stream-elements-overlay";

/**
 * #324-L04 · the overlay gallery: each card is one ready presentation (overlay kind + which match). The live preview
 * below shows the real page; finer choices stay in the steps and in "Ustawienia zaawansowane".
 */
type GalleryId = "wynik" | "teraz" | "nastepny" | "ostatni" | "zwyciezca" | "struktura";
const GALLERY: { id: GalleryId; label: string; description: string; apply: Pick<OverlayConfig, "kind"> & Partial<Pick<OverlayConfig, "match">> }[] = [
  { id: "wynik", get label() { return t("experimentalBroadcastPanel.wynik_meczu"); }, get description() { return t("experimentalBroadcastPanel.pasek_z_wynikiem_meczu_na"); }, apply: { kind: "wynik", match: "ekran" /* i18n-ignore */ } },
  { id: "teraz", get label() { return t("experimentalBroadcastPanel.teraz_graja"); }, get description() { return t("experimentalBroadcastPanel.sam_wybiera_mecz_na_ekranie"); }, apply: { kind: "wynik", match: "auto" } },
  { id: "nastepny", get label() { return t("experimentalBroadcastPanel.nastepny_mecz"); }, get description() { return t("experimentalBroadcastPanel.plansza_z_najblizszym_gotowym_meczem"); }, apply: { kind: "zapowiedz", match: "nastepny" } },
  { id: "ostatni" /* i18n-ignore */, get label() { return t("experimentalBroadcastPanel.ostatni_wynik"); }, get description() { return t("experimentalBroadcastPanel.ostatni_zapisany_wynik"); }, apply: { kind: "wynik", match: "ostatni" } },
  { id: "zwyciezca", get label() { return t("experimentalBroadcastPanel.zwyciezca"); }, get description() { return t("experimentalBroadcastPanel.zwyciezca_turnieju_a_wczesniej_ostatnieg"); }, apply: { kind: "zwyciezca" } },
  { id: "struktura", get label() { return t("experimentalBroadcastPanel.tabela_drabinka"); }, get description() { return t("experimentalBroadcastPanel.tabela_grupy_albo_mini_drabinka"); }, apply: { kind: "struktura" } },
];
function galleryOf(config: OverlayConfig): GalleryId {
  if (config.kind === "zwyciezca" || config.kind === "struktura") return config.kind;
  if (config.kind === "zapowiedz") return "nastepny";
  return config.match === "auto" ? "teraz" /* i18n-ignore */ : config.match === "ostatni" ? "ostatni" : "wynik";
}
/** A small drawing of each presentation (no data, no requests) next to the live preview. */
function GalleryThumb({ id }: { id: GalleryId }) {
  const bar = <><rect x="8" y="40" width="64" height="12" rx="2" className="fill-current opacity-60" /><rect x="34" y="38" width="12" height="16" rx="2" className="fill-current" /></>;
  return (
    <svg viewBox="0 0 80 60" className="h-12 w-16 shrink-0 rounded border bg-muted/40 text-primary" aria-hidden="true">
      {id === "wynik" && bar}
      {id === "teraz" && <>{bar}<circle cx="14" cy="14" r="4" className="fill-current" /></>}
      {id === "ostatni" && <>{bar}<path d="M10 14h14M10 20h9" className="stroke-current" strokeWidth="3" /></>}
      {id === "nastepny" && <><rect x="12" y="14" width="56" height="32" rx="3" className="fill-current opacity-40" /><path d="M28 30h24" className="stroke-current" strokeWidth="4" /></>}
      {id === "zwyciezca" && <><path d="M30 16h20v8a10 10 0 0 1-20 0z" className="fill-current" /><rect x="36" y="34" width="8" height="8" className="fill-current" /><rect x="28" y="42" width="24" height="5" className="fill-current opacity-60" /></>}
      {id === "struktura" && <><path d="M10 14h14v10H10zM10 36h14v10H10zM40 25h14v10H40z" className="fill-current opacity-60" /><path d="M24 19h8v22h-8M32 30h8" className="stroke-current" fill="none" strokeWidth="2" /></>}
    </svg>
  );
}

interface BroadcastTournament {
  id: number;
  name: string;
  visibility?: string | null;
  featuredMatchId?: number | null;
  activeStageId?: number | null;
}

type Resolution = (typeof OVERLAY_RESOLUTIONS)[number]["id"];
type PreviewScene = "szachownica" | "jasna" | "ciemna";
const STATUS: Record<string, string> = { get in_progress() { return t("experimentalBroadcastPanel.na_zywo_2"); }, get completed() { return t("experimentalBroadcastPanel.zakonczony"); }, get pending() { return t("experimentalBroadcastPanel.przed_meczem_2"); }, get postponed() { return t("experimentalBroadcastPanel.przelozony"); }, get cancelled() { return t("experimentalBroadcastPanel.odwolany"); } };
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
  experimental = true,
}: {
  tournament: BroadcastTournament;
  matches: readonly Match[];
  stages: readonly TournamentStage[];
  /** The organizer (or support) may change which match is "Na ekranie". */
  canFeature: boolean;
  /** #324-L04: the same panel in Classic; links stay in the view the organizer uses. */
  experimental?: boolean;
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
    && config.background === OVERLAY_DEFAULTS.background && config.position === OVERLAY_DEFAULTS.position
    && config.showTitle === OVERLAY_DEFAULTS.showTitle && config.showQueue === OVERLAY_DEFAULTS.showQueue;
  const resetLook = () => setConfig((current) => ({ ...current, layout: OVERLAY_DEFAULTS.layout, scoreSize: OVERLAY_DEFAULTS.scoreSize, textScale: OVERLAY_DEFAULTS.textScale,
    background: OVERLAY_DEFAULTS.background, position: OVERLAY_DEFAULTS.position, showTitle: OVERLAY_DEFAULTS.showTitle, showQueue: OVERLAY_DEFAULTS.showQueue }));
  const gallery = galleryOf(config);
  const widget = streamElementsOverlayWidget(url, { width: res.width, height: res.height });

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

  const showsMatch = config.kind !== "struktura" && config.kind !== "zwyciezca";
  const noMatchOnScreen = showsMatch && config.match === "ekran" && !featured;
  const step = (n: number, title: string) => <legend className="experimental-broadcast-step text-sm font-semibold"><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs" aria-hidden>{n}</span>{title}</legend>;

  return (
    <section aria-labelledby="broadcast-heading" className="experimental-broadcast space-y-6" data-testid="broadcast-panel">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="broadcast-heading" className="flex items-center gap-2 text-xl font-semibold"><MonitorPlay className="h-5 w-5" aria-hidden />{" "}{t("experimentalBroadcastPanel.transmisja")}</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t("experimentalBroadcastPanel.nakladka_na_obraz_w_obs")}</p>
        </div>
        <Button variant="outline" asChild className="min-h-11">
          <Link href={tournamentHref(tournament.id, experimental, "/host")}><ArrowLeft className="mr-1 h-4 w-4" aria-hidden />{" "}{t("experimentalBroadcastPanel.wroc_do_prowadzenia")}</Link>
        </Button>
      </header>

      {!isPublic && (
        <div role="status" className="experimental-broadcast-notice flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{t("experimentalBroadcastPanel.ten_turniej_nie_jest_publiczny")}{" "}
            <Link className="underline" href={tournamentHref(tournament.id, experimental, "?tab=sharing")}>{t("experimentalBroadcastPanel.udostepnianiu")}</Link>.
          </span>
        </div>
      )}

      <section aria-label={t("experimentalBroadcastPanel.mecz_na_ekranie")} className="experimental-broadcast-onscreen rounded-lg border p-3" data-testid="broadcast-on-screen">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <Star className="h-4 w-4 text-amber-400" aria-hidden />
          <span className="font-semibold">{t("experimentalBroadcastPanel.na_ekranie")}</span>
          {featured ? <strong data-testid="broadcast-featured">{matchLabel(featured)}</strong> : <span className="text-muted-foreground">{t("experimentalBroadcastPanel.zaden_mecz")}</span>}
        </p>
        {canFeature && (
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <label className="flex min-w-[16rem] flex-1 flex-col gap-1 text-sm">
              <span>{t("experimentalBroadcastPanel.zmien_mecz_na_ekranie")}</span>
              <select className="min-h-11 rounded-md border bg-background px-3" disabled={!selectable.length}
                value={candidate ?? featured?.id ?? ""} onChange={(event) => setCandidate(Number(event.target.value) || null)}>
                {!featured && <option value="">{t("experimentalBroadcastPanel.wybierz_mecz")}</option>}
                {live.length > 0 && <optgroup label={t("experimentalBroadcastPanel.na_zywo")}>{live.map((m) => <option key={m.id} value={m.id}>{matchLabel(m)}</option>)}</optgroup>}
                {upcoming.length > 0 && <optgroup label={t("experimentalBroadcastPanel.przed_meczem")}>{upcoming.map((m) => <option key={m.id} value={m.id}>{matchLabel(m)}</option>)}</optgroup>}
                {finished.length > 0 && <optgroup label={t("experimentalBroadcastPanel.zakonczone")}>{finished.map((m) => <option key={m.id} value={m.id}>{matchLabel(m)}</option>)}</optgroup>}
              </select>
            </label>
            {candidate != null && candidate !== featured?.id && (
              <Button type="button" className="min-h-11" disabled={feature.isPending} onClick={() => { putOnScreen(candidate); setCandidate(null); }}>
                <Star className="mr-1 h-4 w-4" aria-hidden />{t("experimentalBroadcastPanel.pokaz_na_ekranie")}</Button>
            )}
            {nextMatch && (candidate == null || candidate === featured?.id) && (
              <Button type="button" variant="outline" className="min-h-11" disabled={feature.isPending} onClick={() => putOnScreen(nextMatch.id)} title={matchLabel(nextMatch)}>
                <SkipForward className="mr-1 h-4 w-4" aria-hidden />{t("experimentalBroadcastPanel.nastepny_mecz")}</Button>
            )}
            {featured && (candidate == null || candidate === featured.id) && (
              <Button type="button" variant="ghost" className="min-h-11" disabled={feature.isPending} onClick={() => putOnScreen(null)}>{t("experimentalBroadcastPanel.usun_z_ekranu")}</Button>
            )}
          </div>
        )}
        {feature.isError && <p role="alert" className="mt-2 text-sm text-destructive">{t("experimentalBroadcastPanel.nie_udalo_sie_zmienic_meczu")}</p>}
        <p className="mt-2 text-xs text-muted-foreground">{t("experimentalBroadcastPanel.to_samo_co_gwiazdka_w")}</p>
      </section>

      <fieldset className="space-y-2">
        {step(1, t("experimentalBroadcastPanel.nakladka"))}
        {/* #324-L04: a gallery of ready presentations; the live preview (step 4) shows the chosen one on real data */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label={t("experimentalBroadcastPanel.rodzaj_nakladki")} data-testid="broadcast-gallery">
          {GALLERY.map((option) => (
            <label key={option.id} className="experimental-broadcast-choice flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3" data-selected={gallery === option.id || undefined} data-gallery={option.id}>
              <input type="radio" name="overlay-kind" className="mt-1" checked={gallery === option.id}
                onChange={() => { setCopied(null); setConfig((current) => ({ ...current, ...option.apply })); }} />
              <GalleryThumb id={option.id} />
              <span className="min-w-0">
                <span className="flex items-center gap-1 font-medium">{option.label}{gallery === option.id && <Check className="h-4 w-4 text-primary" aria-label={t("experimentalBroadcastPanel.wybrana")} />}</span>
                <span className="block text-xs text-muted-foreground">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        {step(2, t("experimentalBroadcastPanel.wyglad"))}
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("experimentalBroadcastPanel.zestaw_wygladu_nakladki")}>
          {OVERLAY_PRESETS.map((option) => (
            <label key={option.id} className="experimental-broadcast-preset flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4" data-preset={option.id} data-selected={config.preset === option.id || undefined}>
              <input type="radio" name="overlay-preset" checked={config.preset === option.id} onChange={() => set("preset", option.id)} />
              <span className="font-medium">{option.label}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{preset.label}: {preset.description}</p>
        <div className="flex flex-wrap items-end gap-3 pt-1" data-testid="broadcast-motion">
          <Choice label={t("experimentalBroadcastPanel.animacje")} value={String(config.motion)} options={[["0", t("experimentalBroadcastPanel.bez_ruchu")], ["1", t("experimentalBroadcastPanel.lagodne")], ["2", t("experimentalBroadcastPanel.wyrazniejsze")]]} onChange={(v) => set("motion", Number(v) as OverlayConfig["motion"])} />
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={config.alerts && config.kind !== "struktura"} disabled={config.kind === "struktura"} onChange={(event) => set("alerts", event.target.checked)} />
            <span>{t("experimentalBroadcastPanel.alerty_na_wizji")}{" "}<span className="text-muted-foreground">{t("experimentalBroadcastPanel.koniec_meczu_awans_nowy_etap")}</span></span>
          </label>
        </div>
        <p className="text-xs text-muted-foreground">{t("experimentalBroadcastPanel.alerty_sa_domyslnie_wylaczone_i")}</p>
      </fieldset>

      <fieldset className="space-y-3">
        {step(3, showsMatch ? t("experimentalBroadcastPanel.mecz") : config.kind === "zwyciezca" ? t("experimentalBroadcastPanel.zwyciezca") : t("experimentalBroadcastPanel.etap"))}
        {config.kind === "zwyciezca" ? (
          <p className="text-sm text-muted-foreground">{t("experimentalBroadcastPanel.po_zakonczeniu_turnieju_nakladka_pokaze")}</p>
        ) : showsMatch ? (
          <div className="space-y-2">
            <label className="flex min-h-11 items-start gap-3">
              <input type="radio" name="overlay-match" className="mt-1" checked={config.match === "ekran" /* i18n-ignore */} onChange={() => set("match", "ekran")} />
              <span><span className="block font-medium">{t("experimentalBroadcastPanel.mecz_na_ekranie_zalecane")}</span>
                <span className="block text-sm text-muted-foreground">{t("experimentalBroadcastPanel.zmieniasz_go_wyzej_albo_gwiazdka")}</span></span>
            </label>
            <label className="flex min-h-11 items-start gap-3">
              <input type="radio" name="overlay-match" className="mt-1" checked={config.match === "auto"} onChange={() => set("match", "auto")} />
              <span><span className="block font-medium">{t("experimentalBroadcastPanel.aktualny_mecz_automatycznie")}</span>
                <span className="block text-sm text-muted-foreground">{t("experimentalBroadcastPanel.mecz_na_ekranie_a_gdy")}</span></span>
            </label>
            <label className="flex min-h-11 items-start gap-3">
              <input type="radio" name="overlay-match" className="mt-1" checked={config.match === "nastepny"} onChange={() => set("match", "nastepny")} />
              <span><span className="block font-medium">{t("experimentalBroadcastPanel.nastepny_mecz")}</span>
                <span className="block text-sm text-muted-foreground">{t("experimentalBroadcastPanel.najblizszy_gotowy_mecz_biezacego_etapu")}</span></span>
            </label>
            <label className="flex min-h-11 items-start gap-3">
              <input type="radio" name="overlay-match" className="mt-1" checked={config.match === "ostatni" /* i18n-ignore */} onChange={() => set("match", "ostatni")} />
              <span><span className="block font-medium">{t("experimentalBroadcastPanel.ostatni_wynik")}</span>
                <span className="block text-sm text-muted-foreground">{t("experimentalBroadcastPanel.ostatni_zapisany_mecz")}</span></span>
            </label>
            <label className="flex min-h-11 items-start gap-3">
              <input type="radio" name="overlay-match" className="mt-1" checked={typeof config.match === "number"} onChange={() => set("match", featured?.id ?? selectable[0]?.id ?? "ekran" /* i18n-ignore */)} disabled={!selectable.length} />
              <span className="block font-medium">{t("experimentalBroadcastPanel.zawsze_ten_sam_mecz")}</span>
            </label>
            {typeof config.match === "number" && (
              <label className="ml-7 flex max-w-xl flex-col gap-1 text-sm">
                <span>{t("experimentalBroadcastPanel.mecz")}</span>
                <select className="min-h-11 rounded-md border bg-background px-3" value={config.match} onChange={(event) => set("match", Number(event.target.value))}>
                  {selectable.map((m) => <option key={m.id} value={m.id}>{matchLabel(m)}</option>)}
                </select>
              </label>
            )}
            {noMatchOnScreen && <p role="status" className="text-sm text-amber-500">{t("experimentalBroadcastPanel.zaden_mecz_nie_jest_na")}</p>}
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span>{t("experimentalBroadcastPanel.etap")}</span>
              <select className="min-h-11 rounded-md border bg-background px-3" value={config.stage ?? ""} onChange={(event) => setConfig((current) => ({ ...current, stage: event.target.value ? Number(event.target.value) : null, round: null, group: null }))}>
                <option value="">{t("experimentalBroadcastPanel.biezacy_etap")}{structureStage ? ` (${structureStage.name})` : ""}</option>
                {ordered.map((stage) => <option key={stage.id} value={stage.id}>{stage.position}. {stage.name}</option>)}
              </select>
            </label>
            {stageRounds.length > 1 && (
              <label className="flex flex-col gap-1 text-sm">
                <span>{t("experimentalBroadcastPanel.zakres")}</span>
                <select className="min-h-11 rounded-md border bg-background px-3" value={config.round ?? ""} onChange={(event) => set("round", event.target.value ? Number(event.target.value) : null)}>
                  <option value="">{stageRounds.length > 4 ? t("experimentalBroadcastPanel.biezaca_czesc_drabinki") : t("experimentalBroadcastPanel.cala_drabinka")}</option>
                  {stageRounds.map((round) => <option key={round} value={round}>{eliminationRoundName(round, stageRounds.at(-1)!)}</option>)}
                </select>
              </label>
            )}
            {groupLabels.length > 1 && (
              <label className="flex flex-col gap-1 text-sm">
                <span>{t("experimentalBroadcastPanel.zakres")}</span>
                <select className="min-h-11 rounded-md border bg-background px-3" value={config.group ?? ""} onChange={(event) => set("group", event.target.value || null)}>
                  <option value="">{t("experimentalBroadcastPanel.wszystkie_grupy")}</option>
                  {groupLabels.map((label) => <option key={label} value={label}>{label}</option>)}
                </select>
              </label>
            )}
            {structureStage?.status === "planned" && <p role="status" className="w-full text-sm text-amber-500">{t("experimentalBroadcastPanel.ten_etap_jeszcze_sie_nie")}</p>}
            {stageRounds.length > 4 && config.round == null && <p className="w-full text-xs text-muted-foreground">{t("experimentalBroadcastPanel.duza_drabinka_nakladka_pokazuje_biezaca")}</p>}
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        {step(4, t("experimentalBroadcastPanel.podglad"))}
        <div className="flex flex-wrap items-end gap-2">
          <Choice label={t("experimentalBroadcastPanel.tlo_podgladu")} value={scene} options={[["szachownica", t("experimentalBroadcastPanel.przezroczystosc")], ["jasna" /* i18n-ignore */, t("experimentalBroadcastPanel.jasna_gra")], ["ciemna", t("experimentalBroadcastPanel.ciemna_gra")]]} onChange={(v) => setScene(v as PreviewScene)} />
          <Choice label={t("experimentalBroadcastPanel.rozdzielczosc_w_obs")} value={resolution} options={OVERLAY_RESOLUTIONS.map((r) => [r.id, r.label])} onChange={(v) => setResolution(v as Resolution)} />
        </div>
        <OverlayPreview src={url} width={res.width} height={res.height} scene={scene} />
        <p className="text-xs text-muted-foreground">{t("experimentalBroadcastPanel.to_ta_sama_strona_co")}</p>
      </fieldset>

      <fieldset className="space-y-2">
        {step(5, t("experimentalBroadcastPanel.adres_do_obs"))}
        <div className="flex flex-wrap gap-2">
          <label htmlFor="overlay-url" className="sr-only">{t("experimentalBroadcastPanel.adres_nakladki")}</label>
          <input id="overlay-url" ref={urlRef} readOnly value={url} className="min-h-11 min-w-0 flex-1 rounded-md border bg-background px-3 font-mono text-xs" onFocus={(event) => event.currentTarget.select()} />
          <Button type="button" className="min-h-11" onClick={() => void copy()}>{copied === "ok" ? <Check className="mr-1 h-4 w-4" aria-hidden /> : <Copy className="mr-1 h-4 w-4" aria-hidden />}{copied === "ok" ? t("experimentalBroadcastPanel.skopiowano") : t("experimentalBroadcastPanel.kopiuj_adres")}</Button>
          <Button type="button" variant="outline" className="min-h-11" asChild><a href={url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-4 w-4" aria-hidden />{t("experimentalBroadcastPanel.otworz")}</a></Button>
        </div>
        <div role="status" aria-live="polite">
          {copied === "ok" && (
            <p className="experimental-broadcast-copied flex items-start gap-2 rounded-md border border-emerald-500/50 bg-emerald-500/10 p-2 text-sm" data-testid="broadcast-copied">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />{t("experimentalBroadcastPanel.adres_jest_w_schowku_teraz")}</p>
          )}
          {copied === "manual" && <p className="text-sm text-amber-500">{t("experimentalBroadcastPanel.schowek_jest_niedostepny_adres_jest")}</p>}
        </div>
        {local && (
          <p className="text-xs text-muted-foreground" data-testid="broadcast-local-note">{t("experimentalBroadcastPanel.adres_z_127_0_0")}</p>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        {step(6, t("experimentalBroadcastPanel.dodaj_do_obs"))}
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          <li>{t("experimentalBroadcastPanel.obs_okno")}{" "}<strong>{t("experimentalBroadcastPanel.zrodla")}</strong> → <strong>+</strong> → <strong>{t("experimentalBroadcastPanel.przegladarka")}</strong>.</li>
          <li>{t("experimentalBroadcastPanel.w_polu")}{" "}<strong>{t("experimentalBroadcastPanel.url")}</strong>{" "}{t("experimentalBroadcastPanel.wklej_adres")}{" "}<strong>{t("experimentalBroadcastPanel.szerokosc")}{" "}{res.width}</strong>, <strong>{t("experimentalBroadcastPanel.wysokosc")}{" "}{res.height}</strong>.</li>
          <li>{t("experimentalBroadcastPanel.zatwierdz")}{" "}<strong>{t("experimentalBroadcastPanel.ok")}</strong>{t("experimentalBroadcastPanel.wynik_zapisany_w_panelu_prowadzacego")}</li>
        </ol>
        <details className="rounded-lg border p-3">
          <summary className="min-h-11 cursor-pointer content-center text-sm font-medium">{t("experimentalBroadcastPanel.wiecej_o_obs")}</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>{t("experimentalBroadcastPanel.pole_wlasny_css_zostaw_takie")}</li>
            <li>{t("experimentalBroadcastPanel.wylacz_zrodlo_gdy_nie_jest")}</li>
            <li>{t("experimentalBroadcastPanel.jesli_cos_wyglada_nieaktualnie_prawym")}</li>
            <li>{t("experimentalBroadcastPanel.nakladka_nie_ma_przyciskow_nie")}</li>
          </ul>
        </details>
      </fieldset>

      {/* #324-L04 · StreamElements: the same page as a Custom Widget (a real SE test needs an SE account) */}
      <details className="rounded-lg border p-3" data-testid="broadcast-streamelements">
        <summary className="min-h-11 cursor-pointer content-center font-medium">{t("experimentalBroadcastPanel.streamelements_custom_widget")}</summary>
        <div className="mt-2 space-y-3 text-sm">
          <p className="text-muted-foreground">{t("experimentalBroadcastPanel.widget_pokazuje_te_sama_nakladke")}</p>
          {widget.problems.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-amber-500" data-testid="broadcast-se-problems">{widget.problems.map((problem) => <li key={problem}>{problem}</li>)}</ul>
          )}
          <ol className="list-decimal space-y-1 pl-5">
            <li>{t("experimentalBroadcastPanel.streamelements")}{" "}<strong>{t("experimentalBroadcastPanel.overlays")}</strong>{" "}{t("experimentalBroadcastPanel.nowa_nakladka")}{" "}{res.width}×{res.height} → <strong>{t("experimentalBroadcastPanel.add_widget")}</strong> → <strong>{t("experimentalBroadcastPanel.static_custom")}</strong> → <strong>{t("experimentalBroadcastPanel.custom_widget")}</strong>.</li>
            <li><strong>{t("experimentalBroadcastPanel.open_editor")}</strong>{t("experimentalBroadcastPanel.wklej_kolejno_html_css_i")}{" "}<code>{"{}"}</code>{t("experimentalBroadcastPanel.zapisz")}</li>
            <li>{t("experimentalBroadcastPanel.rozciagnij_widget_na_cala_nakladke")}</li>
          </ol>
          {([["HTML", widget.html], ["CSS", widget.css], ["JS", widget.js]] as const).map(([label, code]) => (
            <div key={label} className="space-y-1">
              <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{label}</span><CopyLinkButton text={code} label={t("experimentalBroadcastPanel.kopiuj_label", { label: label })} showLabel /></div>
              <pre className="max-h-40 overflow-auto rounded-md border bg-muted/40 p-2 text-xs"><code>{code}</code></pre>
            </div>
          ))}
        </div>
      </details>

      <details className="rounded-lg border p-3" data-testid="broadcast-advanced">
        <summary className="min-h-11 cursor-pointer content-center font-medium">{t("experimentalBroadcastPanel.ustawienia_zaawansowane")}{!looksDefault && <span className="ml-2 text-xs font-normal text-muted-foreground">{t("experimentalBroadcastPanel.zmienione")}</span>}</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Choice label={t("experimentalBroadcastPanel.wariant")} value={config.layout} options={[["pelny", t("experimentalBroadcastPanel.rozbudowany")], ["kompakt" /* i18n-ignore */, t("experimentalBroadcastPanel.kompaktowy")]]} onChange={(v) => set("layout", v as OverlayConfig["layout"])} />
          <Choice label={t("experimentalBroadcastPanel.rozmiar_wyniku")} value={config.scoreSize} options={[["s", t("experimentalBroadcastPanel.maly")], ["m", t("experimentalBroadcastPanel.sredni")], ["l", t("experimentalBroadcastPanel.duzy")]]} onChange={(v) => set("scoreSize", v as OverlayConfig["scoreSize"])} />
          <Choice label={t("experimentalBroadcastPanel.tekst")} value={String(config.textScale)} options={[["1", "100%"], ["1.25", "125%"], ["1.5", "150%"]]} onChange={(v) => set("textScale", Number(v) as OverlayConfig["textScale"])} />
          <Choice label={t("experimentalBroadcastPanel.tlo")} value={config.background} options={[["przezroczyste" /* i18n-ignore */, t("experimentalBroadcastPanel.przezroczyste_na_obraz_gry")], ["pelne", t("experimentalBroadcastPanel.pelne_osobna_scena")]]} onChange={(v) => set("background", v as OverlayConfig["background"])} />
          <Choice label={t("experimentalBroadcastPanel.polozenie_paska")} value={config.position} options={[["dol", "Na dole"], ["gora", t("experimentalBroadcastPanel.na_gorze")]]} onChange={(v) => set("position", v as OverlayConfig["position"])} />
          <Choice label={t("experimentalBroadcastPanel.tytul_turnieju")} value={config.showTitle ? "1" : "0"} options={[["1", t("experimentalBroadcastPanel.pokaz")], ["0", t("experimentalBroadcastPanel.ukryj")]]} onChange={(v) => set("showTitle", v === "1")} />
          {config.kind === "zapowiedz" && <Choice label={t("experimentalBroadcastPanel.kolejne_mecze")} value={config.showQueue ? "1" : "0"} options={[["0", t("experimentalBroadcastPanel.ukryj")], ["1", t("experimentalBroadcastPanel.pokaz_3_nastepne")]]} onChange={(v) => set("showQueue", v === "1")} />}
        </div>
        <Button type="button" variant="outline" className="mt-3 min-h-11" disabled={looksDefault} onClick={resetLook}><RotateCcw className="mr-1 h-4 w-4" aria-hidden />{t("experimentalBroadcastPanel.przywroc_domyslne")}</Button>
        <p className="mt-1 text-xs text-muted-foreground">{t("experimentalBroadcastPanel.rodzaj_nakladki_zestaw_wygladu_animacje")}{" "}{kind.label}.</p>
      </details>

      <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground" data-testid="broadcast-experiments">
        <strong className="text-foreground">{t("experimentalBroadcastPanel.eksperymenty")}</strong>{" "}{t("experimentalBroadcastPanel.poza_turniejem_bez_gwarancji_kamerka")}{" "}
        <Link className="underline" href="/stream">{t("experimentalBroadcastPanel.obs_stream")}</Link>{t("experimentalBroadcastPanel.nie_korzystaja_z_wynikow_turnieju")}</p>
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
      <iframe title={t("experimentalBroadcastPanel.podglad_nakladki")} tabIndex={-1} src={src} width={width} height={height} className="absolute left-0 top-0 origin-top-left border-0" style={{ transform: `scale(${scale})` }} />
    </div>
  );
}
