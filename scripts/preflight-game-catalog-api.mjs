// Zero-write public API release probe. Never sends the admin token or POSTs.
import { pathToFileURL } from "node:url";

function required(env, key) {
  const value = env[key]?.trim();
  if (!value) throw new Error("Missing required setting: " + key);
  return value;
}

export function loadCatalogApiProbeConfig(env = process.env) {
  const urlText = required(env, "CATALOG_PREFLIGHT_API_BASE_URL");
  const expectedHost = required(env, "CATALOG_PREFLIGHT_EXPECTED_API_HOST").toLowerCase();
  let url;
  try {
    url = new URL(urlText);
  } catch {
    throw new Error("Invalid API base URL.");
  }
  if (url.protocol !== "https:" || url.username || url.password ||
      url.search || url.hash || (url.pathname !== "/" && url.pathname !== "")) {
    throw new Error("API preflight requires an HTTPS origin without path, credentials or query.");
  }
  if (url.hostname.toLowerCase() !== expectedHost) {
    throw new Error("API host does not match expected host.");
  }
  return Object.freeze({ baseUrl: url.origin, expectedHost });
}

export async function inspectCatalogApi(config, fetchImpl = fetch) {
  const requests = [
    ["/api/steam-catalog/games?page=1&pageSize=1", "games"],
    ["/api/steam-catalog/taxonomy", "taxonomy"],
    ["/api/steam-catalog/queue", "queue"],
  ];
  const checks = [];
  let counts = null;
  const check = (name, passed, reason) => checks.push({
    name, passed: Boolean(passed), ...(passed ? {} : { reason }),
  });
  for (const [path, key] of requests) {
    let response;
    try {
      response = await fetchImpl(config.baseUrl + path, {
        method: "GET", redirect: "error",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      check(key + "_reachable", false, "API request failed.");
      continue;
    }
    check(key + "_http", response.status === 200,
      "Expected HTTP 200 from public catalog endpoint.");
    if (response.status !== 200) continue;
    check(key + "_content_type",
      (response.headers?.get("content-type") ?? "").toLowerCase().includes("application/json"),
      "Expected JSON API response, not HTML or a hosting-provider placeholder.");
    if (!checks.at(-1).passed) continue;
    let result;
    try {
      result = await response.json();
    } catch {
      check(key + "_json", false, "Invalid JSON response.");
      continue;
    }
    if (!result || typeof result !== "object" || Array.isArray(result)) {
      check(key + "_shape", false, "JSON response is not an object.");
      continue;
    }
    if (key === "games") {
      const values = result.counts;
      const numbers = ["all", "unclassified", "review", "ready"]
        .map((name) => values?.[name]);
      const consistent = numbers.every((x) => Number.isSafeInteger(x) && x >= 0) &&
        numbers[0] === numbers[1] + numbers[2] + numbers[3];
      check("catalog_counts", consistent,
        "Global status counts are missing or inconsistent.");
      check("games_page_shape",
        Array.isArray(result.games) && Number.isSafeInteger(result.pagination?.total) &&
        result.pagination.total >= 0 && result.games.length <= 1,
        "Game listing/pagination shape is invalid.");
      if (consistent) counts = values;
    } else if (key === "taxonomy") {
      check("taxonomy_shape", Array.isArray(result.terms),
        "Taxonomy list is unavailable.");
    } else if (key === "queue") {
      check("queue_shape",
        Number.isSafeInteger(result.pendingCount) && result.pendingCount >= 0 &&
        (result.nextId === null ||
          (Number.isSafeInteger(result.nextId) && result.nextId > 0)),
        "Classification queue shape is invalid.");
      if (counts) check("queue_matches_counts",
        result.pendingCount === counts.unclassified + counts.review,
        "Pending queue count differs from global unclassified/review totals.");
    }
  }
  return { passed: checks.length >= 10 && checks.every((x) => x.passed),
    counts, checks };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const report = await inspectCatalogApi(loadCatalogApiProbeConfig());
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    process.exitCode = report.passed ? 0 : 2;
  } catch (error) {
    const allowed = error instanceof Error &&
      /^(Missing required setting:|Invalid API base URL|API preflight|API host)/.test(error.message);
    process.stderr.write("CATALOG_API_PREFLIGHT_FAILED: " +
      (allowed ? error.message : "Unable to inspect catalog API.") + "\n");
    process.exitCode = 1;
  }
}
