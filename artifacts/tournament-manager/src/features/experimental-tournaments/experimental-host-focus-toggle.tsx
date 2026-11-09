import { Focus, Minimize2 } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "tm_exp_host_focus_v1";
function readInitial(): boolean { try { return window.localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; } }
function isTypingTarget(target: EventTarget | null): boolean { const element = target as HTMLElement | null; if (!element) return false; if (element.isContentEditable) return true; return ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName); }

export function ExperimentalHostFocusToggle() {
  const [focused, setFocused] = useState<boolean>(() => readInitial());
  useEffect(() => { const root = document.documentElement; root.classList.toggle("experimental-host-focus", focused); try { window.localStorage.setItem(STORAGE_KEY, focused ? "1" : "0"); } catch {} return () => { root.classList.remove("experimental-host-focus"); }; }, [focused]);
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if (isTypingTarget(event.target)) return; if (event.key === "Escape" && focused) { event.preventDefault(); setFocused(false); return; } if (event.key.toLowerCase() === "f" && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); setFocused((value) => !value); } }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, [focused]);
  return <button type="button" aria-pressed={focused} onClick={() => setFocused((value) => !value)} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-background/45 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/35 hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" title={focused ? "Wyłącz tryb skupienia (F lub Escape)" : "Skup się na aktualnym meczu (F)"}>{focused ? <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Focus className="h-3.5 w-3.5" aria-hidden="true" />}{focused ? "Pełny panel" : "Focus"}</button>;
}
