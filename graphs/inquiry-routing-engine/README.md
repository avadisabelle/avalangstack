# ava-langgraph-inquiry-routing-engine

Graph-level orchestration for the Inquiry Routing pipeline. This package provides a state-based graph that transforms PDE decomposition results into dispatch-ready inquiries, routing them through Four Directions with relational accountability gating and multi-channel formatting.

## Overview

The Inquiry Routing Engine sits downstream of the Prompt Decomposition Engine (PDE). It consumes either a legacy `DecompositionResult` or a strategy-aware `DecompositionWithProvenance` and orchestrates a four-stage pipeline:

1. **EAST (Generate)** — Produce structured inquiries from decomposition actions
2. **SOUTH (Route)** — Classify and route each inquiry to source channels (QMD, deep-search, workspace-scan)
3. **WEST (Validate)** — Relational validation checks accountability, ceremonial markers, and Two-Eyed Seeing fields
4. **NORTH (Dispatch)** — Format inquiries for their target channels as actionable query payloads

## Features

- **`InquiryRoutingGraph`**: Orchestrates the Generate→Route→Validate→Dispatch pipeline
- **`RelationalValidator`**: Validates relational integrity with Wilson's axiological grounding
- **`DispatchFormatter`**: Multi-channel formatting (QMD lex/vec/hyde, academic deep-search, workspace glob/grep)
- **`createInquiryRoutingStateGraph()`**: LangGraph-compatible StateGraph factory for subgraph composition
- **Ceremony Hold**: Configurable halt when Indigenous/ceremonial content lacks proper relational markers
- **Strategy Validation**: Converts multi-pass strategy disagreements into WEST validation inquiries

## Installation

```bash
npm install ava-langgraph-inquiry-routing-engine
```

### Peer Dependencies

```bash
npm install ava-langchain-prompt-decomposition ava-langchain-inquiry-routing
```

## Quick Start

```typescript
import { DecompositionGraph } from "ava-langgraph-prompt-decomposition-engine";
import { InquiryRoutingGraph } from "ava-langgraph-inquiry-routing-engine";

// First: decompose the prompt
const pdeGraph = new DecompositionGraph();
const pdeState = await pdeGraph.invoke("Research relational patterns. Build the API. Test integration.");

// Then: route the inquiries
const routingGraph = new InquiryRoutingGraph();
const state = await routingGraph.invoke(pdeState.decomposition!);

console.log("Status:", state.status);
console.log("Inquiries generated:", state.inquiryBatch?.total);
console.log("Relational score:", state.relationalValidation?.score);
console.log("Dispatch payloads:", state.dispatchPayloads?.length);

// Check for ceremony hold
if (state.ceremonyRequired) {
  console.log("⚠️ Ceremony required:", state.relationalValidation?.summary);
}
```

For a strategy-aware PDE graph, pass the enriched handoff instead:

```typescript
const state = await routingGraph.invoke(
  pdeState.decompositionWithProvenance!,
);
```

## Architecture

### State Flow

```
DecompositionResult | DecompositionWithProvenance
        │
        ▼
  ┌─────────────┐
  │ EAST:       │
  │ Generate    │──→ InquiryBatch
  └─────────────┘
        │
        ▼
  ┌─────────────┐
  │ SOUTH:      │
  │ Route       │──→ RoutedInquiryBatch + RoutingDecisions
  └─────────────┘
        │
        ▼
  ┌─────────────┐       ceremony_hold
  │ WEST:       │──────────────────────→ HALT
  │ Validate    │
  └─────────────┘
        │ (pass)
        ▼
  ┌─────────────┐
  │ NORTH:      │
  │ Dispatch    │──→ FormattedDispatch[] (QMD/deep-search/workspace)
  └─────────────┘
```

### Source Channels

| Channel | Direction Affinity | Query Format |
|---------|-------------------|--------------|
| QMD Local | EAST, WEST | lex/vec/hyde semantic searches |
| Deep Search Academic | SOUTH | Academic retrieval with Two-Eyed Seeing context |
| Workspace Scan | NORTH | glob/grep patterns against codebase |

### Relational Validation

The `RelationalValidator` checks every inquiry for:
- `relational_context` — relational grounding (Wilson's axiology)
- `accountability` — relational obligations
- `indigenous_lens` — required when Indigenous content is detected
- `ceremonial_intent` — recommended for WEST-direction inquiries

Missing fields produce warnings or hold-level flags. Hold flags trigger `ceremony_hold` status.

## LangGraph Integration

Use `createInquiryRoutingStateGraph()` to embed as a subgraph:

```typescript
import { createInquiryRoutingStateGraph } from "ava-langgraph-inquiry-routing-engine/graphs";

const graph = await createInquiryRoutingStateGraph({ enforceCeremony: true });
const compiled = graph.compile();

const result = await compiled.invoke({
  decomposition: myDecomposition,
  pdeId: myDecomposition.id,
  sessionId: "session-123",
});
```

## API Reference

### Graphs

- `InquiryRoutingGraph` — Pure-function orchestrator (no LangGraph dependency needed)
- `createInquiryRoutingStateGraph()` — LangGraph StateGraph factory (requires `@langchain/langgraph`)
- `createInitialState(decomposition, sessionId?)` — State factory
- `generateNode()`, `routeNode()`, `validateNode()`, `dispatchNode()` — Individual node functions

### Nodes

- `RelationalValidator` — Relational integrity validation
- `DispatchFormatter` — Multi-channel query formatting

### Re-exported from ava-langchain-inquiry-routing

- `InquiryGenerator`, `InquiryRouter`, `InquiryFormatter`, `RelationalEnricher`
- `Inquiry`, `InquiryBatch`, `RoutingDecision`, `RoutedInquiryBatch`

## License

MIT
