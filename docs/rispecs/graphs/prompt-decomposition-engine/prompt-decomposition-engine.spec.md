# Prompt Decomposition Engine: LangGraph.js Orchestration Specification

**Specification Type:** Library Specification
**Document ID:** `rispecs/prompt-decomposition-engine/prompt-decomposition-engine.spec.md`
**Framework:** RISE (Reverse-engineer → Intent-extract → Specify → Export)
**Package:** `ava-langgraph-prompt-decomposition-engine`
**Version:** 0.1.2

---

## Desired Outcome Definition

### What Users Want to Create

The **ava-langgraph-prompt-decomposition-engine** enables developers to create **graph-orchestrated prompt decomposition workflows** that:

1. **State-Based Decomposition Graph** — A four-node graph running EAST→SOUTH→WEST→NORTH as a LangGraph-compatible state machine
2. **Three-Perspective Analysis** — Each decomposition read from the Mia (Engineer), Ava8 (Ceremony), and Miette (Story Engine) perspectives
3. **Ceremony Gating** — Relational accountability gating that can PROCEED, CAUTION, or HOLD execution based on balance and sacred domain analysis
4. **Subgraph Composability** — The decomposition graph can be embedded as a subgraph in larger LangGraph workflows

### Success Indicators

- ✅ `graph.invoke("complex prompt")` produces a fully decomposed state with all four directional analyses
- ✅ Three-perspective analysis reveals blind spots missed by single-perspective analysis
- ✅ Ceremony gate blocks indigenous/sacred domain work without proper reflective dimension
- ✅ The engine uses `ava-langchain-prompt-decomposition` primitives (no duplication)

---

## Structural Tension Analysis

### Architecture

```
ava-langchain-prompt-decomposition (primitives)
    ↓ consumed by
ava-langgraph-prompt-decomposition-engine (graph orchestration)
    ├── DecompositionGraph (EAST→SOUTH→WEST→NORTH state machine)
    ├── PerspectiveAnalyzer (three-perspective analysis)
    └── CeremonyGate (relational accountability)
```

### Current Structural Reality

The engine provides:

| Component | Role |
|-----------|------|
| `DecompositionGraph` | Orchestrates four directional nodes in sequence, manages state transitions |
| `DecompositionState` | Complete state interface tracking all pipeline artifacts and status |
| `eastNode` | Vision — extracts intents and directional analysis |
| `southNode` | Analysis — maps dependencies and computes execution order |
| `westNode` | Validation — checks ceremony requirements and relational balance |
| `northNode` | Action — builds the final action stack |
| `PerspectiveAnalyzer` | Reads the decomposition from the Engineer/Ceremony/Story Engine perspectives |
| `CeremonyGate` | Evaluates proceed/caution/hold decisions based on balance and perspective |
| `createDecompositionStateGraph` | Factory for LangGraph StateGraph integration |

---

## Functional Specification

### DecompositionGraph

```typescript
const graph = new DecompositionGraph({ enforeCeremony: false });
const state = await graph.invoke("Build a relational intelligence system...");
// state.status: "pending" | "east_complete" | "south_complete" | "west_complete" | "complete" | "ceremony_hold"
```

**State Shape:**
- `prompt`: Original input
- `directionalAnalysis`: EAST output
- `intentResult`: EAST output
- `dependencyGraph`: SOUTH output
- `executionOrder`: SOUTH output
- `wheelEnriched`: WEST output
- `ceremonyRequired`: WEST flag
- `relationalGuidance`: WEST messages
- `decomposition`: NORTH final output
- `status`: Pipeline progress
- `errors`: Error accumulator

### PerspectiveAnalyzer

Three lenses analyze the decomposition:
- **Engineer (Mia)**: Technical scope, dependency chains, test coverage, balance warnings
- **Ceremony (Ava8)**: Relational coverage, ceremonial dimension, indigenous domain flags
- **Story Engine (Miette)**: Narrative arc length, neglected perspectives, journey coherence

Returns `ThreePerspectiveInsights` with the lead perspective, coherence score and synthesis recommendation.

### CeremonyGate

Decisions:
- **PROCEED**: Balance adequate, no critical flags
- **CAUTION**: Balance or coherence below threshold, warnings present
- **HOLD**: Indigenous/sacred domain work without ceremony context, critical flags

---

## Integration Points

### Upstream (consumed by)
- Application-level LangGraph workflows as a subgraph
- Any system needing structured prompt analysis with relational accountability

### Downstream (depends on)
- `ava-langchain-prompt-decomposition` — All primitives (DirectionalDecomposer, IntentExtractor, DependencyMapper, ActionStackBuilder, MedicineWheelBridge)
- `ava-langgraph-narrative-intelligence` (optional peer) — For deeper narrative integration

### Re-exports
The engine re-exports all core primitives from `ava-langchain-prompt-decomposition` for convenience, so consumers can use a single import source.

---

## Testing Strategy

1. **DecompositionGraph**: End-to-end invoke produces complete state
2. **Individual nodes**: Each directional node produces correct partial state
3. **PerspectiveAnalyzer**: Three-perspective analysis with keyword scoring
4. **CeremonyGate**: Gate decisions based on balance thresholds and flags
