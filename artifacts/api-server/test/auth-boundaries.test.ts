import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import express from "express";
import request from "supertest";
import { parsePositiveSafeIntegerRouteParam } from "../src/http/route-params";
import {
  configureTrustProxy,
  getRequestSource,
} from "../src/http/request-source";

describe("strict authentication route parameters", () => {
  test("accepts only a complete positive PostgreSQL integer id", () => {
    assert.equal(parsePositiveSafeIntegerRouteParam("123"), 123);
    assert.equal(
      parsePositiveSafeIntegerRouteParam("2147483647"),
      2_147_483_647,
    );
    for (const invalid of [
      "123abc",
      "1.5",
      "-1",
      "0",
      "",
      "2147483648",
      "9007199254740992",
      undefined,
      null,
    ]) {
      assert.equal(parsePositiveSafeIntegerRouteParam(invalid), null);
    }
  });
});

describe("host-view authorization hydration", () => {
  test("gates the first private query until sessionStorage tokens are synchronized", () => {
    const hookSource = readFileSync(
      new URL(
        "../../tournament-manager/src/hooks/use-tournament-auth.ts",
        import.meta.url,
      ),
      "utf8",
    );
    const hostSource = readFileSync(
      new URL(
        "../../tournament-manager/src/pages/tournament-host.tsx",
        import.meta.url,
      ),
      "utf8",
    );
    assert.match(hookSource, /setHydratedTournamentId\(tournamentId\)/);
    assert.match(
      hookSource,
      /hydratedTournamentId === tournamentId/,
    );
    assert.match(
      hostSource,
      /enabled:\s*!!id && isAuthHydrated/,
    );
    assert.ok(
      hostSource.indexOf("useSyncTournamentAuth(id)") <
        hostSource.indexOf("useGetTournament(id"),
      "token hydration hook must be registered before the first private query",
    );
  });

});

function sourceEchoApp(env: NodeJS.ProcessEnv) {
  const app = express();
  configureTrustProxy(app, env);
  app.get("/source", (req, res) => {
    res.json({ source: getRequestSource(req), ips: req.ips });
  });
  return app;
}

describe("request source behind explicitly trusted proxies", () => {
  test("ignores a forged X-Forwarded-For value by default", async () => {
    const response = await request(sourceEchoApp({}))
      .get("/source")
      .set("X-Forwarded-For", "203.0.113.11");
    assert.equal(response.status, 200);
    assert.notEqual(response.body.source, "203.0.113.11");
    assert.deepEqual(response.body.ips, []);
  });

  test("uses the client address forwarded by an explicitly trusted loopback proxy", async () => {
    const response = await request(
      sourceEchoApp({ TRUSTED_PROXY_CIDRS: "loopback" }),
    )
      .get("/source")
      .set("X-Forwarded-For", "203.0.113.12");
    assert.equal(response.status, 200);
    assert.equal(response.body.source, "203.0.113.12");
  });

  test("stops at the first untrusted hop in a forwarded chain", async () => {
    const response = await request(
      sourceEchoApp({ TRUSTED_PROXY_CIDRS: "loopback" }),
    )
      .get("/source")
      .set("X-Forwarded-For", "198.51.100.99, 203.0.113.13");
    assert.equal(response.status, 200);
    assert.equal(response.body.source, "203.0.113.13");
  });

  test("rejects broad or malformed proxy trust configuration", () => {
    for (const value of ["*", "true", "1", "not-a-cidr"]) {
      assert.throws(
        () => sourceEchoApp({ TRUSTED_PROXY_CIDRS: value }),
        /TRUSTED_PROXY_CIDRS/,
      );
    }
  });
});
