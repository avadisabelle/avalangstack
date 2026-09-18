# 01 — Inquiry Routing Engine

> Package: `ava-langgraph-inquiry-routing-engine` v0.1.0
> Path: `libs/inquiry-routing-engine/`
> Peer dependencies: `ava-langchain-prompt-decomposition >=0.1.0`, `ava-langchain-inquiry-routing >=0.1.0`

## Desired Outcome

A graph-level orchestration engine that wraps the `ava-langchain-inquiry-routing` chain primitives into a state machine with four directional nodes — EAST(Generate) → SOUTH(Route) → WEST(Validate) → NORTH(Dispatch) — adding relational accountability gating (`ceremony_hold`), multi-channel dispatch formatting, and LangGraph `StateGraph` integration as a compilable subgraph.

Consumers invoke `InquiryRoutingGraph.invoke(decomposition)` and receive a fully processed `InquiryRoutingState` with dispatch-ready payloads for QMD, deep-search, and workspace-scan channels.

## Current Reality

- Chain primitives exist in `ava-langchain-inquiry-routing` but require manual orchestration: callers must sequence Generator → Enricher → Router → Formatter.
- No relational validation gate — inquiries touching Indigenous/ceremonial content proceed without human review.
- No state machine tracking: callers cannot inspect intermediate pipeline state (generated, routed, validated, dispatched, ceremony_hold).
- No LangGraph-compatible subgraph — cannot embed inquiry routing into larger graph workflows.

## Structural Tension

Chain primitives produce *components*; agentic workflows need *orchestrated state machines* with accountability gates. The tension between primitive flexibility and pipeline safety resolves through a four-node graph with `ceremony_hold` as a structural pause — the system stops itself when relational integrity requires human presence.

## Architecture / Components

### InquiryRoutingState (`src/graphs/inquiry_routing_graph.ts`)

State interface for the graph:

```typescript
interface InquiryRoutingState {
  decomposition: DecompositionResult;
  pdeId: string;
  sessionId: string;
  inquiryBatch: InquiryBatch | null;
  routingDecisions: RoutingDecision[] | null;
  routedBatch: RoutedInquiryBatch | null;
  relationalValidation: RelationalValidationResult | null;
  ceremonyRequired: boolean;
  dispatchedInquiries: Inquiry[] | null;
  dispatchPayloads: FormattedDispatch[] | null;
  status: "pending" | "generated" | "routed" | "validated" | "dispatched" | "ceremony_hold";
  errors: string[];
}
```

### Four Directional Nodes (`src/graphs/inquiry_routing_graph.ts`)

| Node | Direction | Function | Consumes | Produces |
|------|-----------|----------|----------|----------|
| `generateNode` | 🌅 EAST | Generate inquiries from decomposition | `DecompositionResult` | `InquiryBatch` |
| `routeNode` | 🌿 SOUTH | Classify and route to channels | `InquiryBatch` | `RoutedInquiryBatch`, `RoutingDecision[]` |
| `validateNode` | 🌊 WEST | Relational validation + enrichment | `RoutedInquiryBatch` | `RelationalValidationResult`, ceremony gate |
| `dispatchNode` | ⚡ NORTH | Format for source channels | `RoutedInquiryBatch` | `FormattedDispatch[]` |

Flow: `EAST → SOUTH → WEST → (ceremony check) → NORTH`

When `enforceCeremony: true` and `status === "ceremony_hold"`, the graph halts before NORTH. Human review required.

### RelationalValidator (`src/nodes/relational_validator.ts`)

Validates relational integrity of inquiry batches:

- Checks `relational_context`, `accountability` presence on every inquiry
- Flags Indigenous-domain content missing `indigenous_lens` (severity: `hold`)
- Flags WEST-direction inquiries missing `ceremonial_intent` (severity: `warning`)
- Flags ceremony-hold keywords (`indigenous`, `ceremony`, `sacred`, `elder`, `medicine wheel`, `sovereign`, `first nations`, `treaty`) without `ceremonial_intent` (severity: `hold`)
- Calculates weighted score: `relational_context` × 0.6 + `accountability` × 0.4, minus 0.2 per hold flag
- `ceremonyRequired` triggers on any hold flag OR any Indigenous content

```typescript
interface RelationalValidationResult {
  valid: boolean;
  score: number;        // 0–1
  flags: RelationalFlag[];
  ceremonyRequired: boolean;
  summary: string;      // "HOLD" | "CAUTION" | "PROCEED" prefix
}
```

### DispatchFormatter (`src/nodes/dispatch_formatter.ts`)

Formats validated inquiries for their target channels:

- `formatForQmd()` → `QmdDispatch` with multiple search strategies (lex + vec + optional hyde)
- `formatForDeepSearch()` → `DeepSearchDispatch` with search terms + Two-Eyed Seeing context
- `formatForWorkspaceScan()` → `WorkspaceScanDispatch` with generated glob/grep patterns
- `formatForSource()` → routes to appropriate formatter based on `inquiry.source`

```typescript
type FormattedDispatch = QmdDispatch | DeepSearchDispatch | WorkspaceScanDispatch;
```

### InquiryRoutingGraph (`src/graphs/inquiry_routing_graph.ts`)

Orchestrator class — runs nodes in sequence:

- `invoke(decomposition, sessionId?)` → full pipeline → `InquiryRoutingState`
- `invokeGenerate/Route/Validate/Dispatch(state)` → fine-grained node execution
- `enforceCeremony` option: halt at `ceremony_hold` status

### StateGraph Factory (`src/graphs/state_graph_factory.ts`)

LangGraph integration:

- `createInquiryRoutingStateGraph(options?)` → LangGraph `StateGraph` with channels, conditional edges
- Dynamic import of `@langchain/langgraph` (not a hard dependency)
- Conditional edge at WEST: if `ceremony_hold` + `enforceCeremony` → `END`; else → dispatch
- Designed for embedding as subgraph in larger pipelines (e.g., downstream of `DecompositionGraph`)

### Constants (`src/constants.ts`)

- `DIRECTION_SOURCE_DEFAULTS` — direction-to-channel mapping
- `RELATIONAL_KEYWORDS` — 18 keywords triggering deeper accountability
- `CEREMONY_HOLD_KEYWORDS` — 8 keywords requiring explicit human review
- Validation thresholds: `MIN_CONFIDENCE_THRESHOLD = 0.3`, `MIN_RELATIONAL_SCORE = 0.5`
- Weight constants: `RELATIONAL_WEIGHT = 0.6`, `ACCOUNTABILITY_WEIGHT = 0.4`

## Data (TypeScript interfaces)

```typescript
// Validation
interface RelationalFlag { inquiryId: string; field: string; severity: "warning" | "hold"; message: string; }
interface RelationalValidationResult { valid: boolean; score: number; flags: RelationalFlag[]; ceremonyRequired: boolean; summary: string; }

// Dispatch payloads
interface QmdSearchQuery { mode: "lex" | "vec" | "hyde"; query: string; direction: string; context?: string; }
interface QmdDispatch { inquiryId: string; searches: QmdSearchQuery[]; direction: string; directionalLabel: string; }
interface DeepSearchDispatch { inquiryId: string; query: string; academicContext: string; direction: string; searchTerms: string[]; twoEyedSeeing: { indigenous?: string; western?: string; }; }
interface WorkspaceScanDispatch { inquiryId: string; globPatterns: string[]; grepPatterns: string[]; direction: string; scope: string; }
type FormattedDispatch = QmdDispatch | DeepSearchDispatch | WorkspaceScanDispatch;

// Session persistence
interface StoredInquiryRoutingSession { id: string; timestamp: string; pdeId: string; decomposition: DecompositionResult; inquiryBatch: InquiryBatch; routingDecisions: RoutingDecision[]; }
```

## Implementation Notes

- **Re-exports chain primitives** — all types/classes from `ava-langchain-inquiry-routing` are re-exported for single-import convenience.
- **Pure-function graph** — `InquiryRoutingGraph` doesn't require LangGraph runtime; it runs synchronously with `mergeState()`. The `StateGraph` factory is the LangGraph integration point.
- **Build**: tsup + TypeScript 5.3, ESM primary + CJS. Three export paths: `.`, `./graphs`, `./nodes`.
- **Testing**: vitest. Tests in `src/graphs/__tests__/` and `src/nodes/__tests__/`.
- **Ceremony hold is structural, not decorative** — when `enforceCeremony: true`, the graph literally stops. This is the relational accountability gate.

## RISE Compliance

| Phase | Status | Notes |
|-------|--------|-------|
| **R**everse-engineer | ✅ Done | Architecture reverse-engineered from medicine-wheel-pi routing concepts and PDE engine patterns |
| **I**ntent-extract | ✅ Done | Intent: orchestrate inquiry routing as a state machine with relational accountability gating |
| **S**pecify | ✅ This document | State machine, four nodes, validation, dispatch, LangGraph factory |
| **E**xport | ✅ Published | `ava-langgraph-inquiry-routing-engine@0.1.0`, three export paths, subgraph-ready |
