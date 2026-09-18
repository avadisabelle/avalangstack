#!/usr/bin/env node
/**
 * Generate llms.txt and llms-full.txt for the whole stack.
 *
 *   llms.txt       one line per library: npm name, then its description
 *   llms-full.txt  every library's README, in build order, under its npm name
 *
 * Both land at the repository root (where an agent reading the repo finds them)
 * and in docs/public/ (where the site serves them at /llms.txt and /llms-full.txt).
 *
 * A library's description comes from its package.json `description`, and falls
 * back to the first sentence of its README when that field is absent.
 *
 * Usage:
 *   node scripts/generate-llms.mjs           write the four files
 *   node scripts/generate-llms.mjs --check   exit 1 if any file is stale
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const check = process.argv.includes("--check");

// Build order, the same one release.sh uses.
const LIBRARIES = [
  "chains/prompt-decomposition",
  "chains/relational-intelligence",
  "chains/narrative-tracing",
  "chains/inquiry-routing",
  "chains/state-machine-spec",
  "graphs/narrative-intelligence",
  "graphs/prompt-decomposition-engine",
  "graphs/inquiry-routing-engine",
];

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

/** First sentence of the README, skipping headings, badges and blank lines. */
function firstSentence(readme) {
  for (const line of readme.split("\n")) {
    const text = line.trim();
    if (!text || text.startsWith("#") || text.startsWith("[!") || text.startsWith("![")) continue;
    const sentence = text.split(/(?<=\.)\s/)[0];
    return sentence.replace(/\*\*/g, "");
  }
  return "";
}

const entries = LIBRARIES.map((dir) => {
  const pkg = readJson(join(root, dir, "package.json"));
  const readme = readFileSync(join(root, dir, "README.md"), "utf8");
  return {
    dir,
    family: dir.startsWith("chains/") ? "chain" : "graph",
    name: pkg.name,
    version: pkg.version,
    description: pkg.description?.trim() || firstSentence(readme),
    readme: readme.trimEnd(),
  };
});

const header = [
  "# AvaLangStack",
  "",
  "Chain primitives and the graph engines that compose them, for Ceremonial Technology Oriented Development.",
  "Source: https://github.com/avadisabelle/avalangstack — docs: https://avalangstack.sanctuaireagentique.com",
  "",
].join("\n");

const short = `${header}${["## Chains", ...entries.filter((e) => e.family === "chain").map((e) => `- ${e.name} (${e.version}): ${e.description}`), "", "## Graphs", ...entries.filter((e) => e.family === "graph").map((e) => `- ${e.name} (${e.version}): ${e.description}`), ""].join("\n")}`;

const full = `${header}${entries.map((e) => `\n---\n\n# ${e.name} (${e.version})\n\nFolder: ${e.dir}\n\n${e.readme}\n`).join("")}`;

const targets = [
  ["llms.txt", short],
  ["llms-full.txt", full],
  ["docs/public/llms.txt", short],
  ["docs/public/llms-full.txt", full],
];

let stale = 0;
for (const [relative, content] of targets) {
  const file = join(root, relative);
  if (check) {
    let current = "";
    try {
      current = readFileSync(file, "utf8");
    } catch {
      current = "";
    }
    if (current !== content) {
      console.log(`  stale ${relative}`);
      stale++;
    } else {
      console.log(`  ok    ${relative}`);
    }
    continue;
  }
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, content);
  console.log(`  wrote ${relative} (${content.length} bytes)`);
}

console.log(`\n${entries.length} libraries: ${entries.filter((e) => e.family === "chain").length} chains, ${entries.filter((e) => e.family === "graph").length} graphs`);
if (check && stale > 0) {
  console.log("Run: pnpm llms");
  process.exit(1);
}
