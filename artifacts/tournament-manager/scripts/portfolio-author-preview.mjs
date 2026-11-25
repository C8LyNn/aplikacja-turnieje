// Portfolio R13 — fills the git-ignored portfolio-private/ folder for the local author preview.
//
//   node scripts/portfolio-author-preview.mjs <path to the private Portfolio_R13_WWW folder>
//   PORTFOLIO_AUTHOR_PREVIEW=1 PORT=5173 pnpm run dev      ->  http://127.0.0.1:5173/portfolio/?podglad=autor
//
// Only frames referenced by public/portfolio/data/portfolio-content.json are copied. Nothing here is
// published: the folder is outside public/ and ignored by git. Public frames are listed in
// public/portfolio/data/media-release.json and copied to public/portfolio/assets/ by hand after approval.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = process.argv[2];
if (!source || !existsSync(path.join(source, "data", "portfolio_content_R12.json"))) {
  console.error("Usage: node scripts/portfolio-author-preview.mjs <Portfolio_R13_WWW folder>");
  process.exit(1);
}
const content = JSON.parse(readFileSync(path.join(packageRoot, "public/portfolio/data/portfolio-content.json"), "utf8"));
const r13 = JSON.parse(readFileSync(path.join(source, "data", "portfolio_content_R12.json"), "utf8"));
const target = path.join(packageRoot, "portfolio-private");
mkdirSync(path.join(target, "assets"), { recursive: true });

const review = { authorPreview: true, note: "Local author preview only. These frames are not cleared for publication.", images: {} };
const r13Images = new Map(r13.projects.flatMap((p) => p.images.map((i) => [path.basename(i.file), i])));
let copied = 0;
for (const project of content.projects) {
  for (const image of project.images) {
    const file = path.basename(image.file);
    const from = path.join(source, "assets", file);
    if (!existsSync(from)) { console.warn(`missing in package: ${file}`); continue; }
    copyFileSync(from, path.join(target, "assets", file));
    const meta = r13Images.get(file) ?? {};
    review.images[file] = { reviewStatus: meta.reviewStatus ?? "unknown", releaseReviewed: Boolean(meta.releaseReviewed), provenance: meta.provenance ?? null };
    copied++;
  }
}
writeFileSync(path.join(target, "review.json"), JSON.stringify(review, null, 1) + "\n");
console.log(`portfolio-private/: ${copied} frames + review.json (author preview only, never published)`);
