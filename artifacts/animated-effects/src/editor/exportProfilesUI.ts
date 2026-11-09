import {
  MAX_PROFILE_BYTES,
  MAX_SAVED_PROFILES,
  loadStreamElementsProfiles,
  parseStreamElementsProfile,
  saveStreamElementsProfiles,
  type StreamElementsProfile,
} from "../export/streamElementsProfiles";

export interface ProfileUiCallbacks {
  capture: (name: string) => StreamElementsProfile;
  apply: (profile: StreamElementsProfile) => void;
}

function selectItem<T extends HTMLElement>(dialog: HTMLDialogElement, selector: string): T | null {
  return dialog.querySelector<T>(selector);
}

function profileName(name: string): string {
  return name.trim() || "Nowy zestaw animacji";
}

function withUniqueName(name: string, existing: readonly StreamElementsProfile[]): string {
  const names = new Set(existing.map((entry) => entry.name.toLocaleLowerCase("pl")));
  const base = name.slice(0, 64);
  if (!names.has(base.toLocaleLowerCase("pl"))) return base;
  for (let i = 2; i < 1000; i++) {
    const suffix = " (" + i + ")";
    const candidate = base.slice(0, 64 - suffix.length) + suffix;
    if (!names.has(candidate.toLocaleLowerCase("pl"))) return candidate;
  }
  throw new Error("Nie można utworzyć kolejnej unikalnej nazwy.");
}

function downloadProfile(profile: StreamElementsProfile): void {
  const filename = profile.name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "animated-effects";
  const file = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename + ".ae-profile.json";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function setupExportProfilesUI(dialog: HTMLDialogElement, callbacks: ProfileUiCallbacks): void {
  const nameInput = selectItem<HTMLInputElement>(dialog, "[data-profile-name]");
  const select = selectItem<HTMLSelectElement>(dialog, "[data-profile-select]");
  const save = selectItem<HTMLButtonElement>(dialog, "[data-profile-save]");
  const load = selectItem<HTMLButtonElement>(dialog, "[data-profile-load]");
  const remove = selectItem<HTMLButtonElement>(dialog, "[data-profile-delete]");
  const download = selectItem<HTMLButtonElement>(dialog, "[data-profile-export]");
  const importButton = selectItem<HTMLButtonElement>(dialog, "[data-profile-import]");
  const fileInput = selectItem<HTMLInputElement>(dialog, "[data-profile-file]");
  const status = selectItem<HTMLElement>(dialog, "[data-profile-status]");
  if (!nameInput || !select || !save || !load || !remove || !download ||
      !importButton || !fileInput || !status) return;

  const notify = (message: string, failed = false) => {
    status.textContent = message;
    status.dataset.error = String(failed);
  };
  const report = (error: unknown) =>
    notify(error instanceof Error ? error.message : "Nie udało się wykonać operacji.", true);
  const readLibrary = () => loadStreamElementsProfiles(window.localStorage);
  const writeLibrary = (entries: StreamElementsProfile[]) =>
    saveStreamElementsProfiles(window.localStorage, entries);
  const selected = (entries: readonly StreamElementsProfile[]): StreamElementsProfile | null => {
    const index = Number(select.value);
    return Number.isInteger(index) && select.value !== "" && index >= 0
      ? entries[index] ?? null
      : null;
  };
  const refresh = (preferredName?: string): StreamElementsProfile[] => {
    const entries = readLibrary();
    const currentName = preferredName ?? selected(entries)?.name ?? "";
    select.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Wybierz zapisany zestaw";
    select.appendChild(placeholder);
    entries.forEach((entry, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = entry.name + " · " + entry.scene.effects.length + " warstw";
      select.appendChild(option);
    });
    const index = entries.findIndex((entry) => entry.name === currentName);
    select.value = index < 0 ? "" : String(index);
    const hasSelected = index >= 0;
    load.disabled = !hasSelected;
    remove.disabled = !hasSelected;
    download.disabled = !hasSelected;
    save.disabled = entries.length >= MAX_SAVED_PROFILES;
    return entries;
  };
  const currentSelected = (): StreamElementsProfile | null => selected(readLibrary());

  select.addEventListener("change", () => {
    try {
      const item = currentSelected();
      load.disabled = remove.disabled = download.disabled = item === null;
      if (item) nameInput.value = item.name;
    } catch (error) { report(error); }
  });

  save.addEventListener("click", () => {
    try {
      const entries = readLibrary();
      if (entries.length >= MAX_SAVED_PROFILES) throw new Error("Limit: 16 zapisanych zestawów.");
      const name = withUniqueName(profileName(nameInput.value), entries);
      const profile = callbacks.capture(name);
      if (JSON.stringify(profile).length > MAX_PROFILE_BYTES) {
        throw new Error("Ten zestaw jest za duży do zapisania.");
      }
      writeLibrary([...entries, profile]);
      refresh(name);
      nameInput.value = name;
      notify("Zapisano zestaw „" + name + "” lokalnie w tej przeglądarce.");
    } catch (error) { report(error); }
  });

  load.addEventListener("click", () => {
    try {
      const profile = currentSelected();
      if (!profile) throw new Error("Wybierz zestaw do wczytania.");
      const shouldLoad = window.confirm(
        'Wczytać zestaw „' + profile.name + '”? Bieżąca scena i reguły zostaną zastąpione. ' +
        "Zmianę sceny można cofnąć przez Undo.",
      );
      if (!shouldLoad) return;
      callbacks.apply(profile);
      notify("Wczytano zestaw „" + profile.name + "”.");
    } catch (error) { report(error); }
  });

  remove.addEventListener("click", () => {
    try {
      const entries = readLibrary();
      const profile = selected(entries);
      if (!profile) throw new Error("Wybierz zestaw do usunięcia.");
      if (!window.confirm("Usunąć zapisany zestaw „" + profile.name + "”?")) return;
      writeLibrary(entries.filter((item) => item !== profile));
      refresh();
      notify("Usunięto zestaw z pamięci tej przeglądarki.");
    } catch (error) { report(error); }
  });

  download.addEventListener("click", () => {
    try {
      const profile = currentSelected();
      if (!profile) throw new Error("Wybierz zestaw do pobrania.");
      downloadProfile(profile);
      notify("Przygotowano plik JSON: " + profile.name + ".");
    } catch (error) { report(error); }
  });

  importButton.addEventListener("click", () => { fileInput.click(); });
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (!file) return;
    try {
      if (file.size > MAX_PROFILE_BYTES) throw new Error("Plik przekracza limit 1 MB.");
      const imported = parseStreamElementsProfile(await file.text());
      const entries = readLibrary();
      if (entries.length >= MAX_SAVED_PROFILES) throw new Error("Limit: 16 zapisanych zestawów.");
      const name = withUniqueName(imported.name, entries);
      writeLibrary([...entries, { ...imported, name }]);
      refresh(name);
      notify("Zaimportowano „" + name + "” do biblioteki. Kliknij Wczytaj, aby zmienić scenę.");
    } catch (error) { report(error); }
  });

  try {
    const entries = refresh();
    notify("Zapis lokalny: " + entries.length + "/" + MAX_SAVED_PROFILES +
      " zestawów. Import JSON nie podmienia bieżącej sceny.");
  } catch (error) {
    report(error);
    save.disabled = load.disabled = remove.disabled = download.disabled = true;
  }
}
