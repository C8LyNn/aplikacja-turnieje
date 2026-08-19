import { useState } from "react";
import { Copy, Check, Link2, Globe, Lock, EyeOff, Eye, EyeOff as EyeOffIcon, Monitor, Key, Shield, AlertTriangle, Tv2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiChangeVisibility, apiChangeViewerPassword } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { getGetTournamentQueryKey } from "@workspace/api-client-react";

interface TournamentLike {
  id: number;
  name: string;
  visibility?: string;
  hasViewerPassword?: boolean;
}

interface Props {
  tournament: TournamentLike;
  orgToken: string;
}

type Visibility = "public_online" | "private_online" | "private_offline";

const VISIBILITY_INFO: Record<Visibility, { label: string; icon: React.ReactNode; desc: string; badge: string }> = {
  public_online: {
    label: "Publiczny online",
    icon: <Globe className="w-4 h-4 text-green-400" />,
    desc: "Widz może wejść przez link bez hasła. Turniej widoczny na dashboardzie.",
    badge: "Publiczny",
  },
  private_online: {
    label: "Prywatny online",
    icon: <Lock className="w-4 h-4 text-yellow-400" />,
    desc: "Dostępny przez link, ale widz musi podać hasło widza. Widoczny na dashboardzie.",
    badge: "Chroniiony hasłem",
  },
  private_offline: {
    label: "Prywatny offline",
    icon: <EyeOff className="w-4 h-4 text-red-400" />,
    desc: "Niewidoczny na dashboardzie. Dostępny tylko dla organizatora i wsparcia przez bezpośredni link.",
    badge: "Ukryty",
  },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={handleCopy}
      className="shrink-0 p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title="Kopiuj link"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function LinkRow({ label, url, icon }: { label: string; url: string; icon: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2 border border-border/50">
        <span className="text-xs text-foreground/80 truncate flex-1 font-mono">{url}</span>
        <CopyButton text={url} />
      </div>
    </div>
  );
}

export function SharingPanel({ tournament, orgToken }: Props) {
  const queryClient = useQueryClient();
  const currentVisibility = (tournament.visibility ?? "public_online") as Visibility;

  const [newVisibility, setNewVisibility] = useState<Visibility>(currentVisibility);
  const [viewerPass, setViewerPass] = useState("");
  const [showViewerPass, setShowViewerPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [newViewerPw, setNewViewerPw] = useState("");
  const [showNewVPw, setShowNewVPw] = useState(false);
  const [changingVPw, setChangingVPw] = useState(false);
  const [vPwError, setVPwError] = useState<string | null>(null);
  const [vPwSuccess, setVPwSuccess] = useState(false);

  const base = typeof window !== "undefined" ? window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "") : "";
  const tid = tournament.id;

  // OBS projector URL builder state
  const [obsPreset, setObsPreset] = useState<string>("classic");
  const [obsTransparent, setObsTransparent] = useState(false);
  const [obsCompact, setObsCompact] = useState(false);
  const [obsFinals, setObsFinals] = useState<"upper" | "between">("upper");
  const [obsZoom, setObsZoom] = useState("1");
  const [obsHideHeader, setObsHideHeader] = useState(false);
  const [obsShowDrops, setObsShowDrops] = useState(true);
  const [showObsConfig, setShowObsConfig] = useState(false);

  const buildObsUrl = () => {
    const params = new URLSearchParams();
    if (obsPreset !== "classic") params.set("preset", obsPreset);
    if (obsTransparent) params.set("transparent", "1");
    if (obsCompact) params.set("compact", "1");
    if (obsFinals !== "upper") params.set("finals", obsFinals);
    if (obsZoom !== "1" && obsZoom !== "") params.set("zoom", obsZoom);
    if (obsHideHeader) params.set("hide-header", "1");
    if (!obsShowDrops) params.set("show-drops", "0");
    const qs = params.toString();
    return `${base}/tournaments/${tid}/projector${qs ? `?${qs}` : ""}`;
  };

  const links = {
    viewer: `${base}/tournaments/${tid}`,
    organizer: `${base}/tournaments/${tid}?login=organizer`,
    support: `${base}/tournaments/${tid}?login=support`,
    projector: buildObsUrl(),
  };

  async function handleSaveVisibility(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await apiChangeVisibility(tid, orgToken, newVisibility, newVisibility === "private_online" ? viewerPass : undefined);
      queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(tid) });
      setSaveSuccess(true);
      setViewerPass("");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeViewerPassword(e: React.FormEvent) {
    e.preventDefault();
    setChangingVPw(true);
    setVPwError(null);
    setVPwSuccess(false);
    try {
      await apiChangeViewerPassword(tid, orgToken, newViewerPw);
      queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(tid) });
      setVPwSuccess(true);
      setNewViewerPw("");
      setTimeout(() => setVPwSuccess(false), 3000);
    } catch (err: any) {
      setVPwError(err.message);
    } finally {
      setChangingVPw(false);
    }
  }

  const visibilityChanged = newVisibility !== currentVisibility;
  const requiresViewerPass = newVisibility === "private_online" && (visibilityChanged || !tournament.hasViewerPassword);
  const info = VISIBILITY_INFO[newVisibility];

  return (
    <div className="space-y-6">
      {/* Current status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="w-4 h-4" /> Bezpośrednie linki
            </CardTitle>
            <Badge variant="outline" className="text-xs gap-1">
              {VISIBILITY_INFO[currentVisibility].icon}
              {VISIBILITY_INFO[currentVisibility].badge}
            </Badge>
          </div>
          <CardDescription>Udostępnij te linki odpowiednim osobom</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <LinkRow
            label="Link widza (główny link turnieju)"
            url={links.viewer}
            icon={<Eye className="w-3.5 h-3.5" />}
          />
          <LinkRow
            label="Link organizatora (otwiera okno logowania)"
            url={links.organizer}
            icon={<Key className="w-3.5 h-3.5" />}
          />
          <LinkRow
            label="Link wsparcia (otwiera okno logowania wsparcia)"
            url={links.support}
            icon={<Shield className="w-3.5 h-3.5" />}
          />
          {/* OBS Projector section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Tv2 className="w-3.5 h-3.5" />
                Projektor OBS (Browser Source)
              </div>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowObsConfig(v => !v)}
              >
                {showObsConfig ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showObsConfig ? "Zwiń" : "Konfiguruj"}
              </button>
            </div>
            <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2 border border-border/50">
              <span className="text-xs text-foreground/80 truncate flex-1 font-mono">{links.projector}</span>
              <CopyButton text={links.projector} />
            </div>

            {showObsConfig && (
              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3 mt-1">
                <p className="text-[11px] text-muted-foreground">
                  Skonfiguruj wygląd projektora. URL zaktualizuje się automatycznie.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Preset</Label>
                    <select
                      className="w-full text-xs rounded-md border border-border bg-background px-2 py-1.5"
                      value={obsPreset}
                      onChange={e => setObsPreset(e.target.value)}
                    >
                      <option value="classic">Classic</option>
                      <option value="dark-minimal">Dark Minimal</option>
                      <option value="deadlock">Deadlock</option>
                      <option value="neon">Neon</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Grand Finał</Label>
                    <select
                      className="w-full text-xs rounded-md border border-border bg-background px-2 py-1.5"
                      value={obsFinals}
                      onChange={e => setObsFinals(e.target.value as "upper" | "between")}
                    >
                      <option value="upper">Przy Upper</option>
                      <option value="between">Pomiędzy UB i LB</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Zoom (np. 0.8, 1, 1.2)</Label>
                  <Input
                    type="number"
                    min={0.3}
                    max={3}
                    step={0.05}
                    value={obsZoom}
                    onChange={e => setObsZoom(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "obsTransparent", label: "Transparent BG", val: obsTransparent, set: setObsTransparent },
                    { key: "obsCompact", label: "Compact", val: obsCompact, set: setObsCompact },
                    { key: "obsHideHeader", label: "Ukryj nagłówek", val: obsHideHeader, set: setObsHideHeader },
                    { key: "obsShowDrops", label: "Pokaż przejścia UB→LB", val: obsShowDrops, set: setObsShowDrops },
                  ].map(({ key, label, val, set }) => (
                    <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={e => set(e.target.checked)}
                        className="accent-primary"
                      />
                      <span className="text-[11px] text-muted-foreground">{label}</span>
                    </label>
                  ))}
                </div>
                <div className="pt-1 border-t border-border/40 flex gap-2">
                  <a
                    href={links.projector}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-primary underline-offset-2 hover:underline"
                  >
                    Otwórz w nowej karcie ↗
                  </a>
                  <span className="text-muted-foreground/40 text-[11px]">·</span>
                  <CopyButton text={links.projector} />
                  <span className="text-[11px] text-muted-foreground/60">Skopiuj URL do OBS</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visibility settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4" /> Tryb widoczności
          </CardTitle>
          <CardDescription>Kontroluj kto może zobaczyć turniej</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveVisibility} className="space-y-4">
            <div className="space-y-2">
              {(Object.entries(VISIBILITY_INFO) as [Visibility, typeof VISIBILITY_INFO[Visibility]][]).map(([val, meta]) => (
                <label
                  key={val}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    newVisibility === val
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-border/80 hover:bg-muted/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={val}
                    checked={newVisibility === val}
                    onChange={() => setNewVisibility(val)}
                    className="mt-0.5 accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {meta.icon}
                      {meta.label}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{meta.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {newVisibility === "private_online" && (visibilityChanged || !tournament.hasViewerPassword) && (
              <div className="space-y-1.5">
                <Label>
                  Hasło widza {!tournament.hasViewerPassword && <span className="text-red-400">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    type={showViewerPass ? "text" : "password"}
                    value={viewerPass}
                    onChange={(e) => setViewerPass(e.target.value)}
                    placeholder="Ustaw hasło dla widzów..."
                    className="pr-10"
                    required={requiresViewerPass && !tournament.hasViewerPassword}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowViewerPass((v) => !v)}
                  >
                    {showViewerPass ? <EyeOffIcon className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {tournament.hasViewerPassword && (
                  <p className="text-xs text-muted-foreground">Zostaw puste, aby zachować obecne hasło widza.</p>
                )}
              </div>
            )}

            {saveError && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                <Check className="w-4 h-4 shrink-0" />
                Zapisano pomyślnie.
              </div>
            )}

            <Button type="submit" disabled={saving || (!visibilityChanged && !viewerPass)} className="w-full">
              {saving ? "Zapisywanie…" : "Zapisz ustawienia widoczności"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change viewer password (if already private_online) */}
      {currentVisibility === "private_online" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4" /> Zmień hasło widza
            </CardTitle>
            <CardDescription>Poprzednie tokeny widzów zostaną unieważnione</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangeViewerPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nowe hasło widza</Label>
                <div className="relative">
                  <Input
                    type={showNewVPw ? "text" : "password"}
                    value={newViewerPw}
                    onChange={(e) => setNewViewerPw(e.target.value)}
                    placeholder="Nowe hasło widza..."
                    className="pr-10"
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNewVPw((v) => !v)}
                  >
                    {showNewVPw ? <EyeOffIcon className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {vPwError && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {vPwError}
                </div>
              )}
              {vPwSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                  <Check className="w-4 h-4 shrink-0" />
                  Hasło widza zostało zmienione.
                </div>
              )}
              <Button type="submit" disabled={changingVPw || newViewerPw.length < 8} variant="outline" className="w-full">
                {changingVPw ? "Zmienianie…" : "Zmień hasło widza"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
