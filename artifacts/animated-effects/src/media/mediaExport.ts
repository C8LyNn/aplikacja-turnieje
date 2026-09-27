import { toCanvas } from "html-to-image";
import { GIFEncoder, applyPalette, quantize } from "gifenc";
import JSZip from "jszip";

import { generateStreamElementsExport } from "../export/streamElements";

import {
  getEditorState,
} from "../editor/state";

import {
  getAllEffectDefinitions,
} from "../effects/registry";

let dialogRef:
  HTMLDialogElement | null =
    null;

let abortGif = false;
let abortBatch = false;
let lastGifUrl:
  string | null =
    null;

type SceneState =
  ReturnType<
    typeof getEditorState
  >;

function escapeScript(
  value: string,
): string {
  return value.replace(
    /<\/script/gi,
    "<\\/script",
  );
}

function stableSeed(
  value: string,
): number {
  let hash =
    2166136261;

  for (
    let index = 0;
    index < value.length;
    index++
  ) {
    hash ^=
      value.charCodeAt(
        index,
      );

    hash =
      Math.imul(
        hash,
        16777619,
      );
  }

  return hash >>> 0;
}

function safeFileName(
  value: string,
): string {
  return value
    .toLowerCase()
    .replace(
      /[^a-z0-9_-]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    ) ||
    "effect";
}

async function createFrame(
  state: SceneState,
  width: number,
  height: number,
  background:
    string | null,
) {
  const exported =
    generateStreamElementsExport(
      state,
    );

  const iframe =
    document.createElement(
      "iframe",
    );

  Object.assign(
    iframe.style,
    {
      position: "fixed",
      left: "-100000px",
      top: "0",
      width:
        `${width}px`,
      height:
        `${height}px`,
      border: "0",
      pointerEvents:
        "none",
    },
  );

  iframe.width =
    String(width);

  iframe.height =
    String(height);

  iframe.srcdoc =
    `<!doctype html><html><head><meta charset="utf-8"><style>${exported.css}
html,body{width:${width}px!important;height:${height}px!important;${
  background
    ? `background:${background}!important;`
    : "background:transparent!important;"
}}</style></head><body>${exported.html}<script>${escapeScript(
      exported.javascript,
    )}<\/script></body></html>`;

  document.body.appendChild(
    iframe,
  );

  await new Promise<void>(
    (
      resolve,
      reject,
    ) => {
      const timer =
        window.setTimeout(
          () =>
            reject(
              new Error(
                "Timeout renderera eksportu.",
              ),
            ),
          10000,
        );

      iframe.addEventListener(
        "load",
        () => {
          clearTimeout(
            timer,
          );

          resolve();
        },
        {
          once: true,
        },
      );
    },
  );

  const win =
    iframe.contentWindow;

  const doc =
    iframe.contentDocument;

  if (
    !win ||
    !doc
  ) {
    iframe.remove();

    throw new Error(
      "Nie udaĹ‚o siÄ™ utworzyÄ‡ renderera eksportu.",
    );
  }

  win.dispatchEvent(
    new Event(
      "onWidgetLoad",
    ),
  );

  await new Promise<void>(
    (resolve) =>
      requestAnimationFrame(
        () =>
          requestAnimationFrame(
            () =>
              resolve(),
          ),
      ),
  );

  const root =
    doc.getElementById(
      "animated-effects-root",
    );

  if (!root) {
    iframe.remove();

    throw new Error(
      "Renderer eksportu nie utworzyĹ‚ sceny.",
    );
  }

  return {
    iframe,
    root,
    document: doc,
  };
}

function seek(
  frame:
    Awaited<
      ReturnType<
        typeof createFrame
      >
    >,
  ms: number,
): void {
  frame.document
    .getAnimations()
    .forEach(
      (animation) => {
        animation.pause();

        try {
          animation.currentTime =
            ms;
        } catch {
          // non-seekable
        }
      },
    );
}

async function capture(
  frame:
    Awaited<
      ReturnType<
        typeof createFrame
      >
    >,
  width: number,
  height: number,
  ms: number,
  background:
    string | null,
): Promise<HTMLCanvasElement> {
  seek(
    frame,
    ms,
  );

  await new Promise<void>(
    (resolve) =>
      requestAnimationFrame(
        () =>
          resolve(),
      ),
  );

  return toCanvas(
    frame.root,
    {
      width,
      height,
      canvasWidth:
        width,
      canvasHeight:
        height,
      pixelRatio: 1,
      backgroundColor:
        background ??
        undefined,
    },
  );
}

function value(
  dialog:
    HTMLDialogElement,
  selector: string,
  fallback: number,
): number {
  const number =
    Number(
      dialog
        .querySelector<HTMLInputElement>(
          selector,
        )
        ?.value,
    );

  return Number.isFinite(
    number,
  )
    ? number
    : fallback;
}

function bg(
  dialog:
    HTMLDialogElement,
): string | null {
  const mode =
    dialog
      .querySelector<HTMLSelectElement>(
        "[data-media-background]",
      )
      ?.value ??
    "black";

  if (
    mode ===
    "transparent"
  ) {
    return null;
  }

  if (
    mode ===
    "black"
  ) {
    return "#000000";
  }

  return (
    dialog
      .querySelector<HTMLInputElement>(
        "[data-media-color]",
      )
      ?.value ??
    "#080b12"
  );
}

function setStatus(
  dialog:
    HTMLDialogElement,
  text: string,
  progress = 0,
): void {
  const label =
    dialog
      .querySelector<HTMLElement>(
        "[data-media-status]",
      );

  if (label) {
    label.textContent =
      text;
  }

  const bar =
    dialog
      .querySelector<HTMLProgressElement>(
        "[data-media-progress]",
      );

  if (bar) {
    bar.value =
      Math.max(
        0,
        Math.min(
          100,
          progress,
        ),
      );
  }
}

function setBatchStatus(
  dialog:
    HTMLDialogElement,
  text: string,
  progress = 0,
): void {
  const label =
    dialog
      .querySelector<HTMLElement>(
        "[data-batch-status]",
      );

  if (label) {
    label.textContent =
      text;
  }

  const bar =
    dialog
      .querySelector<HTMLProgressElement>(
        "[data-batch-progress]",
      );

  if (bar) {
    bar.value =
      Math.max(
        0,
        Math.min(
          100,
          progress,
        ),
      );
  }
}

function download(
  blob: Blob,
  name: string,
): void {
  const url =
    URL.createObjectURL(
      blob,
    );

  const anchor =
    document.createElement(
      "a",
    );

  anchor.href =
    url;

  anchor.download =
    name;

  anchor.click();

  setTimeout(
    () =>
      URL.revokeObjectURL(
        url,
      ),
    1500,
  );
}

async function encodeGif(
  state: SceneState,
  width: number,
  height: number,
  seconds: number,
  fps: number,
  colors: number,
  background:
    string | null,
  isAborted:
    () => boolean,
  onProgress:
    (
      frame: number,
      total: number,
    ) => void,
): Promise<Blob | null> {
  const total =
    Math.max(
      1,
      Math.round(
        seconds *
        fps,
      ),
    );

  const delay =
    Math.round(
      1000 /
      fps,
    );

  const frame =
    await createFrame(
      state,
      width,
      height,
      background,
    );

  const encoder =
    GIFEncoder();

  try {
    for (
      let index = 0;
      index < total;
      index++
    ) {
      if (
        isAborted()
      ) {
        return null;
      }

      const canvas =
        await capture(
          frame,
          width,
          height,
          index *
            (1000 / fps),
          background,
        );

      const context =
        canvas.getContext(
          "2d",
          {
            willReadFrequently:
              true,
          },
        );

      if (!context) {
        throw new Error(
          "Brak Canvas 2D.",
        );
      }

      const rgba =
        context.getImageData(
          0,
          0,
          width,
          height,
        ).data;

      const palette =
        quantize(
          rgba,
          colors,
          {
            format:
              "rgb565",
          },
        );

      const indexed =
        applyPalette(
          rgba,
          palette,
          "rgb565",
        );

      encoder.writeFrame(
        indexed,
        width,
        height,
        {
          palette,
          delay,
          repeat: 0,
        },
      );

      onProgress(
        index + 1,
        total,
      );

      await new Promise<void>(
        (resolve) =>
          setTimeout(
            resolve,
            0,
          ),
      );
    }

    encoder.finish();

    return new Blob(
      [
        encoder.bytes(),
      ],
      {
        type:
          "image/gif",
      },
    );
  } finally {
    frame.iframe.remove();
  }
}

async function exportPng(
  dialog:
    HTMLDialogElement,
): Promise<void> {
  const width =
    Math.round(
      value(
        dialog,
        "[data-media-width]",
        1920,
      ),
    );

  const height =
    Math.round(
      value(
        dialog,
        "[data-media-height]",
        1080,
      ),
    );

  const time =
    value(
      dialog,
      "[data-png-time]",
      0,
    ) *
    1000;

  const background =
    bg(
      dialog,
    );

  setStatus(
    dialog,
    "Renderowanie PNG...",
    20,
  );

  const frame =
    await createFrame(
      getEditorState(),
      width,
      height,
      background,
    );

  try {
    const canvas =
      await capture(
        frame,
        width,
        height,
        time,
        background,
      );

    const blob =
      await new Promise<Blob>(
        (
          resolve,
          reject,
        ) =>
          canvas.toBlob(
            (result) =>
              result
                ? resolve(
                    result,
                  )
                : reject(
                    new Error(
                      "Nie udaĹ‚o siÄ™ zakodowaÄ‡ PNG.",
                    ),
                  ),
            "image/png",
          ),
      );

    download(
      blob,
      `animated-effects-${width}x${height}.png`,
    );

    setStatus(
      dialog,
      `PNG gotowy Â· ${(blob.size / 1024 / 1024).toFixed(1)} MB`,
      100,
    );
  } finally {
    frame.iframe.remove();
  }
}

async function exportGif(
  dialog:
    HTMLDialogElement,
): Promise<void> {
  abortGif =
    false;

  const width =
    Math.max(
      240,
      Math.min(
        1920,
        Math.round(
          value(
            dialog,
            "[data-media-width]",
            1280,
          ),
        ),
      ),
    );

  const height =
    Math.max(
      240,
      Math.min(
        1080,
        Math.round(
          value(
            dialog,
            "[data-media-height]",
            720,
          ),
        ),
      ),
    );

  const seconds =
    Math.max(
      .5,
      Math.min(
        30,
        value(
          dialog,
          "[data-gif-seconds]",
          5,
        ),
      ),
    );

  const fps =
    Math.max(
      5,
      Math.min(
        30,
        Math.round(
          value(
            dialog,
            "[data-gif-fps]",
            15,
          ),
        ),
      ),
    );

  const quality =
    dialog
      .querySelector<HTMLSelectElement>(
        "[data-gif-quality]",
      )
      ?.value ??
    "medium";

  const colors =
    quality ===
    "low"
      ? 96
      : quality ===
          "high"
        ? 256
        : 160;

  const background =
    bg(
      dialog,
    );

  const blob =
    await encodeGif(
      getEditorState(),
      width,
      height,
      seconds,
      fps,
      colors,
      background,
      () =>
        abortGif,
      (
        frame,
        total,
      ) => {
        setStatus(
          dialog,
          `GIF Â· klatka ${frame} / ${total}`,
          frame /
            total *
            100,
        );
      },
    );

  if (!blob) {
    setStatus(
      dialog,
      "Generowanie anulowane.",
      0,
    );

    return;
  }

  if (lastGifUrl) {
    URL.revokeObjectURL(
      lastGifUrl,
    );
  }

  lastGifUrl =
    URL.createObjectURL(
      blob,
    );

  const image =
    dialog
      .querySelector<HTMLImageElement>(
        "[data-gif-preview]",
      );

  if (image) {
    image.src =
      lastGifUrl;

    image.hidden =
      false;
  }

  const save =
    dialog
      .querySelector<HTMLAnchorElement>(
        "[data-gif-save]",
      );

  if (save) {
    save.href =
      lastGifUrl;

    save.download =
      `animated-effects-${width}x${height}-${fps}fps.gif`;

    save.hidden =
      false;
  }

  setStatus(
    dialog,
    `GIF gotowy Â· ${(blob.size / 1024 / 1024).toFixed(1)} MB`,
    100,
  );
}

function makeSingleEffectState(
  base:
    SceneState,
  effectId: string,
): SceneState {
  const definition =
    getAllEffectDefinitions()
      .find(
        (item) =>
          item.id ===
          effectId,
      );

  if (!definition) {
    throw new Error(
      `Nie znaleziono efektu: ${effectId}`,
    );
  }

  const state =
    structuredClone(
      base,
    );

  const instanceId =
    `batch-${effectId}`;

  state.effects = [
    {
      instanceId,
      effectId:
        definition.id,
      seed:
        stableSeed(
          definition.id,
        ),
      enabled:
        true,
      settings: {
        ...definition
          .defaultSettings,
      },
      label:
        definition.name,
      locked:
        false,
      groupId:
        null,
    },
  ];

  state.selectedEffectInstanceId =
    instanceId;

  state.activePresetId =
    null;

  return state;
}

async function exportAllGifs(
  dialog:
    HTMLDialogElement,
): Promise<void> {
  abortBatch =
    false;

  const width =
    Math.max(
      320,
      Math.min(
        1280,
        Math.round(
          value(
            dialog,
            "[data-batch-width]",
            640,
          ),
        ),
      ),
    );

  const height =
    Math.max(
      180,
      Math.min(
        720,
        Math.round(
          value(
            dialog,
            "[data-batch-height]",
            360,
          ),
        ),
      ),
    );

  const seconds =
    Math.max(
      1,
      Math.min(
        30,
        value(
          dialog,
          "[data-batch-seconds]",
          10,
        ),
      ),
    );

  const fps =
    Math.max(
      5,
      Math.min(
        20,
        Math.round(
          value(
            dialog,
            "[data-batch-fps]",
            12,
          ),
        ),
      ),
    );

  const quality =
    dialog
      .querySelector<HTMLSelectElement>(
        "[data-batch-quality]",
      )
      ?.value ??
    "medium";

  const colors =
    quality ===
    "low"
      ? 80
      : quality ===
          "high"
        ? 192
        : 128;

  const category =
    dialog
      .querySelector<HTMLSelectElement>(
        "[data-batch-category]",
      )
      ?.value ??
    "all";

  const definitions =
    getAllEffectDefinitions()
      .filter(
        (definition) =>
          category ===
            "all" ||
          definition.category ===
            category,
      );

  if (
    definitions.length ===
    0
  ) {
    setBatchStatus(
      dialog,
      "Brak efektĂłw dla wybranego filtra.",
      0,
    );

    return;
  }

  const startButton =
    dialog
      .querySelector<HTMLButtonElement>(
        "[data-batch-gif]",
      );

  const cancelButton =
    dialog
      .querySelector<HTMLButtonElement>(
        "[data-cancel-batch]",
      );

  if (startButton) {
    startButton.disabled =
      true;
  }

  if (cancelButton) {
    cancelButton.hidden =
      false;
  }

  const zip =
    new JSZip();

  const baseState =
    getEditorState();

  const background =
    bg(
      dialog,
    );

  const manifest:
    Array<{
      id: string;
      name: string;
      seed: number;
    }> = [];

  try {
    for (
      let effectIndex = 0;
      effectIndex <
        definitions.length;
      effectIndex++
    ) {
      if (
        abortBatch
      ) {
        setBatchStatus(
          dialog,
          "Batch anulowany.",
          0,
        );

        return;
      }

      const definition =
        definitions[
          effectIndex
        ];

      const state =
        makeSingleEffectState(
          baseState,
          definition.id,
        );

      const effectBase =
        effectIndex /
        definitions.length;

      const effectShare =
        1 /
        definitions.length;

      setBatchStatus(
        dialog,
        `GIF ${effectIndex + 1} / ${definitions.length} Â· ${definition.name}`,
        effectBase *
          94,
      );

      const blob =
        await encodeGif(
          state,
          width,
          height,
          seconds,
          fps,
          colors,
          background,
          () =>
            abortBatch,
          (
            frame,
            total,
          ) => {
            const within =
              frame /
              total;

            setBatchStatus(
              dialog,
              `${definition.name} Â· klatka ${frame} / ${total}`,
              (
                effectBase +
                effectShare *
                  within
              ) *
                94,
            );
          },
        );

      if (!blob) {
        setBatchStatus(
          dialog,
          "Batch anulowany.",
          0,
        );

        return;
      }

      const name =
        safeFileName(
          definition.id,
        );

      zip.file(
        `${name}.gif`,
        blob,
      );

      manifest.push(
        {
          id:
            definition.id,
          name:
            definition.name,
          seed:
            stableSeed(
              definition.id,
            ),
        },
      );

      await new Promise<void>(
        (resolve) =>
          setTimeout(
            resolve,
            0,
          ),
      );
    }

    zip.file(
      "manifest.json",
      JSON.stringify(
        {
          generatedAt:
            new Date()
              .toISOString(),
          width,
          height,
          seconds,
          fps,
          category,
          effects:
            manifest,
        },
        null,
        2,
      ),
    );

    setBatchStatus(
      dialog,
      "Pakowanie ZIP...",
      95,
    );

    const archive =
      await zip.generateAsync(
        {
          type: "blob",
          compression:
            "STORE",
        },
        (metadata) => {
          setBatchStatus(
            dialog,
            `Pakowanie ZIP Â· ${Math.round(metadata.percent)}%`,
            95 +
              metadata.percent *
                .05,
          );
        },
      );

    download(
      archive,
      `animated-effects-batch-${width}x${height}-${seconds}s.zip`,
    );

    setBatchStatus(
      dialog,
      `Gotowe Â· ${definitions.length} GIF Â· ${(archive.size / 1024 / 1024).toFixed(1)} MB ZIP`,
      100,
    );
  } finally {
    if (startButton) {
      startButton.disabled =
        false;
    }

    if (cancelButton) {
      cancelButton.hidden =
        true;
    }
  }
}

function createDialog():
  HTMLDialogElement {
  const definitions =
    getAllEffectDefinitions();

  const categories =
    [
      ...new Set(
        definitions.map(
          (definition) =>
            definition.category,
        ),
      ),
    ].sort();

  const dialog =
    document.createElement(
      "dialog",
    );

  dialog.className =
    "export-dialog ae-media-dialog";

  dialog.innerHTML =
    `<div class="export-header"><div><strong>PNG / GIF</strong><span>Render sceny bez interfejsu edytora</span></div><button type="button" data-media-close>Ă—</button></div>
  <div class="ae-media-export">
    <div class="ae-media-grid">
      <label>SzerokoĹ›Ä‡<input type="number" min="240" max="1920" value="1280" data-media-width></label>
      <label>WysokoĹ›Ä‡<input type="number" min="240" max="1080" value="720" data-media-height></label>
      <label>TĹ‚o<select data-media-background><option value="black">Czarne</option><option value="custom">WĹ‚asny kolor</option><option value="transparent">Przezroczyste</option></select></label>
      <label>Kolor<input type="color" value="#080b12" data-media-color></label>
    </div>

    <section class="ae-media-section">
      <h3>PNG</h3>
      <label>Czas animacji (s)<input type="number" min="0" max="30" step=".1" value="0" data-png-time></label>
      <button class="ae-button ae-button-primary" type="button" data-generate-png>Generuj PNG</button>
    </section>

    <section class="ae-media-section">
      <h3>GIF</h3>
      <div class="ae-media-grid">
        <label>DĹ‚ugoĹ›Ä‡ (s)<input type="number" min=".5" max="30" step=".5" value="5" data-gif-seconds></label>
        <label>FPS<input type="number" min="5" max="30" value="15" data-gif-fps></label>
        <label>JakoĹ›Ä‡<select data-gif-quality><option value="low">Niska</option><option value="medium" selected>Ĺšrednia</option><option value="high">Wysoka</option></select></label>
      </div>
      <div class="ae-media-actions">
        <button class="ae-button ae-button-primary" type="button" data-generate-gif>Generuj GIF</button>
        <button class="ae-button ae-button-secondary" type="button" data-cancel-gif>Anuluj</button>
        <a class="ae-button ae-button-secondary" data-gif-save hidden>Zapisz GIF</a>
      </div>
      <progress max="100" value="0" data-media-progress></progress>
      <div data-media-status>Gotowe do generowania.</div>
      <img class="ae-gif-preview" data-gif-preview alt="PodglÄ…d GIF" hidden>
    </section>

    <section class="ae-media-section ae-batch-export">
      <h3>Batch GIF Â· wszystkie efekty</h3>
      <p class="ae-batch-note">
        KaĹĽdy efekt jest renderowany osobno na czystej scenie ze staĹ‚ym seedem i trafia do jednego ZIP-a.
        DomyĹ›lnie 10 s Â· 640Ă—360 Â· 12 FPS. Przy caĹ‚ej bibliotece operacja moĹĽe potrwaÄ‡ dĹ‚ugo.
      </p>

      <div class="ae-media-grid">
        <label>SzerokoĹ›Ä‡<input type="number" min="320" max="1280" value="640" data-batch-width></label>
        <label>WysokoĹ›Ä‡<input type="number" min="180" max="720" value="360" data-batch-height></label>
        <label>DĹ‚ugoĹ›Ä‡ GIF (s)<input type="number" min="1" max="30" step="1" value="10" data-batch-seconds></label>
        <label>FPS<input type="number" min="5" max="20" value="12" data-batch-fps></label>
        <label>JakoĹ›Ä‡<select data-batch-quality><option value="low">Niska / szybciej</option><option value="medium" selected>Ĺšrednia</option><option value="high">Wysoka / wolniej</option></select></label>
        <label>Zakres<select data-batch-category><option value="all">Wszystkie efekty</option>${categories.map((category) => `<option value="${category}">${category}</option>`).join("")}</select></label>
      </div>

      <div class="ae-media-actions">
        <button class="ae-button ae-button-primary" type="button" data-batch-gif>Generuj wszystkie do ZIP</button>
        <button class="ae-button ae-button-secondary" type="button" data-cancel-batch hidden>Anuluj batch</button>
      </div>

      <progress max="100" value="0" data-batch-progress></progress>
      <div data-batch-status>Gotowe Â· ${definitions.length} efektĂłw dostÄ™pnych.</div>
    </section>
  </div>`;

  dialog
    .querySelector(
      "[data-media-close]",
    )
    ?.addEventListener(
      "click",
      () =>
        dialog.close(),
    );

  dialog
    .querySelector(
      "[data-cancel-gif]",
    )
    ?.addEventListener(
      "click",
      () => {
        abortGif =
          true;
      },
    );

  dialog
    .querySelector(
      "[data-cancel-batch]",
    )
    ?.addEventListener(
      "click",
      () => {
        abortBatch =
          true;
      },
    );

  dialog
    .querySelector(
      "[data-generate-png]",
    )
    ?.addEventListener(
      "click",
      () => {
        void exportPng(
          dialog,
        ).catch(
          (error: unknown) =>
            setStatus(
              dialog,
              error instanceof
                Error
                ? error.message
                : String(
                    error,
                  ),
              0,
            ),
        );
      },
    );

  dialog
    .querySelector(
      "[data-generate-gif]",
    )
    ?.addEventListener(
      "click",
      () => {
        void exportGif(
          dialog,
        ).catch(
          (error: unknown) =>
            setStatus(
              dialog,
              error instanceof
                Error
                ? error.message
                : String(
                    error,
                  ),
              0,
            ),
        );
      },
    );

  dialog
    .querySelector(
      "[data-batch-gif]",
    )
    ?.addEventListener(
      "click",
      () => {
        void exportAllGifs(
          dialog,
        ).catch(
          (error: unknown) =>
            setBatchStatus(
              dialog,
              error instanceof
                Error
                ? error.message
                : String(
                    error,
                  ),
              0,
            ),
        );
      },
    );

  document.body.appendChild(
    dialog,
  );

  return dialog;
}

export function openMediaExport():
  void {
  if (!dialogRef) {
    dialogRef =
      createDialog();
  }

  if (!dialogRef.open) {
    dialogRef.showModal();
  }
}
