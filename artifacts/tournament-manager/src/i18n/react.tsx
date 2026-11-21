// #323-E · React side of the translation system. The provider owns the language; a change re-renders the whole tree in
// place (no remount), so forms, the selected match and every query keep their state — only the texts change.
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { LANGS, getLang, setLang, subscribeLang, t, type Lang } from "./index";

export function useLang(): Lang {
  return useSyncExternalStore(subscribeLang, getLang, getLang);
}

/** Wrap the app: when the language changes, `render` is called again and every component shows the new texts. */
export function LanguageProvider({ render }: { render: () => ReactNode }) {
  const lang = useLang();
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  // `render()` creates fresh elements on every call, so React re-renders the tree (state is kept: same types, same places).
  return <>{render()}</>;
}

/** PL | EN — a compact toggle for headers (both views, public pages). */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const lang = useLang();
  return (
    <div role="group" aria-label={t("i18n.switcher.label")} className={`inline-flex shrink-0 overflow-hidden rounded-md border border-border text-xs font-semibold ${className}`} data-testid="language-switcher">
      {LANGS.map((option) => (
        <button key={option.id} type="button" lang={option.id} aria-pressed={lang === option.id} title={option.name}
          onClick={() => setLang(option.id)}
          className={`min-h-8 min-w-9 px-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${lang === option.id ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:bg-muted"}`}>
          <span aria-hidden="true">{option.label}</span><span className="sr-only">{option.name}</span>
        </button>
      ))}
    </div>
  );
}
