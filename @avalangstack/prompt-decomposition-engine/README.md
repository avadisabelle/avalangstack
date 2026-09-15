# ava-langgraph-prompt-decomposition-engine

Graph-level orchestration for the Prompt Decomposition Engine (PDE). This package provides a structured approach to breaking down complex prompts into actionable steps, incorporating multi-perspective analysis and relational accountability.

## Overview

The Prompt Decomposition Engine (PDE) orchestrates a multi-stage process for analyzing and decomposing user prompts. It leverages the "Four Directions" metaphor (EAST, SOUTH, WEST, NORTH) to guide the decomposition, integrating insights from the "Three Universes" (Engineer/Mia, Ceremony/Ava8, Story Engine/Miette) for a holistic understanding and generation of an execution plan.

## Features

-   **`DecompositionGraph`**: Orchestrates the core decomposition pipeline (EAST → SOUTH → WEST → NORTH).
-   **Optional strategic decomposition**: Selects keyword, semantic, hybrid, or multi-pass decomposition and exposes versioned provenance for downstream graphs.
-   **PDE lineage storage**: Persists flat artifacts or folder-backed PDE trees with parent-child and runtime provenance.
-   **`PerspectiveAnalyzer`**: Analyzes prompt decompositions through the lenses of Engineer (Mia), Ceremony (Ava8), and Story Engine (Miette) universes, enriching the process with multi-dimensional insights.
-   **`CeremonyGate`**: Provides a mechanism for relational accountability, gating execution based on ceremonial requirements and ethical considerations, ensuring thoughtful progression.

## Installation

```bash
npm install ava-langgraph-prompt-decomposition-engine
# or
yarn add ava-langgraph-prompt-decomposition-engine
```

### Peer Dependencies

This package relies on several peer dependencies for its full functionality:

```bash
npm install ava-langchain-relational-intelligence ava-langgraph-narrative-intelligence
# or
yarn add ava-langchain-relational-intelligence ava-langgraph-narrative-intelligence
```

## Quick Start

```typescript
import {
  DecompositionGraph,
  PerspectiveAnalyzer,
  CeremonyGate,
} from "ava-langgraph-prompt-decomposition-engine";

const graph = new DecompositionGraph();
const analyzer = new PerspectiveAnalyzer();
const gate = new CeremonyGate();

// Run the full pipeline
const state = await graph.invoke("Build a relational intelligence system...");

console.log("Decomposition Status:", state.status);

// Analyze through three perspectives
if (state.decomposition) {
  const perspectives = analyzer.analyze(state.decomposition);
  console.log("Lead Universe:", perspectives.leadUniverse);

  // Evaluate if ceremony is needed
  const verdict = gate.evaluate(state.decomposition, perspectives);

  if (verdict.decision === "hold") {
    console.log("Ceremony needed:", verdict.reasons);
  } else {
    console.log("Can proceed:", verdict.decision);
  }
}
```

### Strategy-Aware Handoff

```typescript
const graph = new DecompositionGraph({
  strategy: {
    enabled: true,
    preferences: { alwaysMultiPass: true },
  },
  workdir: process.cwd(),
  storage: { layout: "tree", engine: "codex" },
});

const state = await graph.invoke("Research, design, build, and validate the service.");

// Pass this directly to ava-langgraph-inquiry-routing-engine.
const handoff = state.decompositionWithProvenance;
```

## Core Concepts

### The Four Directions of Decomposition

The PDE process is structured around the "Four Directions," inspired by traditional Medicine Wheel teachings:

-   **EAST (Vision)**: Focuses on initial intent extraction – "What is being asked?"
-   **SOUTH (Analysis)**: Maps dependencies and computes the execution order – "What needs to be learned?"
-   **WEST (Validation)**: Checks ceremonial requirements and relational balance – "What needs reflection?"
-   **NORTH (Action)**: Builds the final action stack – "What executes?"

### The Three Universes of Perspective

Each decomposition is further enriched by perspectives from three interpretive universes:

-   **Mia (Engineer)**: Focuses on technical feasibility, dependencies, and architectural considerations.
-   **Ava8 (Ceremony)**: Emphasizes relational accountability, protocols, and governance.
-   **Miette (Story Engine)**: Considers narrative coherence, emotional arcs, and overall meaning.

### Ceremony Gating

The `CeremonyGate` acts as a crucial checkpoint. It evaluates the decomposition and its multi-universe analysis to determine if a "ceremonial pause" or human review is required before proceeding to execution. This ensures that actions are not just technically feasible, but also relationally and ethically sound.

## API Reference

Consult the JSDoc comments within the source code for detailed API documentation.

### Main Exports

-   `DecompositionGraph`: The orchestrator for the decomposition pipeline.
-   `DecompositionWithProvenance`: Stable decomposition plus strategy metadata handoff.
-   `PerspectiveAnalyzer`: Tool for analyzing prompts through three universe lenses.
-   `CeremonyGate`: Mechanism for evaluating ceremonial requirements and gating execution.
-   Re-exports from `ava-langchain-prompt-decomposition`: Core primitives like `DirectionalDecomposer`, `IntentExtractor`, `DependencyMapper`, `ActionStackBuilder`, and `MedicineWheelBridge`.

## License

MIT
