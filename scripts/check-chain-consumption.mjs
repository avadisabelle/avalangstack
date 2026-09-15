#!/usr/bin/env node
/**
 * Graphs consume chains from this repo.
 *
 * For every package in graphs/, each ava-langchain-* name it lists (dependencies,
 * devDependencies, peerDependencies) must be installed as a link to the matching
 * folder in chains/, not as a copy from npm. When a chain's version moves past a
 * graph's range, pnpm quietly falls back to the registry; this check names it.
 *
 * Usage: node scripts/check-chain-consumption.mjs
 * Exit code 1 when any graph resolves a chain from outside chains/, or when
 * nothing was checked.
 */
import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = realpathSync(join(fileURLToPath(new URL(".", import.meta.url)), ".."));
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const packagesIn = (dir) =>
  readdirSync(join(root, dir), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(root, dir, entry.name, "package.json")))
    .map((entry) => join(root, dir, entry.name));

const chains = new Map(
  packagesIn("chains").map((dir) => [readJson(join(dir, "package.json")).name, realpathSync(dir)]),
);

let checked = 0;
let failures = 0;

for (const graphDir of packagesIn("graphs")) {
  const pkg = readJson(join(graphDir, "package.json"));
  const consumed = [
    ...new Set(
      ["dependencies", "devDependencies", "peerDependencies"]
        .flatMap((field) => Object.keys(pkg[field] ?? {}))
        .filter((name) => chains.has(name)),
    ),
  ].sort();

  if (consumed.length === 0) {
    console.log(`  --   ${pkg.name} consumes no chains`);
    continue;
  }

  for (const name of consumed) {
    checked++;
    const installed = join(graphDir, "node_modules", name);
    if (!existsSync(installed)) {
      console.log(`  FAIL ${pkg.name} -> ${name}: not installed (run pnpm install)`);
      failures++;
      continue;
    }
    const resolved = realpathSync(installed);
    if (resolved === chains.get(name)) {
      console.log(`  ok   ${pkg.name} -> ${name} (${relative(root, resolved)})`);
    } else {
      const local = readJson(join(chains.get(name), "package.json")).version;
      const range = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? pkg.peerDependencies?.[name];
      console.log(`  FAIL ${pkg.name} -> ${name} resolves outside chains/ (${resolved}); range ${range}, local ${local}`);
      failures++;
    }
  }
}

console.log(`\n${checked} chain links checked, ${failures} outside chains/`);
if (checked === 0 || failures > 0) process.exit(1);
