import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
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
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
