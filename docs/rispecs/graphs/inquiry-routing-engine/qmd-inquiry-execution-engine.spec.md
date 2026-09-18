# QMD Inquiry Execution Engine

> Status: Proposal
> Package: `ava-langgraph-inquiry-routing-engine`
> Proposed path: `libs/inquiry-routing-engine/src/qmd_*` or existing graph/node folders
> Upstream primitive proposal: `ava-langchain-inquiry-routing/docs/rispecs/inquiry-routing/qmd-inquiry-execution.spec.md`
> Inspired by: `mia-code/miaco` QMD command surface and `@miadisabelle/qmd`

## Desired Outcome

The graph package shall orchestrate QMD inquiry planning and execution as a
stateful graph layer downstream of `InquiryRoutingGraph`.

The result should be enough for a future implementation agent to add:

- a graph state that carries QMD query plans, provider metadata, results, and
  skipped inquiries
- a dry-run path that formats QMD plans without executing remote/local search
- an execution path through injected adapters or MCP-compatible provider calls
- miaco-compatible artifacts for `pde-qmd-queries.*` and
  `pde-inquiry-enrichment.md`
- a LangGraph-compatible subgraph that can sit after inquiry routing or inside
  a larger PDE -> inquiry -> QMD -> structural thinking pipeline

This is a proposal-only spec. It intentionally does not implement the slice.

## Current Reality

`ava-langgraph-inquiry-routing-engine` currently orchestrates:

1. EAST generate inquiries
2. SOUTH route inquiries
3. WEST validate relational accountability
4. NORTH format dispatch payloads

The NORTH payload can describe QMD dispatches, but the graph does not yet own a
QMD plan, provider resolution, execution state, result normalization, artifact
writing, or dry-run/execution boundary.

`miaco` already models the runtime flow operationally:

- `miaco continue --steps formulate-qmd-queries,qmd-inquiry-decompose,...`
  chains QMD steps inside a PDE tree.
- `miaco qmd-inquiry-decompose formulate` creates query artifacts.
- `miaco qmd-inquiry-decompose run` executes those artifacts through a chosen
  provider.
- `miaco qmd` supports `container`, `host`, `mcp-local`, and `mcp-remote`.

The graph engine should translate that CLI flow into explicit graph nodes.

## Five-Point Proposal

### 1. Add QMD Execution State Beside Inquiry Routing State

Reference inspiration:

- `/src/mia-code/miaco/src/commands/continue.ts`
  - step names: `formulate-qmd-queries`, `qmd-inquiry-decompose`
  - `--steps` chain semantics
- `/src/mia-code/miaco/src/pde-metadata.ts`
  - session and add-dir metadata persistence
- `/workspace/repos/avadisabelle/ava-langgraphjs/libs/inquiry-routing-engine/src/graphs/inquiry_routing_graph.ts`
  - current state-machine pattern

The graph package shall introduce a state object that wraps an existing
`InquiryRoutingState` or `RoutedInquiryBatch` and tracks QMD-specific work.

Proposed type:

```ts
export interface QmdInquiryExecutionState {
  sessionId: string;
  pdeId: string;
  inquiryState?: InquiryRoutingState;
  routedBatch: RoutedInquiryBatch | null;
  provider: QmdProviderDescriptor | null;
  plan: QmdInquiryPlan | null;
  executionResult: QmdInquiryExecutionResult | null;
  artifacts: QmdInquiryArtifacts | null;
  status:
    | "pending"
    | "planned"
    | "dry_run"
    | "executing"
    | "enriched"
    | "failed"
    | "ceremony_hold";
  errors: string[];
}

export interface QmdInquiryArtifacts {
  queriesJson: string;
  queriesMarkdown: string;
  enrichmentMarkdown?: string;
  enrichmentJson?: string;
}
```

Implementation should keep this state independent from prompt-decomposition
tree storage. File persistence, if added, should be an optional caller concern
or a separate artifact writer node.

### 2. Split Graph Nodes Into Plan, Validate, Execute, Synthesize

Reference inspiration:

- `/src/mia-code/miaco/src/commands/qmd-inquiry-decompose.ts`
  - `formulate` before `run`
  - query artifact presence changes run behavior
  - skipped ambiguities are preserved
- `/src/mia-code/miaco/src/commands/clarify.ts`
  - ambiguity handling before downstream execution
- `/workspace/repos/avadisabelle/ava-langgraphjs/libs/inquiry-routing-engine/src/graphs/inquiry_routing_graph.ts`
  - node-level error accumulation

The graph package shall add pure node functions first, then optionally wrap
them in a class and StateGraph factory.

Proposed node flow:

```text
PLAN_QMD -> VALIDATE_QMD -> EXECUTE_QMD_OR_DRY_RUN -> SYNTHESIZE_QMD
```

Proposed functions:

```ts
export function planQmdNode(state: QmdInquiryExecutionState): Partial<QmdInquiryExecutionState>;
export function validateQmdNode(state: QmdInquiryExecutionState): Partial<QmdInquiryExecutionState>;
export async function executeQmdNode(state: QmdInquiryExecutionState): Promise<Partial<QmdInquiryExecutionState>>;
export function synthesizeQmdNode(state: QmdInquiryExecutionState): Partial<QmdInquiryExecutionState>;
```

The planner should call chain primitives from `ava-langchain-inquiry-routing`.
The executor should use an injected adapter rather than spawning QMD internally.
The synthesizer should render artifacts through chain formatters.

### 3. Make Provider Execution Explicit And Injectable

Reference inspiration:

- `/src/mia-code/miaco/src/commands/qmd.ts`
  - `resolveQmdProvider()`
  - `qmdExec()`
  - `qmdMcpExec()`
  - `buildQmdMcpQueryArguments()`
- `/workspace/repos/miadisabelle/mia-qmd/etc/mcp-config-qmd-remote-eury.json`
  - stdio remote MCP server config
- `/workspace/repos/miadisabelle/mia-qmd/src/mcp-remote/proxy.ts`
  - SSH-stdio proxy and collection injection

The graph package may own runtime provider resolution because graph execution
is where environment, timeouts, and dry-run behavior become meaningful.

Proposed options:

```ts
export interface QmdInquiryExecutionGraphOptions {
  provider?: QmdProviderDescriptor;
  adapter?: QmdProviderAdapter;
  dryRun?: boolean;
  timeoutMs?: number;
  searchLimit?: number;
  minScore?: number;
  collections?: string[];
  enforceCeremony?: boolean;
}
```

Rules:

- If `dryRun` is true, no adapter is required and `executeQmdNode` shall not
  contact QMD.
- If `dryRun` is false, an adapter is required unless a later implementation
  adds a safe MCP client adapter.
- The default recommendation is remote MCP, not host-local indexing.
- The graph package shall not push `@miadisabelle/qmd` as a hard dependency
  unless the package Node engine baseline is raised to Node `>=22`.

### 4. Preserve Miaco-Compatible Artifacts Without Owning `.pde`

Reference inspiration:

- `/src/mia-code/miaco/src/commands/qmd-inquiry-decompose.ts`
  - writes `pde-qmd-queries.json`
  - writes `pde-qmd-queries.md`
  - writes `pde-inquiry-enrichment.md`
- `/src/mia-code/miaco/src/commands/pde-to-st.ts`
  - detects enrichment artifact and includes it downstream
- `/src/mia-code/miaco/src/commands/continue.ts`
  - chains QMD enrichment before structural thinking and STC

The graph package shall produce artifact strings in state. A separate optional
writer may persist them when a caller supplies a target folder.

Proposed optional writer:

```ts
export interface QmdArtifactWriteOptions {
  folder: string;
  overwrite?: boolean;
}

export class QmdInquiryArtifactWriter {
  write(artifacts: QmdInquiryArtifacts, options: QmdArtifactWriteOptions): Promise<QmdArtifactWriteResult>;
}
```

Artifact filenames should match miaco naming when persisted:

- `pde-qmd-queries.json`
- `pde-qmd-queries.md`
- `pde-inquiry-enrichment.md`
- optional `pde-inquiry-enrichment.json`

This preserves interoperability without making the graph package responsible
for finding or mutating PDE tree storage.

### 5. Provide A Composable Graph And A Standalone Orchestrator

Reference inspiration:

- `/workspace/repos/avadisabelle/ava-langgraphjs/libs/inquiry-routing-engine/src/graphs/state_graph_factory.ts`
  - dynamic LangGraph import
  - factory pattern
- `/workspace/repos/avadisabelle/ava-langgraphjs/libs/prompt-decomposition-engine/src/graphs/decomposition_graph.ts`
  - standalone class plus storage options
- `/src/mia-code/miaco/src/commands/continue.ts`
  - composable continuation chain

The implementation should expose both a no-runtime orchestrator class and a
LangGraph factory.

Proposed exports:

```ts
export class QmdInquiryExecutionGraph {
  constructor(options?: QmdInquiryExecutionGraphOptions);
  invoke(input: RoutedInquiryBatch | InquiryRoutingState): Promise<QmdInquiryExecutionState>;
  invokePlan(state: QmdInquiryExecutionState): Promise<QmdInquiryExecutionState>;
  invokeValidate(state: QmdInquiryExecutionState): Promise<QmdInquiryExecutionState>;
  invokeExecute(state: QmdInquiryExecutionState): Promise<QmdInquiryExecutionState>;
  invokeSynthesize(state: QmdInquiryExecutionState): Promise<QmdInquiryExecutionState>;
}

export function createQmdInquiryExecutionStateGraph(options?: QmdInquiryExecutionGraphOptions): unknown;
```

The StateGraph factory should be optional and dynamically import
`@langchain/langgraph`, matching existing package patterns.

## RISE Breakdown

### Reverse-Engineer

Reverse-engineer `miaco` as an orchestration model:

- `continue.ts` provides the step chain.
- `qmd-inquiry-decompose.ts` provides the formulation/run split and artifact
  naming.
- `qmd.ts` provides provider kinds and MCP argument shape.
- `pde-to-st.ts` proves QMD enrichment is meant to feed later structural
  thinking steps.
- `mia-qmd` MCP server/proxy proves remote read-only QMD is a valid runtime
  target.

### Intent-Extract

The intent is to make QMD enrichment a first-class graph stage, not just a CLI
side effect. A graph should be able to pause, dry-run, execute, enrich, and
handoff with inspectable state.

### Specify

Implementation should add:

- QMD state and options types
- pure node functions
- a standalone `QmdInquiryExecutionGraph`
- optional StateGraph factory
- optional artifact writer
- tests for dry-run, adapter execution, skipped inquiries, artifact output,
  and ceremony hold behavior

Suggested files:

- `src/graphs/qmd_inquiry_execution_graph.ts`
- `src/graphs/qmd_state_graph_factory.ts`
- `src/nodes/qmd_execution_nodes.ts`
- `src/nodes/qmd_artifact_writer.ts`
- exports from `src/graphs/index.ts`, `src/nodes/index.ts`, and `src/index.ts`

### Export

The graph package shall export QMD execution types and graph utilities from the
root path and relevant `./graphs` / `./nodes` export paths.

## Acceptance Criteria

- A `RoutedInquiryBatch` can be converted into `QmdInquiryExecutionState` and
  planned without a live QMD provider.
- Dry-run mode produces query JSON/Markdown artifacts and never calls an
  adapter.
- Execution mode calls an injected `QmdProviderAdapter`, normalizes results,
  and renders enrichment artifacts.
- Provider metadata and collections are visible in state and artifacts.
- Skipped inquiries are retained through the full graph.
- `enforceCeremony` can halt before execution when upstream inquiry routing
  has `ceremony_hold`.
- Tests do not require SSH, Docker, host-local QMD, or a real MCP server.

## Non-Goals

- Do not implement the full QMD search engine in the graph package.
- Do not push to or depend on `langchain-ai/langgraphjs` upstream.
- Do not mutate `.pde` storage unless a caller explicitly invokes an artifact
  writer with a target folder.
- Do not make `@miadisabelle/qmd` a required dependency while this package
  supports Node versions lower than QMD's Node `>=22` engine.
- Do not combine this graph with prompt-decomposition storage changes in the
  same implementation slice.
