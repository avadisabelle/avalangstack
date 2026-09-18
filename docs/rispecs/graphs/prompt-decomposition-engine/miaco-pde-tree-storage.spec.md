# SPEC - Graph Storage Contract for miaco PDE Trees

> Package: `ava-langgraph-prompt-decomposition-engine`
> Upstream primitive: `ava-langchain-prompt-decomposition`
> Status: implemented in package source

`mia-code` and AvaStack remain separate implementation lineages. This contract
adopts portable PDE tree concepts without coupling the LangGraph package to a
miaco CLI or treating either package family as the source of the other.

## Desired Outcome

Graph-orchestrated prompt decomposition can persist its result into the same lineage-aware PDE tree contract used by miaco-derived workflows. The graph remains usable without a LangGraph runtime and without directly coupling to miaco CLI execution.

## Current Reality

`DecompositionGraph` already runs EAST -> SOUTH -> WEST -> NORTH and can persist a decomposition when `workdir` is provided. Before this upgrade, storage was passed as a two-argument `saveDecomposition(workdir, result)` call and therefore could not request tree layout, parent lineage, child kind, add dirs, provider metadata, or fallback evidence.

## Specification

### Public Options

WHEN a caller constructs `new DecompositionGraph({ workdir, storage })`
THE SYSTEM SHALL pass `storage` through to `ava-langchain-prompt-decomposition.saveDecomposition()`.

WHEN `storage.layout` is `"tree"`
THE SYSTEM SHALL request folder-backed `.pde/<timestamp>--<uuid>/` storage from the chain package.

WHEN `storage.sessionId` is absent
THE SYSTEM SHALL use the graph state's `sessionId` as the storage session and mark it as `manual` unless a caller supplies another `sessionIdSource`.

WHEN `enforceCeremony` is true
THE SYSTEM SHALL halt at `ceremony_hold` before NORTH action stack construction.

WHEN legacy callers use the misspelled `enforeCeremony`
THE SYSTEM SHALL continue honoring it for compatibility.

WHEN `strategy.enabled` is true
THE SYSTEM SHALL use the upstream strategic decomposition API and expose a versioned `decompositionWithProvenance` handoff.

WHEN the upstream strategic API is unavailable
THE SYSTEM SHALL retain legacy compatibility and report a clear strategy error in graph state.

### Storage Payload

The graph storage options may carry:

- `layout`
- `engine`
- `model`
- `sessionId`
- `sessionIdSource`
- `parentPdeId`
- `parentPdeFolder`
- `childKind`
- `provenance`
- `addDirs`
- `pvaProvider`
- `pvaThinking`
- `hermesProvider`
- `fallback`

## Acceptance

- Existing graph tests continue to pass.
- Correct `enforceCeremony` spelling is tested.
- Legacy `enforeCeremony` remains accepted.
- The dynamic storage import remains tolerant of older chain package builds, while newer chain builds receive the lineage options.
- Strategy metadata, diagnostics, complexity signals, and multi-pass disagreements survive graph orchestration and storage.

## Export

The package exports `DecompositionGraphStorageOptions` from both the root entrypoint and `./graphs`.
