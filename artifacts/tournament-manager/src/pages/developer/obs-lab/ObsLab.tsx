import { StreamElementsSetup } from "./StreamElementsSetup";
import "./ObsLab.css";

﻿import {
  useMemo,
  useState,
} from "react";

import {
  CameraChatWidget,
  generateMockMessages,
} from "./CameraChatWidget";

import {
  type CameraChatConfig,
  type CameraChatLayout,
  type CameraChatAspectRatio,
  type CameraChatFontSize,
  type CameraChatDensity,
  type CameraChatAnchor,
  type CameraChatOverlayPosition,
  DEFAULT_CAMERA_CHAT_CONFIG,
  cameraChatConfigToSearch,
  getCameraChatSize,
} from "./camera-chat-settings";

export function ObsLab() {
  const [
    openChatLab,
    setOpenChatLab,
  ] = useState(false);

  const [
    config,
    setConfig,
  ] =
    useState<CameraChatConfig>(
      DEFAULT_CAMERA_CHAT_CONFIG,
    );

  const [
    mockMessages,
    setMockMessages,
  ] =
    useState(() =>
      generateMockMessages(),
    );

  const [
    copied,
    setCopied,
  ] = useState(false);

  const size =
    getCameraChatSize(config);

  function patchConfig(
    patch:
      Partial<CameraChatConfig>,
  ) {
    setConfig((current) => ({
      ...current,
      ...patch,
    }));
  }

  const overlayUrl =
    useMemo(() => {
      const basePath =
        import.meta.env.BASE_URL.replace(
          /\/$/,
          "",
        );

      const path =
        `${basePath}/developer/overlay/camera-chat`;

      return (
        `${window.location.origin}${path}?` +
        cameraChatConfigToSearch(
          config,
        )
      );
    }, [config]);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(
        overlayUrl,
      );

      setCopied(true);

      window.setTimeout(
        () => setCopied(false),
        1800,
      );
    } catch {
      const textarea =
        document.createElement(
          "textarea",
        );

      textarea.value = overlayUrl;

      document.body.appendChild(
        textarea,
      );

      textarea.select();

      document.execCommand("copy");

      textarea.remove();

      setCopied(true);
    }
  }

  function applyPreset(
    preset:
      | "glass"
      | "minimal"
      | "compact",
  ) {
    if (preset === "glass") {
      setConfig({
        ...DEFAULT_CAMERA_CHAT_CONFIG,
        panelOpacity: 66,
        radius: 24,
      });

      return;
    }

    if (preset === "minimal") {
      setConfig({
        ...DEFAULT_CAMERA_CHAT_CONFIG,

        layout: "below",

        fontSize: "small",
        density: "compact",

        maxMessages: 4,

        panelOpacity: 28,
        radius: 14,

        innerPadding: 8,

        showBorders: false,
        messageBackground: false,
      });

      return;
    }

    setConfig({
      ...DEFAULT_CAMERA_CHAT_CONFIG,

      layout: "overlay",

      chatWidth: 38,

      maxMessages: 4,

      fontSize: "small",
      density: "compact",

      panelOpacity: 62,
      radius: 18,

      innerPadding: 8,

      showBorders: false,

      overlayInset: 12,
      overlayPosition:
        "bottom-right",
    });
  }

  if (!openChatLab) {
    return (
      <div className="space-y-5">
        <section className="rounded-2xl border border-border bg-card/50 p-6">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-sky-400">
            OBS LAB
          </div>

          <h2 className="mt-2 text-2xl font-bold">
            OBS / Stream Add-ons
          </h2>

          <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
            Eksperymentalne overlaye,
            animacje i Browser Source
            przeznaczone do streamów.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            onClick={() =>
              setOpenChatLab(true)
            }
            className="min-h-[230px] rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-card to-card p-5 text-left transition hover:-translate-y-0.5 hover:border-sky-400/60"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="grid h-11 min-w-11 place-items-center rounded-xl border border-sky-500/20 bg-sky-500/10 px-2 text-xs font-black text-sky-400">
                CHAT
              </div>

              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                Aktywne
              </span>
            </div>

            <h3 className="mt-5 text-lg font-bold">
              Camera + Chat Overlay
            </h3>

            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              Konfigurowalny overlay
              kamerki i czatu z własnym
              URL dla OBS.
            </p>

            <div className="mt-5 border-t border-border/70 pt-4 text-xs font-bold text-sky-400">
              Otwórz konfigurator →
            </div>
          </button>

          <div className="min-h-[230px] rounded-2xl border border-border bg-card/40 p-5">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-background/50 text-xs font-black text-muted-foreground">
              FX
            </div>

            <h3 className="mt-5 text-lg font-bold">
              Animated Effects
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Kolejne efekty i animacje
              streamowe.
            </p>
          </div>

          <div className="min-h-[230px] rounded-2xl border border-border bg-card/40 p-5">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-background/50 text-xs font-black text-muted-foreground">
              APP
            </div>

            <h3 className="mt-5 text-lg font-bold">
              Tournament Overlays
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Dane aplikacji turniejowej
              na stream.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() =>
            setOpenChatLab(false)
          }
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-accent"
        >
          ← OBS Lab
        </button>

        <div className="flex rounded-lg border border-border bg-card p-1">
          {[
            ["right", "Prawo"],
            ["below", "Dół"],
            ["overlay", "Na kamerce"],
          ].map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  patchConfig({
                    layout:
                      value as CameraChatLayout,
                  })
                }
                className={`rounded-md px-3 py-1.5 text-xs font-bold ${
                  config.layout === value
                    ? "bg-sky-500/15 text-sky-300"
                    : "text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ),
          )}
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card/50 p-5">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-sky-400">
          CAMERA + CHAT OVERLAY
        </div>

        <h2 className="mt-2 text-2xl font-bold">
          Konfigurator Browser Source
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Każda zmiana jest automatycznie
          zapisywana w generowanym URL.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-2xl border border-border bg-card/40 p-4">
          <section>
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Presety
              </div>

              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...DEFAULT_CAMERA_CHAT_CONFIG,
                  })
                }
                className="text-xs font-bold text-sky-400"
              >
                Reset
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  applyPreset("glass")
                }
                className="rounded-lg border border-border px-2 py-2 text-xs hover:bg-accent"
              >
                Glass
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset("minimal")
                }
                className="rounded-lg border border-border px-2 py-2 text-xs hover:bg-accent"
              >
                Minimal
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset("compact")
                }
                className="rounded-lg border border-border px-2 py-2 text-xs hover:bg-accent"
              >
                Compact
              </button>
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-border bg-background/35 p-3">
            <div className="text-sm font-bold">
              Kamerka
            </div>

            <label className="block text-xs text-muted-foreground">
              Proporcje

              <select
                value={
                  config.aspectRatio
                }
                onChange={(event) =>
                  patchConfig({
                    aspectRatio:
                      event.target
                        .value as CameraChatAspectRatio,
                  })
                }
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="16:9">
                  16:9
                </option>

                <option value="4:3">
                  4:3
                </option>

                <option value="1:1">
                  1:1
                </option>
              </select>
            </label>

            <label className="block">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Szerokość</span>
                <strong>
                  {config.cameraWidth}px
                </strong>
              </div>

              <input
                type="range"
                min="320"
                max="960"
                step="20"
                value={
                  config.cameraWidth
                }
                onChange={(event) =>
                  patchConfig({
                    cameraWidth:
                      Number(
                        event.target
                          .value,
                      ),
                  })
                }
                className="obs-range"
              />
            </label>
          </section>

          <section className="space-y-3 rounded-xl border border-border bg-background/35 p-3">
            <div className="text-sm font-bold">
              Układ
            </div>

            <select
              value={config.layout}
              onChange={(event) =>
                patchConfig({
                  layout:
                    event.target
                      .value as CameraChatLayout,
                })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="right">
                Czat po prawej
              </option>

              <option value="below">
                Czat pod kamerką
              </option>

              <option value="overlay">
                Czat na kamerce
              </option>
            </select>

            {(config.layout ===
              "right" ||
              config.layout ===
                "overlay") && (
              <label className="block">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>
                    Szerokość czatu
                  </span>

                  <strong>
                    {config.chatWidth}%
                  </strong>
                </div>

                <input
                  type="range"
                  min="20"
                  max="55"
                  value={
                    config.chatWidth
                  }
                  onChange={(event) =>
                    patchConfig({
                      chatWidth:
                        Number(
                          event.target
                            .value,
                        ),
                    })
                  }
                  className="obs-range"
                />
              </label>
            )}

            {config.layout ===
              "below" && (
              <label className="block">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>
                    Wysokość czatu
                  </span>

                  <strong>
                    {
                      config.belowHeight
                    }
                    px
                  </strong>
                </div>

                <input
                  type="range"
                  min="80"
                  max="300"
                  value={
                    config.belowHeight
                  }
                  onChange={(event) =>
                    patchConfig({
                      belowHeight:
                        Number(
                          event.target
                            .value,
                        ),
                    })
                  }
                  className="obs-range"
                />
              </label>
            )}

            {config.layout !==
              "overlay" && (
              <label className="block">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Odstęp</span>

                  <strong>
                    {config.gap}px
                  </strong>
                </div>

                <input
                  type="range"
                  min="0"
                  max="40"
                  value={config.gap}
                  onChange={(event) =>
                    patchConfig({
                      gap: Number(
                        event.target
                          .value,
                      ),
                    })
                  }
                  className="obs-range"
                />
              </label>
            )}

            {config.layout ===
              "right" && (
              <label className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                <span className="text-xs">
                  Pełna wysokość
                  kamerki
                </span>

                <input
                  type="checkbox"
                  checked={
                    config.fitChatHeight
                  }
                  onChange={(event) =>
                    patchConfig({
                      fitChatHeight:
                        event.target
                          .checked,
                    })
                  }
                />
              </label>
            )}

            {config.layout ===
              "overlay" && (
              <>
                <select
                  value={
                    config.overlayPosition
                  }
                  onChange={(event) =>
                    patchConfig({
                      overlayPosition:
                        event.target
                          .value as CameraChatOverlayPosition,
                    })
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="top-left">
                    Lewy górny
                  </option>

                  <option value="top-right">
                    Prawy górny
                  </option>

                  <option value="bottom-left">
                    Lewy dolny
                  </option>

                  <option value="bottom-right">
                    Prawy dolny
                  </option>
                </select>

                <label className="block">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>
                      Odsunięcie
                    </span>

                    <strong>
                      {
                        config.overlayInset
                      }
                      px
                    </strong>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={
                      config.overlayInset
                    }
                    onChange={(event) =>
                      patchConfig({
                        overlayInset:
                          Number(
                            event.target
                              .value,
                          ),
                      })
                    }
                    className="obs-range"
                  />
                </label>
              </>
            )}
          </section>

          <section className="space-y-3 rounded-xl border border-border bg-background/35 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold">
                Wiadomości
              </div>

              <button
                type="button"
                onClick={() =>
                  setMockMessages(
                    generateMockMessages(),
                  )
                }
                className="text-xs font-bold text-sky-400"
              >
                Losuj
              </button>
            </div>

            <label className="block">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Liczba</span>

                <strong>
                  {config.maxMessages}
                </strong>
              </div>

              <input
                type="range"
                min="1"
                max="12"
                value={
                  config.maxMessages
                }
                onChange={(event) =>
                  patchConfig({
                    maxMessages:
                      Number(
                        event.target
                          .value,
                      ),
                  })
                }
                className="obs-range"
              />
            </label>

            <select
              value={config.fontSize}
              onChange={(event) =>
                patchConfig({
                  fontSize:
                    event.target
                      .value as CameraChatFontSize,
                })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="small">
                Mały tekst
              </option>

              <option value="medium">
                Średni tekst
              </option>

              <option value="large">
                Duży tekst
              </option>
            </select>

            <select
              value={config.density}
              onChange={(event) =>
                patchConfig({
                  density:
                    event.target
                      .value as CameraChatDensity,
                })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="compact">
                Kompaktowy
              </option>

              <option value="normal">
                Normalny
              </option>

              <option value="relaxed">
                Luźny
              </option>
            </select>

            <select
              value={
                config.chatAnchor
              }
              onChange={(event) =>
                patchConfig({
                  chatAnchor:
                    event.target
                      .value as CameraChatAnchor,
                })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="bottom">
                Wiadomości od dołu
              </option>

              <option value="top">
                Wiadomości od góry
              </option>
            </select>
          </section>

          <section className="space-y-3 rounded-xl border border-border bg-background/35 p-3">
            <div className="text-sm font-bold">
              Wygląd
            </div>

            <label className="block">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>
                  Krycie panelu
                </span>

                <strong>
                  {
                    config.panelOpacity
                  }
                  %
                </strong>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={
                  config.panelOpacity
                }
                onChange={(event) =>
                  patchConfig({
                    panelOpacity:
                      Number(
                        event.target
                          .value,
                      ),
                  })
                }
                className="obs-range"
              />
            </label>

            <label className="block">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>
                  Zaokrąglenie
                </span>

                <strong>
                  {config.radius}px
                </strong>
              </div>

              <input
                type="range"
                min="0"
                max="40"
                value={config.radius}
                onChange={(event) =>
                  patchConfig({
                    radius:
                      Number(
                        event.target
                          .value,
                      ),
                  })
                }
                className="obs-range"
              />
            </label>

            <label className="block">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>
                  Padding
                </span>

                <strong>
                  {
                    config.innerPadding
                  }
                  px
                </strong>
              </div>

              <input
                type="range"
                min="2"
                max="24"
                value={
                  config.innerPadding
                }
                onChange={(event) =>
                  patchConfig({
                    innerPadding:
                      Number(
                        event.target
                          .value,
                      ),
                  })
                }
                className="obs-range"
              />
            </label>

            {[
              [
                "Avatary",
                "showAvatars",
              ],
              [
                "Obramowania",
                "showBorders",
              ],
              [
                "Tła wiadomości",
                "messageBackground",
              ],
              [
                "Wygaszanie starszych",
                "fadeOldMessages",
              ],
              [
                "Animacja wejścia",
                "animateMessages",
              ],
            ].map(
              ([label, key]) => (
                <label
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                >
                  <span className="text-xs">
                    {label}
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      Boolean(
                        config[
                          key as keyof CameraChatConfig
                        ],
                      )
                    }
                    onChange={(
                      event,
                    ) =>
                      patchConfig({
                        [key]:
                          event.target
                            .checked,
                      })
                    }
                  />
                </label>
              ),
            )}
          </section>
        </aside>

        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-black/30 p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Podgląd
              </div>

              <div className="text-xs text-muted-foreground">
                {size.width}
                {" × "}
                {size.height}px
              </div>
            </div>

            <div className="flex min-h-[620px] items-center justify-center overflow-auto rounded-xl border border-border bg-slate-950 p-8">
              <CameraChatWidget
                config={config}
                messages={
                  mockMessages
                }
                previewCamera
              />
            </div>
          </section>

          <section className="rounded-2xl border border-sky-500/30 bg-sky-500/[0.04] p-5">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-sky-400">
              BROWSER SOURCE
            </div>

            <h3 className="mt-2 text-lg font-bold">
              Gotowy URL dla OBS
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Link zawiera wszystkie
              aktualnie wybrane
              ustawienia.
            </p>

            <div className="mt-4 break-all rounded-xl border border-border bg-background/70 p-3 font-mono text-xs leading-5">
              {overlayUrl}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyUrl}
                className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-bold text-white hover:bg-sky-400"
              >
                {copied
                  ? "Skopiowano ✓"
                  : "Kopiuj URL"}
              </button>

              <button
                type="button"
                onClick={() =>
                  window.open(
                    overlayUrl,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
                className="rounded-lg border border-border px-4 py-2 text-sm font-bold hover:bg-accent"
              >
                Otwórz overlay ↗
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/50 p-3">
                <div className="text-xs text-muted-foreground">
                  OBS Browser Source —
                  szerokość
                </div>

                <div className="mt-1 text-xl font-black">
                  {size.width}px
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background/50 p-3">
                <div className="text-xs text-muted-foreground">
                  OBS Browser Source —
                  wysokość
                </div>

                <div className="mt-1 text-xl font-black">
                  {size.height}px
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              W OBS utwórz Browser
              Source, wklej URL i ustaw
              dokładnie powyższą
              szerokość oraz wysokość.
              Źródło kamerki umieść pod
              Browser Source.
            </p>
          </section>

          <StreamElementsSetup
              config={config}
            width={size.width}
            height={size.height}
          />
        </div>
      </div>
    </div>
  );
}
