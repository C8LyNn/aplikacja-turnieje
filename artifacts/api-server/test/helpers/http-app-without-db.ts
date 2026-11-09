import assert from "node:assert/strict";
import type { RequestListener } from "node:http";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

/** Actual createApp chain, with data routes stubbed and DB/startup imports forbidden. */
export async function createHttpAppWithoutDatabase(): Promise<RequestListener> {
  const appFile = fileURLToPath(new URL("../../src/app.ts", import.meta.url));
  const compiled = await build({
    entryPoints: [appFile], bundle: true, write: false, platform: "node", format: "cjs",
    packages: "external",
    plugins: [{
      name: "no-database-http-fixture",
      setup(builder) {
        builder.onResolve({ filter: /^express$/, namespace: "fixture" }, () => ({ path: "express", external: true }));
        builder.onResolve({ filter: /^\.\/routes$/ }, args =>
          args.importer === appFile ? { path: "routes", namespace: "fixture" } : undefined);
        builder.onResolve({ filter: /^\.\/access-policy$/ }, args =>
          args.importer === appFile ? { path: "access", namespace: "fixture" } : undefined);
        builder.onResolve({ filter: /@workspace\/db|(?:^|\/)deployment-task/ }, () => {
          throw new Error("Database/startup import forbidden in routing HTTP test");
        });
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({
          contents: args.path === "routes"
            ? 'import {Router} from "express"; const r=Router(); r.get("/a30-existing",(_req,res)=>res.json({fixture:true})); export default r;'
            : "export class TournamentMutationAuthorizationError extends Error {}",
          loader: "js",
        }));
      },
    }],
  });
  const module = { exports: {} as { createApp?: () => RequestListener } };
  new Function("require", "module", "exports", compiled.outputFiles[0].text)(
    createRequire(appFile), module, module.exports,
  );
  assert.ok(module.exports.createApp);
  return module.exports.createApp();
}
