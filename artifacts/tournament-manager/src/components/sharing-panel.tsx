import { useState } from "react";
import { Copy, Check, Link2, Globe, Lock, EyeOff, Eye, EyeOff as EyeOffIcon, Monitor, Key, Shield, AlertTriangle } from "lucide-react";
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

  const links = {
    viewer: `${base}/tournaments/${tid}`,
    organizer: `${base}/tournaments/${tid}?login=organizer`,
    support: `${base}/tournaments/${tid}?login=support`,
    projector: `${base}/tournaments/${tid}/bracket`,
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
          <LinkRow
            label="Link projektora (widok drabinki pełnoekranowy)"
            url={links.projector}
            icon={<Monitor className="w-3.5 h-3.5" />}
          />
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
                    minLength={4}
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
              <Button type="submit" disabled={changingVPw || newViewerPw.length < 4} variant="outline" className="w-full">
                {changingVPw ? "Zmienianie…" : "Zmień hasło widza"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
