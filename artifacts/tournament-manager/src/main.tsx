import { createRoot } from "react-dom/client";
import App from "./App";
import { setErrorDataTransformer, setSuccessDataTransformer } from "@workspace/api-client-react";
import { localizeErrorData, localizeServerTexts } from "./i18n";
import { LanguageProvider } from "./i18n/react";
import "./index.css";
import "./components/tool-ui.css";

// #323-E: API refusals arrive in Polish; every ApiError carries the message in the viewer's language.
setErrorDataTransformer(localizeErrorData);
// #323-E: texts the server writes for the organizer (assistant, operation previews, presets) in the viewer's language.
// Only these endpoints — participant lists, names and other user data are never touched.
const SERVER_TEXT_ENDPOINTS = /\/api\/tournaments\/(\d+\/(assistant|operations\/[\w-]+|stages\/\d+\/readiness)|presets(\/\w+)?|ai-config\/\w+)(\?|$)/;
setSuccessDataTransformer((url, data) => (SERVER_TEXT_ENDPOINTS.test(url) ? localizeServerTexts(data) : data));
// #323-E: the language provider re-renders the app in place on a language switch (state is kept).
createRoot(document.getElementById("root")!).render(<LanguageProvider render={() => <App />} />);
