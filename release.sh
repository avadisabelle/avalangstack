#!/usr/bin/env bash
# Bump, build, test, and publish one AvaLangStack family at a shared version.
#
# Usage: ./release.sh <chain|graph> [patch|minor|major]   # bump defaults to patch
#
#   chain  the five ava-langchain-* packages, one version line (0.1.x)
#   graph  the three ava-langgraph-* packages, one version line (0.2.x)
#
# DRY_RUN=1   Build, test, and validate packages without changing or publishing.
# SKIP_BUMP=1 Resume a failed release using the versions already declared.
#
# The npm names did not change when the folders moved into @avalangstack/.
# They came from avadisabelle/ava-langchainjs and avadisabelle/ava-langgraphjs,
# whose release.sh scripts this one merges.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

FAMILY="${1:-}"
BUMP="${2:-patch}"
DRY_RUN="${DRY_RUN:-0}"
SKIP_BUMP="${SKIP_BUMP:-0}"
STEP=0

step() { STEP=$((STEP + 1)); printf '\n[%d] %s\n' "$STEP" "$1"; }
die() { printf '\nError: %s\n' "$1" >&2; exit 1; }
trap 'printf "\nRelease failed at step %s. Fix it and resume with SKIP_BUMP=1 ./release.sh %s.\n" "$STEP" "$FAMILY" >&2' ERR

case "$FAMILY" in
  chain)
    PACKAGES=(
      @avalangstack/prompt-decomposition
      @avalangstack/relational-intelligence
      @avalangstack/narrative-tracing
      @avalangstack/inquiry-routing
      @avalangstack/state-machine-spec
    )
    ;;
  graph)
    PACKAGES=(
      @avalangstack/narrative-intelligence
      @avalangstack/prompt-decomposition-engine
      @avalangstack/inquiry-routing-engine
    )
    ;;
  *) die "family must be chain or graph (got: ${FAMILY:-nothing})" ;;
esac

case "$BUMP" in
  patch|minor|major) ;;
  *) die "bump must be patch, minor, or major (got: $BUMP)" ;;
esac

step "Preflight ($FAMILY)"
[[ "$(node -p "require('./package.json').name")" == "@avadisabelle/avalangstack" ]] \
  || die "run this from the avalangstack repository"

if [[ "$DRY_RUN" == "1" ]]; then
  echo "DRY_RUN: nothing will be changed or published."
else
  npm whoami >/dev/null 2>&1 || die "not logged in to npm; run: npm login"
  echo "npm user: $(npm whoami)"
fi

if [[ "$SKIP_BUMP" == "1" ]]; then
  VERSION="$(node -p "require('./${PACKAGES[0]}/package.json').version")"
  for dir in "${PACKAGES[@]}"; do
    [[ "$(node -p "require('./$dir/package.json').version")" == "$VERSION" ]] \
      || die "SKIP_BUMP=1 requires every $FAMILY package to have the same version"
  done
  step "Use declared version $VERSION"
else
  VERSION="$(BUMP="$BUMP" node -e '
    const semver = require("semver");
    const versions = process.argv.slice(1).map((dir) => require(`./${dir}/package.json`).version);
    process.stdout.write(semver.inc(versions.sort(semver.rcompare)[0], process.env.BUMP));
  ' "${PACKAGES[@]}")"

  if [[ "$DRY_RUN" == "1" ]]; then
    step "Version preview: $VERSION"
  else
    step "Set every $FAMILY package version to $VERSION"
    node - "$VERSION" "${PACKAGES[@]}" <<'NODE'
const { readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");
const [version, ...dirs] = process.argv.slice(2);

for (const dir of dirs) {
  const file = join(dir, "package.json");
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  pkg.version = version;
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`  ${pkg.name}@${version}`);
}
NODE
  fi
fi

# Chain packages build against each other, not older copies installed from npm.
link_local() {
  local consumer="$1" name="$2" target="$3"
  local link="$consumer/node_modules/$name"
  mkdir -p "$(dirname "$link")"
  ln -sfn "$ROOT/$target" "$link"
}

step "Build all $FAMILY packages"
if [[ "$FAMILY" == "chain" ]]; then
  link_local @avalangstack/relational-intelligence ava-langchain-prompt-decomposition @avalangstack/prompt-decomposition
  link_local @avalangstack/narrative-tracing ava-langchain-prompt-decomposition @avalangstack/prompt-decomposition
  link_local @avalangstack/narrative-tracing ava-langchain-relational-intelligence @avalangstack/relational-intelligence
  link_local @avalangstack/inquiry-routing ava-langchain-prompt-decomposition @avalangstack/prompt-decomposition
fi

for dir in "${PACKAGES[@]}"; do
  rm -rf "$dir/dist"
  pnpm --dir "$dir" build
done

step "Test all $FAMILY packages"
for dir in "${PACKAGES[@]}"; do
  pnpm --dir "$dir" test
done

step "Verify package contents"
node scripts/check-dts.mjs "${PACKAGES[@]}"

step "Load built entry points"
for dir in "${PACKAGES[@]}"; do
  node --input-type=module -e '
    import { createRequire } from "node:module";
    import { pathToFileURL } from "node:url";
    const dir = process.argv[1];
    const require = createRequire(`${dir}/package.json`);
    const pkg = require("./package.json");
    const entry = pkg.exports?.["."] ?? {};
    await import(pathToFileURL(`${dir}/${entry.import ?? pkg.main}`).href);
    if (entry.require) require(`./${entry.require}`);
    console.log(`  ${pkg.name}: ${entry.require ? "ESM and CJS" : "ESM"} entry points load`);
  ' "$ROOT/$dir"
done

publish_package() {
  local dir="$1" name version
  name="$(node -p "require('./$dir/package.json').name")"
  version="$(node -p "require('./$dir/package.json').version")"

  if [[ "$DRY_RUN" == "1" ]]; then
    echo "  [dry-run] $name@$version"
    (cd "$dir" && npm publish --access public --dry-run >/dev/null)
  elif npm view "$name@$version" version >/dev/null 2>&1; then
    echo "  skip $name@$version (already published)"
  else
    echo "  publish $name@$version"
    (cd "$dir" && npm publish --access public)
  fi
}

step "Publish all $FAMILY packages"
for dir in "${PACKAGES[@]}"; do
  publish_package "$dir"
done

if [[ "$DRY_RUN" == "1" ]]; then
  step "Dry run complete"
else
  step "Commit and tag $FAMILY-v$VERSION"
  MANIFESTS=()
  for dir in "${PACKAGES[@]}"; do MANIFESTS+=("$dir/package.json"); done
  git add -- "${MANIFESTS[@]}"
  git diff --cached --quiet || git commit -m "chore($FAMILY): release v$VERSION"
  git rev-parse "refs/tags/$FAMILY-v$VERSION" >/dev/null 2>&1 \
    || git tag -a "$FAMILY-v$VERSION" -m "release $FAMILY v$VERSION"
  echo "Push with: git push origin main $FAMILY-v$VERSION"
fi

trap - ERR
printf '\nRelease complete: %s %s\n' "$FAMILY" "$VERSION"
