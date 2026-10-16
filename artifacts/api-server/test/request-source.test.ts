import assert from "node:assert/strict";
import { describe, test } from "node:test";
import express from "express";
import request from "supertest";
import { fingerprintRequestSource } from "../src/auth";
import { configureTrustProxy, getRequestSource } from "../src/http/request-source";

function probe(configured?: string) {
  const app = express();
  configureTrustProxy(app, { TRUSTED_PROXY_CIDRS: configured });
  app.get("/probe", (req, res) => {
    res.json({
      ip: req.ip,
      ips: req.ips,
      source: getRequestSource(req),
      protocol: req.protocol,
      hostname: req.hostname,
    });
  });
  return app;
}

function assertRejected(configured: string): void {
  assert.throws(
    () => configureTrustProxy(express(), { TRUSTED_PROXY_CIDRS: configured }),
    /TRUSTED_PROXY_CIDRS/,
    `must reject ${configured}`,
  );
}

describe("T031 trusted proxy configuration", () => {
  test("defaults to disabled trust when absent or blank", () => {
    for (const value of [undefined, "", "  "]) {
      const app = probe(value);
      assert.equal(app.get("trust proxy"), false);
    }
  });

  test("rejects excessively wide IPv4 and IPv6 prefixes", () => {
    for (const cidr of [
      "0.0.0.0/0", "0.0.0.0/1", "0.0.0.0/7",
      "::/0", "::/1", "::/15", "2001:db8::/8",
    ]) {
      assertRejected(cidr);
    }
  });

  test("rejects short IPv4-mapped IPv6 prefixes in every supported spelling", () => {
    for (const cidr of [
      "::ffff:10.0.0.0/8", "::ffff:a00:0/8",
      "0:0:0:0:0:ffff:10.0.0.0/8",
      "::ffff:0.0.0.0/96", "::ffff:0.0.0.0/97",
      "::ffff:10.0.0.0/103", "::ffff:a00:0/103",
    ]) {
      assertRejected(cidr);
    }
  });

  test("rejects malformed and empty CIDR list entries rather than silently dropping them", () => {
    for (const invalid of [
      "loopback,", ",loopback", "loopback,,127.0.0.1",
      "loopback,0.0.0.0/0", "not-a-proxy", "1.2.3.4/33",
      "::1/129", "127.0.0.1/-1", "127.0.0.1/24foo",
      "127.0.0.1/20/10",
    ]) {
      assertRejected(invalid);
    }
  });

  test("preserves loopback, explicit IPv4/IPv6 and correctly mapped networks", () => {
    for (const configured of [
      "loopback", "127.0.0.1", "127.0.0.1/32",
      "::1", "::1/128", "10.0.0.0/8",
      "2001:db8:1234::/48", "::ffff:10.0.0.0/104",
      "0:0:0:0:0:ffff:10.0.0.0/104",
      "loopback,127.0.0.1/32,::1/128",
    ]) {
      const app = probe(configured);
      assert.notEqual(app.get("trust proxy"), false, configured);
    }
  });

  test("ignores spoofed X-Forwarded-* when trust proxy is disabled", async () => {
    const app = probe();
    const a = await request(app).get("/probe");
    const b = await request(app).get("/probe")
      .set("X-Forwarded-For", "203.0.113.17")
      .set("X-Forwarded-Host", "attacker.example")
      .set("X-Forwarded-Proto", "https");
    assert.equal(a.status, 200);
    assert.equal(b.status, 200);
    assert.equal(b.body.ip, a.body.ip);
    assert.equal(b.body.source, a.body.source);
    assert.equal(b.body.ips.length, 0);
    assert.notEqual(b.body.hostname, "attacker.example");
    assert.equal(b.body.protocol, "http");
    assert.equal(
      fingerprintRequestSource(b.body.source),
      fingerprintRequestSource(a.body.source),
      "spoofed XFF must not rotate the credential limiter's source bucket",
    );
  });

  test("ignores spoofed forwarded addresses from a peer outside explicit CIDRs", async () => {
    const app = probe("192.0.2.41/32");
    const a = await request(app).get("/probe");
    const b = await request(app).get("/probe")
      .set("X-Forwarded-For", "198.51.100.19");
    assert.equal(a.status, 200);
    assert.equal(b.status, 200);
    assert.equal(b.body.ip, a.body.ip);
    assert.equal(b.body.source, a.body.source);
    assert.equal(b.body.ips.length, 0);
  });

  test("supports loopback reverse proxy and chooses the nearest untrusted XFF hop", async () => {
    const app = probe("loopback");
    const response = await request(app).get("/probe")
      .set("X-Forwarded-For", "198.51.100.3, 203.0.113.45");
    assert.equal(response.status, 200);
    assert.equal(response.body.ip, "203.0.113.45");
    assert.equal(response.body.source, "203.0.113.45");
    assert.deepEqual(response.body.ips, ["203.0.113.45"]);
  });

  test("retains fallback to socket peer then 'unknown'", () => {
    assert.equal(getRequestSource({
      ip: "",
      socket: { remoteAddress: "127.0.0.1" },
    } as never), "127.0.0.1");
    assert.equal(getRequestSource({
      ip: undefined,
      socket: { remoteAddress: undefined },
    } as never), "unknown");
  });
});
