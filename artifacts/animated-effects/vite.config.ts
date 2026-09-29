import { defineConfig } from "vite";

export default defineConfig({
  // Do not pass the URL-like base through the Windows shell/MSYS layer.
  // A simple boolean flag selects the embedded path instead, so "/dev/..."
  // is created inside Node/Vite and cannot be rewritten to Program Files/Git.
  base:
    process.env.ANIMATED_EFFECTS_EMBEDDED === "1"
      ? "/stream/animated-effects/"
      : "/",
});
