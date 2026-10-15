import { useEffect, useState } from "react";
import { ExternalLink, MonitorPlay } from "lucide-react";
import { ModuleBackLink } from "@/components/module-back-link";

type UnityBuildState = "checking" | "missing" | "detected";

function unityWebGlUrl(): string {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  return `${base}prototypes/minigames/core-clash-unity/index.html`;
}

function isUnityWebGlEntrypoint(html: string): boolean {
  // A Vite SPA fallback can return HTTP 200 for a missing .html asset.
  // Do not claim a WebGL build exists unless an actual Unity bootstrap appears.
  return /\bcreateUnityInstance\s*\(/.test(html) ||
    /\bUnityLoader\s*\.\s*instantiate\s*\(/.test(html);
}

export default function CoreClashUnityDemoPage() {
  const src = unityWebGlUrl();
  const [buildState, setBuildState] = useState<UnityBuildState>("checking");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function inspectBuild() {
      try {
        const response = await fetch(src, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Unity WebGL entrypoint not found");
        const html = await response.text();
        if (!isUnityWebGlEntrypoint(html)) {
          throw new Error("The response is not a Unity WebGL entrypoint");
        }
        if (active) setBuildState("detected");
      } catch {
        if (active) setBuildState("missing");
      }
    }

    void inspectBuild();
    return () => {
      active = false;
      controller.abort();
    };
  }, [src]);

  return (
    <div className="h-[100dvh] overflow-hidden bg-background text-foreground dark">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-background/95 px-3 py-2 sm:px-5">
          <ModuleBackLink href="/minigames" label="Minigry" />
          <span className="text-xs font-bold text-blue-400">UNITY WEBGL · V149 · WORK IN PROGRESS</span>
          {buildState === "detected" ? (
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-blue-500/40 hover:text-foreground"
            >
              Otwórz Unity WebGL
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>

        {buildState === "detected" ? (
          <iframe
            title="Core Clash — Unity Migration Demo V149"
            src={src}
            className="min-h-0 w-full flex-1 border-0 bg-black"
            allow="fullscreen; autoplay; pointer-lock; gamepad"
            allowFullScreen
          />
        ) : (
          <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-8">
            <section className="w-full max-w-xl rounded-2xl border border-blue-500/25 bg-card p-7 text-center shadow-lg">
              <MonitorPlay className="mx-auto mb-4 h-12 w-12 text-blue-400" aria-hidden="true" />
              <h1 className="text-2xl font-bold">Core Clash — Unity Migration Demo</h1>
              <p className="mt-2 text-sm font-semibold text-blue-400">V149 · Unity WebGL · Work in progress</p>
              <p className="mt-5 text-sm leading-6 text-muted-foreground" role="status">
                {buildState === "checking"
                  ? "Sprawdzanie dostępności paczki Unity WebGL…"
                  : "Build Unity WebGL nie został jeszcze dołączony do tej wersji strony. Kafelek jest przygotowany, ale gra nie jest obecnie dostępna do uruchomienia."}
              </p>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Ta wersja jest niezależna od oryginalnej gry HTML i V149.5 Web Showcase.
                Prototyp multiplayera jest przeznaczony do sieci LAN/Wi-Fi: host Windows i klient WebGL,
                bez obietnicy rozgrywki przez Internet.
              </p>
            </section>
          </main>
        )}
      </div>
    </div>
  );
}
