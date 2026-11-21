import { t } from "@/i18n";
import { AlertTriangle, FlaskConical, Lock, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExperimentalTestDataDialog({
  open,
  onOpenChange,
  sizes,
  selectedSize,
  onSelectedSizeChange,
  organizerPassword,
  onOrganizerPasswordChange,
  loading,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sizes: readonly number[];
  selectedSize: number;
  onSelectedSizeChange: (size: number) => void;
  organizerPassword: string;
  onOrganizerPasswordChange: (value: string) => void;
  loading: boolean;
  onCreate: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="experimental-test-data-dialog max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/12">
              <FlaskConical className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle>{t("experimentalDashboardDialogs.dane_testowe")}</DialogTitle>
              <DialogDescription className="mt-1 leading-6">
                {t("experimentalDashboardDialogs.utworz_szybki_turniej_drabinka_eliminacy")}</DialogDescription>
            </div>
            <DialogClose className="experimental-dialog-close" aria-label={t("experimentalDashboardDialogs.zamknij_okno_dane_testowe")}>
              <X className="h-4 w-4" aria-hidden="true" />
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">{t("experimentalDashboardDialogs.liczba_graczy")}</legend>
            <div className="grid grid-cols-4 gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  aria-pressed={selectedSize === size}
                  className={`rounded-lg border px-3 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                    selectedSize === size
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background/40 text-muted-foreground hover:border-primary/45 hover:text-foreground"
                  }`}
                  onClick={() => onSelectedSizeChange(size)}
                  disabled={loading}
                >
                  {size}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs leading-5 text-muted-foreground">
            {t("experimentalDashboardDialogs.format")}{" "}<strong>{t("experimentalDashboardDialogs.drabinka_eliminacyjna")}</strong> {t("experimentalDashboardDialogs.bo1_bez_seedow")}</div>

          <div className="space-y-1.5">
            <Label htmlFor="experimental-test-organizer-password">{t("experimentalDashboardDialogs.haslo_organizatora")}</Label>
            <Input
              id="experimental-test-organizer-password"
              type="password"
              value={organizerPassword}
              onChange={(event) => onOrganizerPasswordChange(event.target.value)}
              minLength={8}
              placeholder={t("experimentalDashboardDialogs.minimum_8_znakow")}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            <X className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t("experimentalDashboardDialogs.anuluj")}</Button>
          <Button onClick={onCreate} disabled={loading || organizerPassword.length < 8}>
            <FlaskConical className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {loading ? t("experimentalDashboardDialogs.tworzenie") : t("experimentalDashboardDialogs.utworz_z_selectedsize_graczami", { selectedSize: selectedSize })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ExperimentalDeleteTournamentDialog({
  open,
  onOpenChange,
  tournamentName,
  hasOrganizerPassword,
  hasHostCode,
  password,
  onPasswordChange,
  passwordError,
  loading,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentName?: string;
  hasOrganizerPassword?: boolean;
  hasHostCode?: boolean;
  password: string;
  onPasswordChange: (value: string) => void;
  passwordError?: string | null;
  loading: boolean;
  onDelete: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!loading) onOpenChange(next); }}>
      <DialogContent className="experimental-delete-dialog max-w-md border-destructive/45">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-destructive/12">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <DialogTitle>{t("experimentalDashboardDialogs.usun_turniej")}</DialogTitle>
              <DialogDescription className="mt-1 leading-6">
                {t("experimentalDashboardDialogs.trwale_usuniesz")}{" "}<strong className="break-words text-foreground">„{tournamentName || t("experimentalDashboardDialogs.turniej")}”</strong>{" "}
                {t("experimentalDashboardDialogs.wraz_z_graczami_meczami_i")}</DialogDescription>
            </div>
            <DialogClose className="experimental-dialog-close" aria-label={t("experimentalDashboardDialogs.zamknij_okno_usun_turniej")} disabled={loading}>
              <X className="h-4 w-4" aria-hidden="true" />
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2 text-xs font-semibold text-destructive">
            {t("experimentalDashboardDialogs.tej_operacji_nie_mozna_cofnac")}</p>

          {hasOrganizerPassword ? (
            <div className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-4">
              <Label htmlFor="experimental-delete-password" className="flex items-center gap-2 text-sm font-semibold">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                {t("experimentalDashboardDialogs.haslo_organizatora_2")}</Label>
              <Input
                id="experimental-delete-password"
                type="password"
                placeholder={t("experimentalDashboardDialogs.haslo_organizatora_tego_turnieju")}
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") onDelete(); }}
                disabled={loading}
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? "experimental-delete-error" : undefined}
              />
              {passwordError && (
                <p id="experimental-delete-error" role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {passwordError}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-border/70 bg-muted/20 px-4 py-3">
              <p className="text-xs leading-5 text-muted-foreground">
                {hasHostCode
                  ? t("experimentalDashboardDialogs.ten_historyczny_turniej_uzywa_starego")
                  : t("experimentalDashboardDialogs.ten_historyczny_turniej_nie_ma")}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>{t("experimentalDashboardDialogs.anuluj")}</Button>
          <Button variant="destructive" onClick={onDelete} disabled={loading}>
            <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {loading ? t("experimentalDashboardDialogs.weryfikacja") : t("experimentalDashboardDialogs.usun_na_stale")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
