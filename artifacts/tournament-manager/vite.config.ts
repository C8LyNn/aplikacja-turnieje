import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { spaHttpRouting } from "./scripts/spa-http-routing";

function normalizeBasePath(
  rawValue: string | undefined,
  fallback = "/",
): string {
  let value =
    rawValue?.trim() ||
    fallback;

  value =
    value.replace(
      /\\/g,
      "/",
    );

  // Git for Windows / MSYS can rewrite "/foo/" into
  // "C:/Program Files/Git/foo/". Recover the intended URL path.
  value =
    value.replace(
      /^[A-Za-z]:\/Program Files\/Git(?=\/|$)/i,
      "",
    );

  if (!value) {
    value = "/";
  }

  if (!value.startsWith("/")) {
    value = "/" + value;
  }

  if (!value.endsWith("/")) {
    value += "/";
  }

  return value;
}

const rawPort = process.env.PORT;
const isBuildCommand = process.argv.includes("build");

if (!rawPort && !isBuildCommand) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = rawPort ? Number(rawPort) : 4173;

if (rawPort && (Number.isNaN(port) || port <= 0)) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = normalizeBasePath(process.env.BASE_PATH, "/");

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    spaHttpRouting(path.resolve(import.meta.dirname, "src/App.tsx")),
    {
      name: "portfolio-index",
      configureServer(server) {
        server.middlewares.use((request, _response, next) => {
          // Keep standalone HTML entrypoints ahead of the parent SPA fallback.
          if (request.url) {
            request.url = request.url.replace(
              /^\/portfolio(\/projects)?\/(?=\?|$)/,
              (_match, section = "") => `/portfolio${section}/index.html`,
            );
          }
          next();
        });
      },
    },
    {
      // Portfolio R13 author preview. Frames not yet cleared for publication stay in the git-ignored
      // portfolio-private/ folder (filled by scripts/portfolio-author-preview.mjs). Only this local dev
      // server serves them, only with PORTFOLIO_AUTHOR_PREVIEW=1 and only to loopback clients; they are
      // never in public/, so `vite build` cannot ship them.
      name: "portfolio-author-preview",
      apply: "serve",
      configureServer(server) {
        if (process.env.PORTFOLIO_AUTHOR_PREVIEW !== "1") return;
        const privateRoot = path.resolve(import.meta.dirname, "portfolio-private");
        const loopback = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
        server.middlewares.use((request, response, next) => {
          const match = /^\/portfolio\/__author\/([^?#]+)/.exec(request.url ?? "");
          if (!match) return next();
          let file = "";
          try {
            file = path.resolve(privateRoot, decodeURIComponent(match[1]));
          } catch {
            file = "";
          }
          const allowed = loopback.has(request.socket.remoteAddress ?? "") && file.startsWith(privateRoot + path.sep) &&
            fs.existsSync(file) && fs.statSync(file).isFile();
          if (!allowed) {
            response.statusCode = 404;
            response.end();
            return;
          }
          response.setHeader("Content-Type", file.endsWith(".json") ? "application/json" : file.endsWith(".webp") ? "image/webp" : "application/octet-stream");
          response.setHeader("Cache-Control", "no-store");
          fs.createReadStream(file).pipe(response);
        });
      },
    },
    {
      name: "animated-effects-index",
      configureServer(server) {
        server.middlewares.use((request, _response, next) => {
          if (request.url && /^\/stream\/animated-effects\/?(?:\?.*)?$/.test(request.url)) {
            request.url = request.url.replace(
              /^\/stream\/animated-effects\/?/,
              "/stream/animated-effects/index.html",
            );
          }
          next();
        });
      },
    },
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // V5.9 · the broadcast overlay is its own small entry: OBS never loads the organizer app.
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, "index.html"),
        overlay: path.resolve(import.meta.dirname, "overlay.html"),
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    // Keep relative /api requests on the backend, ahead of Vite's SPA fallback.
    // Override when the local API uses a different port from the workspace default.
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
    fs: {
      strict: true,
      // RC-6 (security): the dev server is reachable on the public DEV URL; never serve backups, agent notes or
      // archives from the workspace (Vite defaults kept first).
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/.local/**", "**/.agents/**", "*.dump", "*.bundle", "*.tar"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
