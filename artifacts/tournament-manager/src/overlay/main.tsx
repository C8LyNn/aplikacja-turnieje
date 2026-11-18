import { createRoot } from "react-dom/client";
import { parseOverlayParams } from "@/lib/broadcast-overlay";
import { OverlayApp } from "./OverlayApp";
import "./overlay.css";

// V5.9 · OBS Browser Source entry. Separate from the organizer app: no router, no auth, no panels.
const config = parseOverlayParams(window.location.search);
document.documentElement.dataset.ovBg = config.background;
createRoot(document.getElementById("overlay-root")!).render(<OverlayApp config={config} />);
