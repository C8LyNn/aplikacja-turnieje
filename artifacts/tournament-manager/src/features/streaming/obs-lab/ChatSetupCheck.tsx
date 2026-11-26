import { t } from "@/i18n";
import { AlertTriangle, CheckCircle2, Lightbulb, Wrench } from "lucide-react";
import { ToolButton, ToolPanel } from "@/components/tool-ui";
import type { CameraChatConfig } from "./camera-chat-settings";
import { type ChatSetupIssue, checkChatSetup, fixAllChatIssues } from "./chat-setup-check";

function issueText(issue: ChatSetupIssue): string {
  const values = issue.values ?? {};
  switch (issue.id) {
    case "contrast": return t("obsLab.spr_kontrast", values);
    case "transparent": return t("obsLab.spr_przezroczysty");
    case "tinyText": return t("obsLab.spr_maly_tekst", values);
    case "emptyHeader": return t("obsLab.spr_pusty_naglowek");
    case "noEventKinds": return t("obsLab.spr_brak_rodzajow");
    case "confettiNoEvents": return t("obsLab.spr_konfetti_bez_zdarzen");
    case "shortLifetime": return t("obsLab.spr_krotkie_znikanie", values);
    case "coverCamera": return t("obsLab.spr_zaslania_kamerke");
    case "soundSilent": return t("obsLab.spr_cichy_dzwiek");
    case "goalDone": return t("obsLab.spr_cel_osiagniety", values);
    case "bots": return t("obsLab.spr_boty");
  }
}

type Props = {
  config: CameraChatConfig;
  update: (update: (current: CameraChatConfig) => CameraChatConfig) => void;
};

/** Common problems of the current settings, each with a one-click fix. */
export function ChatSetupCheck({ config, update }: Props) {
  const liveTitle = t("obsLab.czat_na_zywo");
  const issues = checkChatSetup(config, liveTitle);
  return (
    <ToolPanel
      title={t("obsLab.sprawdzenie_ustawien")}
      description={t("obsLab.sprawdzenie_ustawien_opis")}
      actions={issues.length > 1 ? (
        <ToolButton
          type="button"
          variant="ghost"
          className="px-2.5 py-1 text-xs"
          onClick={() => update((current) => fixAllChatIssues(current, checkChatSetup(current, liveTitle)))}
          data-testid="chat-check-fix-all"
        >
          <Wrench className="h-3.5 w-3.5" />{" "}{t("obsLab.napraw_wszystko")}
        </ToolButton>
      ) : undefined}
    >
      <div data-testid="chat-setup-check">
        {issues.length === 0 ? (
          <p className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />{t("obsLab.wszystko_wyglada_dobrze")}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {issues.map((issue) => (
              <li
                key={issue.id}
                className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/35 px-2.5 py-1.5 text-xs"
                data-issue={issue.id}
              >
                {issue.level === "warn"
                  ? <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                  : <Lightbulb className="h-4 w-4 shrink-0 text-sky-400" />}
                <span className="min-w-0 flex-1 leading-5 text-muted-foreground">{issueText(issue)}</span>
                <ToolButton
                  type="button"
                  className="shrink-0 px-2 py-0.5 text-xs"
                  onClick={() => update((current) => issue.fix(current))}
                  data-testid={`chat-check-fix-${issue.id}`}
                >
                  {t("obsLab.napraw")}
                </ToolButton>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ToolPanel>
  );
}
