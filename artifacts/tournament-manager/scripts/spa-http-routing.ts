import { createRequire } from "node:module";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { IncomingMessage } from "node:http";
import ts from "typescript";
import type { Plugin, PreviewServer, ViteDevServer } from "vite";

/** Read the actual JSX routes; do not maintain a second, narrower route list. */
export function readReactRoutePaths(appFile: string): string[] {
  const source = ts.createSourceFile(appFile, readFileSync(appFile, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const paths: string[] = [];
  function visit(node: ts.Node): void {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(source) === "Route") {
      for (const attribute of node.attributes.properties) {
        if (!ts.isJsxAttribute(attribute) || attribute.name.getText(source) !== "path") continue;
        if (!attribute.initializer || !ts.isStringLiteral(attribute.initializer)) {
          throw new Error("HTTP route policy requires a literal Route path; update the route reader before using computed paths.");
        }
        paths.push(attribute.initializer.text);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (!paths.includes("/")) throw new Error("No root React route found; refusing an incomplete HTTP route policy.");
  return paths;
}

// Use Wouter's own installed parser, including its case/trailing-slash semantics.
const require = createRequire(import.meta.url);
const { parse } = createRequire(require.resolve("wouter"))("regexparam") as {
  parse: (route: string) => { pattern: RegExp };
};
const assetSuffix = /\.(?:[cm]?js|jsx|tsx?|css|wasm|data|unityweb|gz|br|map|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|ico|json|bin|bundle|mp[34]|ogg|wav|pdf)$/i;

function isFile(root: string, pathname: string): boolean {
  const filename = path.resolve(root, "." + decodeURIComponent(pathname));
  const relative = path.relative(root, filename);
  if (relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative) || filename.includes("\0")) return false;
  try {
    return statSync(filename).isFile();
  } catch (error) {
    if (["ENOENT", "ENOTDIR"].includes((error as NodeJS.ErrnoException).code ?? "")) return false;
    throw error;
  }
}

/**
 * Vite serves existing files first. The returned post-hook runs after Vite's
 * HTML fallback rewrite but before indexHtmlMiddleware. Keep the original URL
 * so a rewritten /index.html cannot conceal an unknown asset or route.
 * This does NOT change the external production static-host rewrite rules.
 */
export function spaHttpRouting(appFile: string): Plugin {
  let patterns = readReactRoutePaths(appFile).map(route => parse(route).pattern);
  function install(server: ViteDevServer | PreviewServer, preview: boolean) {
    const original = new WeakMap<IncomingMessage, string>();
    const publicRoot = preview ? path.resolve(server.config.root, server.config.build.outDir) : server.config.publicDir;
    server.middlewares.use((req, res, next) => {
      original.set(req, req.url ?? "/");
      // Preserve all actual standalone directory entrypoints, not just Portfolio.
      if (publicRoot && (req.method === "GET" || req.method === "HEAD")) {
        try {
          const url = new URL(req.url ?? "/", "http://routing.invalid");
          if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return next();
          // Sirv/Vite has no default MIME entry for Unity's binary .data files.
          // Set this only for existing public binaries; missing files remain 404.
          if (/\.(?:data|unityweb)$/i.test(url.pathname) && isFile(publicRoot, url.pathname)) {
            res.setHeader("Content-Type", "application/octet-stream");
          }
          const index = url.pathname.replace(/\/$/, "") + "/index.html";
          if (isFile(publicRoot, index)) req.url = index + url.search;
        } catch (error) {
          if (!(error instanceof URIError || error instanceof TypeError)) return next(error);
        }
      }
      next();
    });
    return () => server.middlewares.use((req, res, next) => {
      let pathname: string;
      try {
        pathname = decodeURI(new URL(original.get(req) ?? req.url ?? "/", "http://routing.invalid").pathname);
      } catch {
        res.statusCode = 400;
        res.end(req.method === "HEAD" ? undefined : "Invalid URL\n");
        return;
      }
      if (pathname === "/api" || pathname.startsWith("/api/")) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(req.method === "HEAD" ? undefined : JSON.stringify({ error: "API route not found", code: "API_NOT_FOUND" }));
        return;
      }
      if ((req.method === "GET" || req.method === "HEAD") && pathname.endsWith(".html") && isFile(server.config.root, pathname)) {
        next();
        return;
      }
      if ((req.method === "GET" || req.method === "HEAD") && !assetSuffix.test(pathname) && patterns.some(pattern => pattern.test(pathname))) {
        req.url = "/index.html" + new URL(original.get(req) ?? "/", "http://routing.invalid").search;
        next();
        return;
      }
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end(req.method === "HEAD" ? undefined : "Not Found\n");
    });
  }
  return {
    name: "spa-http-routing",
    configureServer: server => install(server, false),
    configurePreviewServer: server => install(server, true),
    handleHotUpdate({ file }) {
      if (file === appFile) patterns = readReactRoutePaths(appFile).map(route => parse(route).pattern);
    },
  };
}
