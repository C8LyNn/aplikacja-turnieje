// Portfolio R13 (public/portfolio): structure, media allowlist and the compact hero rules.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const portfolio = path.resolve(import.meta.dirname, "../../public/portfolio");
const read = (file: string) => readFileSync(path.join(portfolio, file), "utf8");
const json = <T>(file: string) => JSON.parse(read(file)) as T;

type Localized = { pl: string; en: string };
type Image = { file: string; role: string; kind: string; title: Localized; caption: Localized; alt: Localized; source: Localized; page: number };
type Project = {
  slug: string; label: string; featuredImage: string; images: Image[];
  pl: { overview: string; playerLoop: string[]; caseStudy: Record<string, string> };
  en: { overview: string; playerLoop: string[]; caseStudy: Record<string, string> };
};
const content = json<{ intro: Record<"pl" | "en", { title: string }>; projects: Project[] }>("data/portfolio-content.json");
const release = json<{ approvedImages: string[]; publishedVideos: Array<{ file: string; project: string }> }>("data/media-release.json");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [path.relative(portfolio, full).split(path.sep).join("/")];
  });
}

test("R13 has exactly the six documented projects, each complete in PL and EN", () => {
  assert.deepEqual(content.projects.map((p) => p.slug),
    ["warehousecoop", "cuckoo-clock", "roborougelike", "core-clash", "tournament-manager", "strona-portal"]);
  for (const p of content.projects) {
    for (const lang of ["pl", "en"] as const) {
      assert.ok(p[lang].overview.length > 20, `${p.slug} ${lang} overview`);
      assert.equal(p[lang].playerLoop.length, 3, `${p.slug} ${lang} loop`);
      for (const key of ["problem", "decision", "playerImpact", "existingEvidence", "limitation"]) {
        assert.ok(p[lang].caseStudy[key], `${p.slug} ${lang} ${key}`);
      }
    }
    assert.ok(p.images.some((i) => i.role === "hero") && p.images.some((i) => i.role === "evidence"), p.slug);
    for (const i of p.images) {
      for (const field of [i.alt, i.title, i.caption, i.source]) assert.ok(field.pl && field.en, `${p.slug} ${i.file}`);
    }
  }
  assert.equal(content.intro.pl.title, "Game Designer / Systems Designer");
  assert.equal(content.intro.en.title, "Game Designer / Systems Designer");
});

test("only allowlisted frames are published; nothing private or embedded ships", () => {
  const files = walk(portfolio);
  const referenced = new Set(content.projects.flatMap((p) => p.images.map((i) => i.file)));
  const publicAssets = files.filter((f) => f.startsWith("assets/") && !["assets/cv-jakub-powierski.pdf", "assets/favicon.svg"].includes(f));
  for (const asset of publicAssets) {
    assert.ok(release.approvedImages.includes(asset.slice("assets/".length)), `${asset} is public but not in media-release.json`);
  }
  for (const approved of release.approvedImages) {
    assert.ok(referenced.has(approved), `${approved} is approved but unused`);
    assert.ok(existsSync(path.join(portfolio, "assets", approved)), `${approved} is approved but missing`);
  }
  for (const video of release.publishedVideos) assert.ok(existsSync(path.join(portfolio, "media", video.file)), video.file);
  assert.deepEqual(files.filter((f) => f.endsWith(".pdf")), ["assets/cv-jakub-powierski.pdf"]);
  assert.ok(!files.some((f) => /^(sources|docs|incoming|tools)\//.test(f) || /Podglad|Jeden_Plik|__author/i.test(f)), files.join(", "));
  for (const file of ["app.js", "styles.css", "index.html", "data/portfolio-content.json"]) {
    assert.doesNotMatch(read(file), /data:image\/|;base64,/, `${file} embeds media`);
  }
});

test("the opening stays compact: H1 at most 44px, 31px on phones, no slogan hero", () => {
  const css = read("styles.css");
  const sizes = [...css.matchAll(/\.hero h1 \{[^}]*font-size: ([^;]+);/g)].map((m) => m[1]);
  assert.ok(sizes.length >= 3, sizes.join());
  for (const size of sizes) {
    const pixels = [...size.matchAll(/(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1]));
    assert.ok(pixels.length && Math.max(...pixels) <= 44, size);
  }
  assert.match(css, /\.hero h1 \{ font-size: 31px;/);
  assert.doesNotMatch(css + read("app.js"), /75px|large-number|hero-meta/);
});

test("old portfolio addresses forward to the matching R13 routes", () => {
  const slugs = new Set(content.projects.map((p) => p.slug));
  const stubs = walk(portfolio).filter((f) => f.endsWith(".html") && f !== "index.html");
  assert.equal(stubs.length, 18);
  for (const stub of stubs) {
    const target = /location\.replace\("\/portfolio\/#\/pl\/([a-z-]*)"\)/.exec(read(stub));
    assert.ok(target, `${stub} has no redirect`);
    assert.ok(target[1] === "" || slugs.has(target[1]), `${stub} -> ${target[1]}`);
  }
  assert.match(read("projects/core-clash.html"), /#\/pl\/core-clash"/);
  assert.match(read("projects/warehouse-coop.html"), /#\/pl\/warehousecoop"/);
});
