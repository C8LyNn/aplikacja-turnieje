import { createRoot } from "react-dom/client";
import App from "./App";
import { LanguageProvider } from "./i18n/react";
import "./index.css";
import "./components/tool-ui.css";

// #323-E: the language provider re-renders the app in place on a language switch (state is kept).
createRoot(document.getElementById("root")!).render(<LanguageProvider render={() => <App />} />);
