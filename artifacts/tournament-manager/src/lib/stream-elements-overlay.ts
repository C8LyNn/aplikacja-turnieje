/**
 * #324-L04 · the tournament overlay as a StreamElements Custom Widget. The widget only frames the same public
 * overlay page that OBS uses (one source of results, no second implementation): StreamElements renders widgets in a
 * browser, and the framed page polls the API from its own origin (no cross-origin requests, no SE account data, no
 * tokens). StreamElements has no tournament events, so the widget listens to none. A real test needs an SE account.
 */
export interface StreamElementsWidget {
  html: string;
  css: string;
  js: string;
  /** "Fields" tab: none are needed. */
  fields: string;
  /** Problems that make the widget not work inside StreamElements (shown before the code). */
  problems: string[];
}

const attr = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A URL is usable inside StreamElements only when it is public https without credentials in it. */
export function streamElementsProblems(url: string): string[] {
  let parsed: URL;
  try { parsed = new URL(url); } catch { return ["Nieprawidłowy adres nakładki."]; }
  const problems: string[] = [];
  if (parsed.protocol !== "https:") problems.push("StreamElements wczyta tylko adres https:// — skopiuj adres z opublikowanej aplikacji.");
  if (["localhost", "127.0.0.1", "[::1]", "::1"].includes(parsed.hostname)) problems.push("Adres lokalny (127.0.0.1 / localhost) nie zadziała w StreamElements — działa tylko na tym komputerze.");
  if ([...parsed.searchParams.keys()].some((key) => /token|pass|hasl|secret|key/i.test(key)) || parsed.username || parsed.password) {
    problems.push("Adres zawiera dane dostępu — nie używaj go w widgetach.");
  }
  return problems;
}

export function streamElementsOverlayWidget(url: string, size: { width: number; height: number }): StreamElementsWidget {
  return {
    html: `<!-- SWARM-006: nakładka turnieju (ten sam adres co w OBS); rozmiar widgetu ${size.width}×${size.height} -->\n<iframe id="swarm-overlay" src="${attr(url)}" title="Nakładka turnieju" scrolling="no" allowtransparency="true"></iframe>`,
    css: "html, body { margin: 0; padding: 0; background: transparent; overflow: hidden; }\n#swarm-overlay { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; background: transparent; }",
    js: "// Nakładka odświeża wyniki sama co kilka sekund. Widget nie potrzebuje kodu ani zdarzeń StreamElements.",
    fields: "{}",
    problems: streamElementsProblems(url),
  };
}
