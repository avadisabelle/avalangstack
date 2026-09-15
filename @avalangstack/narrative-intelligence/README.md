# ava-langgraph-narrative-intelligence

Narrative Intelligence Toolkit for JavaScript/TypeScript - a complete port of the Python `narrative-intelligence` package.

## Overview

This package provides the core narrative intelligence components for the LangGraph ecosystem:

- **Three-Universe Processing** - Analyze events through Engineer (Mia), Ceremony (Ava8), and Story Engine (Miette) perspectives
- **Narrative Coherence Analysis** - Score narrative quality across 5 dimensions with actionable gap identification
- **Story Beat Classification** - Emotional tone detection using rule-based and LLM classification
- **State Management** - Redis-backed persistence for cross-system state sharing

## Installation

```bash
npm install ava-langgraph-narrative-intelligence
# or
yarn add ava-langgraph-narrative-intelligence
```

### Optional Dependencies

```bash
# For LangGraph integration
npm install @langchain/langgraph

# For Redis persistence
npm install ioredis
```

## Quick Start

### Three-Universe Processing

Process any event through three interpretive lenses:

```typescript
import { ThreeUniverseProcessor } from "ava-langgraph-narrative-intelligence";

const processor = new ThreeUniverseProcessor();

// Process a GitHub event
const analysis = processor.process(
  { content: "feat: implement new feature together with team" },
  "github.push"
);

console.log(`Lead universe: ${analysis.leadUniverse}`); // "ceremony" (collaborative work)
console.log(`Coherence: ${analysis.coherenceScore}`); // 0.75

// Access individual perspectives
console.log(analysis.engineer.intent); // "feature_implementation"
console.log(analysis.ceremony.intent); // "co_creation"
console.log(analysis.storyEngine.intent); // "rising_action"
```

### Narrative Coherence Analysis

Analyze the quality of story beats:

```typescript
import {
  NarrativeCoherenceEngine,
  createStoryBeat,
  NarrativeFunction,
} from "ava-langgraph-narrative-intelligence";

const engine = new NarrativeCoherenceEngine();

const beats = [
  createStoryBeat("beat_1", 1, "Setup", NarrativeFunction.INCITING_INCIDENT, 1),
  createStoryBeat("beat_2", 2, "Rising action", NarrativeFunction.RISING_ACTION, 2),
  createStoryBeat("beat_3", 3, "Climax", NarrativeFunction.CLIMAX, 3),
  createStoryBeat("beat_4", 4, "Resolution", NarrativeFunction.RESOLUTION, 3),
];

const result = engine.analyze(beats);

// Overall coherence score (0-1)
console.log(`Overall: ${result.coherenceScore.toFixed(2)}`);

// Component scores (0-100)
console.log(`Overall: ${result.coherenceBreakdown.overall}%`);
console.log(`Narrative Flow: ${result.coherenceBreakdown.narrativeFlow.score}%`);
console.log(`Pacing: ${result.coherenceBreakdown.pacing.score}%`);

// Identified tensions (`gaps` is a deprecated alias)
for (const tension of result.tensions) {
  console.log(`Tension: ${tension.description} (${tension.severity})`);
  console.log(`Route to: ${tension.suggestedRoute}`);
}

// Trinity assessment (Mia/Miette/Ava8)
console.log(`Mia (structure): ${result.trinityAssessment.mia}`);
console.log(`Miette (emotion): ${result.trinityAssessment.miette}`);
console.log(`Ava8 (atmosphere): ${result.trinityAssessment.ava8}`);
```

### Unified Narrative State

Create and manage narrative state across systems:

```typescript
import {
  createUnifiedNarrativeState,
  addBeat,
  createStoryBeat,
  NarrativeFunction,
} from "ava-langgraph-narrative-intelligence";

// Create a new state with default characters (Mia, Ava8, Miette)
const state = createUnifiedNarrativeState("story_123", "session_456");

// Add a beat
const beat = createStoryBeat(
  "beat_1",
  1,
  "The hero begins their journey",
  NarrativeFunction.INCITING_INCIDENT,
  1,
  {
    emotionalTone: "hopeful",
    thematicTags: ["journey", "transformation"],
  }
);

addBeat(state, beat);

console.log(`Act: ${state.position.act}`);
console.log(`Beat count: ${state.position.beatCount}`);
console.log(`Lead universe: ${state.position.leadUniverse}`);
```

### Redis Persistence

Use Redis for cross-system state sharing:

```typescript
import { NarrativeRedisManager, createRedisConfig } from "ava-langgraph-narrative-intelligence";

const manager = new NarrativeRedisManager(createRedisConfig({
  url: "redis://localhost:6379",
}));

await manager.connect();

// Get or create state
const state = await manager.getOrCreateState("story_123", "session_456");

// Add beats
await manager.addBeatToSession("session_456", beat);

// Cache analysis
await manager.cacheEventAnalysis("event_123", analysis);

await manager.disconnect();
```

## The Three Universes

The three-universe model from `multiverse_3act`:

| Universe | Character | Focus | Keywords |
|----------|-----------|-------|----------|
| **ENGINEER** | Mia (The Builder) | Technical precision | feat:, fix:, refactor |
| **CEREMONY** | Ava8 (The Keeper) | Relational protocols | together, thanks, collaborate |
| **STORY_ENGINE** | Miette (The Weaver) | Narrative patterns | begin, climax, resolution |

## Coherence Dimensions

The coherence engine analyzes 5 dimensions:

1. **Narrative Flow** - Smooth transitions, logical causality
2. **Character Consistency** - Voice consistency, arc progression
3. **Pacing** - Tension/relief distribution, climax positioning
4. **Theme Saturation** - Theme presence and payoff
5. **Continuity** - Timeline consistency, sequence ordering

## Gap Types

Identified gaps are categorized and routed:

| Gap Type | Route To | Description |
|----------|----------|-------------|
| STRUCTURAL | Structurist | Missing beats, incomplete arcs |
| THEMATIC | Structurist | Underdeveloped themes |
| CHARACTER | Storyteller | Inconsistent character voice |
| SENSORY | Storyteller | Lacking grounding detail |
| CONTINUITY | Author | Timeline inconsistencies |

## Emotional Tones

The emotional classifier recognizes these tones:

- Devastating, Hopeful, Tense, Joyful
- Melancholic, Triumphant, Fearful, Peaceful
- Conflicted, Resigned

## Integration with narrative-tracing

Connect to the `@langchain/langchain-narrative-tracing` package:

```typescript
import { LangGraphBridge } from "@langchain/langchain-narrative-tracing";
import { ThreeUniverseProcessor } from "ava-langgraph-narrative-intelligence";

const bridge = new LangGraphBridge(handler);

const processor = new ThreeUniverseProcessor({
  tracingCallback: bridge.createThreeUniverseCallback(),
});

// All analyses now get traced to Langfuse
const analysis = processor.process(event, "github.push");
```

## API Reference

### Exports

```typescript
// Main exports
export {
  // Processing
  ThreeUniverseProcessor,
  NarrativeCoherenceEngine,
  EmotionalBeatClassifierNode,
  
  // State
  UnifiedNarrativeState,
  createUnifiedNarrativeState,
  
  // Types
  Universe,
  NarrativeFunction,
  NarrativePhase,
  GapType,
  GapSeverity,
  EmotionalTone,
  
  // Redis
  NarrativeRedisManager,
  MockRedis,
} from "ava-langgraph-narrative-intelligence";

// Subpath exports
import * as schemas from "ava-langgraph-narrative-intelligence/schemas";
import * as graphs from "ava-langgraph-narrative-intelligence/graphs";
import * as nodes from "ava-langgraph-narrative-intelligence/nodes";
import * as integrations from "ava-langgraph-narrative-intelligence/integrations";
```

## Python Parity

This package is a complete TypeScript port of the Python `narrative-intelligence` package, maintaining full feature parity:

| Python Module | TypeScript Module |
|---------------|-------------------|
| `narrative_intelligence/schemas/unified_state_bridge.py` | `schemas/unified_state_bridge.ts` |
| `narrative_intelligence/schemas/ncp.py` | `schemas/ncp.ts` |
| `narrative_intelligence/graphs/three_universe_processor.py` | `graphs/three_universe_processor.ts` |
| `narrative_intelligence/graphs/coherence_engine.py` | `graphs/coherence_engine.ts` |
| `narrative_intelligence/nodes/emotional_classifier.py` | `nodes/emotional_classifier.ts` |
| `narrative_intelligence/integrations/redis_state.py` | `integrations/redis_state.ts` |

## License

MIT
