# Narrative Intelligence: Three-Universe Processing Framework

**Specification Type:** Library Specification
**Document ID:** `rispecs/narrative-intelligence/narrative-intelligence.spec.md`
**Framework:** RISE (Reverse-engineer → Intent-extract → Specify → Export)
**Package:** `ava-langgraph-narrative-intelligence`
**Version:** 0.1.1

---

## Desired Outcome Definition

### What Users Want to Create

The **ava-langgraph-narrative-intelligence** package enables developers to create **narrative-aware processing systems** that analyze events through three interpretive universes:

1. **Three-Universe Event Processing** — Every event is analyzed through Engineer (Mia — technical precision), Ceremony (Ava8 — relational protocols), and Story Engine (Miette — narrative patterns) perspectives, with lead universe determination and coherence scoring

2. **Narrative Coherence Analysis** — The `NarrativeCoherenceEngine` scores narrative health across structural, thematic, character, sensory, and continuity dimensions, identifies gaps with severity and routing targets, and produces a Trinity assessment (Mia/Miette/Ava8 synthesis)

3. **Emotional Beat Classification** — The `EmotionalBeatClassifierNode` classifies story beats across 10 emotional tones (Devastating, Hopeful, Tense, Joyful, Melancholic, Triumphant, Fearful, Peaceful, Conflicted, Resigned) with keyword scoring and confidence metrics

4. **Unified Narrative State Management** — A shared state contract (`UnifiedNarrativeState`) across six systems in the stack, with Redis-backed persistence through `NarrativeRedisManager` and episode lifecycle management

5. **NCP (Narrative Context Protocol) Schema** — Full NCP data model with Moments, StoryPoints, NCPStoryBeats, Players, and Perspectives — enabling structured narrative data exchange across the Storytelling system

### Success Indicators

- ✅ `ThreeUniverseProcessor.process(event, eventType)` produces a `ThreeUniverseAnalysis` with individual universe perspectives, lead universe, and coherence score
- ✅ `NarrativeCoherenceEngine.analyze(beats, characters, themes)` produces a `CoherenceResult` with component scores, identified gaps, routing suggestions, and Trinity assessment
- ✅ `EmotionalBeatClassifierNode.classifyEmotionalTone(content)` returns an `EmotionalTone` with confidence score
- ✅ `NarrativeRedisManager` persists and retrieves `UnifiedNarrativeState` from Redis, with `MockRedis` enabling testing without infrastructure
- ✅ NCP schema functions (`createNCPData`, `createNCPStoryBeat`, `getPlayerStorybeats`) enable structured narrative data construction and querying

---

## Structural Tension Analysis

### Current Structural Reality

| Component | Role | Direction |
|-----------|------|-----------|
| `ThreeUniverseProcessor` | Processes events through Engineer/Ceremony/Story Engine perspectives with keyword-based intent classification and coherence scoring | EAST |
| `NarrativeCoherenceEngine` | Analyzes narrative coherence across five gap types, produces component scores, and generates Trinity assessment | SOUTH |
| `EmotionalBeatClassifierNode` | Classifies emotional tone of story beats using keyword matching with 10 predefined tones | SOUTH |
| `UnifiedNarrativeState` / `StoryBeat` / `CharacterState` / `ThematicThread` | Core narrative state schema shared across six systems in the Narrative Intelligence Stack | EAST |
| `NCPStoryBeat` / `NCPData` / `Moment` / `StoryPoint` / `Player` / `Perspective` | Narrative Context Protocol data model for structured story data exchange | EAST |
| `NarrativeRedisManager` / `MockRedis` | Redis-backed state persistence with health checks, serialization, and mock for testing | NORTH |

### Desired Outcome

A system where every event — code commit, agent action, user input — is understood not just technically but narratively, through three complementary perspectives that together reveal the full meaning of what happened, what it means for the characters involved, and where the story advances toward next.

### The Tension

The current reality provides complete three-universe processing, coherence analysis, emotional classification, and state management. The creative tension lives in advancing toward **structural thinking** — a four-node graph (picture→draft→review→revise) that ports miaco's `pde-to-st` command into a LangGraph subgraph — and toward **consent-gated episode retrieval** that respects relational accountability when surfacing historical narrative context.

---

## Component Specification

### ThreeUniverseProcessor
**Direction:** EAST (Vision / Multi-Perspective Analysis)
**Type:** Class
**Purpose:** Processes events through all three universe lenses (Engineer, Ceremony, Story Engine) to produce a unified analysis with lead universe and coherence scoring.

```typescript
enum Universe {
  ENGINEER = "engineer",     // Mia - The Builder
  CEREMONY = "ceremony",     // Ava8 - The Keeper
  STORY_ENGINE = "story_engine", // Miette - The Weaver
}

interface UniversePerspective {
  universe: Universe;
  intent: string;
  confidence: number;
  suggestedFlows: string[];
  context: Record<string, unknown>;
}

interface ThreeUniverseAnalysis {
  engineer: UniversePerspective;
  ceremony: UniversePerspective;
  storyEngine: UniversePerspective;
  leadUniverse: Universe;
  coherenceScore: number;
  timestamp: string;
}

interface ThreeUniverseState {
  event: Record<string, unknown>;
  eventType: string;
  engineerPerspective?: UniversePerspective;
  ceremonyPerspective?: UniversePerspective;
  storyEnginePerspective?: UniversePerspective;
  analysis?: ThreeUniverseAnalysis;
  leadUniverse?: Universe;
  coherenceScore?: number;
  error?: string;
}

class ThreeUniverseProcessor {
  process(event: ProcessedEvent, eventType: EventType): ThreeUniverseAnalysis;
  analyzeEngineerPerspective(event: ProcessedEvent): UniversePerspective;
  analyzeCeremonyPerspective(event: ProcessedEvent): UniversePerspective;
  analyzeStoryEnginePerspective(event: ProcessedEvent): UniversePerspective;
  synthesizePerspectives(engineer, ceremony, storyEngine): ThreeUniverseAnalysis;
}
```

### NarrativeCoherenceEngine
**Direction:** SOUTH (Analysis / Scoring)
**Type:** Class
**Purpose:** Analyzes narrative coherence and identifies gaps across structural, thematic, character, sensory, and continuity dimensions with Trinity perspective integration.

```typescript
enum GapType {
  STRUCTURAL = "structural",
  THEMATIC = "thematic",
  CHARACTER = "character",
  SENSORY = "sensory",
  CONTINUITY = "continuity",
}

enum GapSeverity {
  CRITICAL = "critical",
  MODERATE = "moderate",
  MINOR = "minor",
}

enum RoutingTarget {
  STORYTELLER = "storyteller",
  STRUCTURIST = "structurist",
  ARCHITECT = "architect",
  AUTHOR = "author",
}

interface Gap {
  id: string;
  gapType: GapType;
  severity: GapSeverity;
  description: string;
  location: Record<string, unknown>;
  suggestedRoute: RoutingTarget;
  resolved: boolean;
}

interface CoherenceScore {
  overall: number;
  components: ComponentScore[];
}

interface TrinityAssessment {
  mia: string;    // Engineer perspective on coherence
  miette: string;  // Story Engine perspective on coherence
  ava8: string;    // Ceremony perspective on coherence
  synthesis: string;
}

interface CoherenceResult {
  coherenceScore: CoherenceScore;
  gaps: Gap[];
  trinityAssessment: TrinityAssessment;
  routingSuggestions: RoutingTarget[];
}

class NarrativeCoherenceEngine {
  analyze(beats: StoryBeat[], characters: CharacterState[], themes: ThematicThread[]): CoherenceResult;
}
```

### EmotionalBeatClassifierNode
**Direction:** SOUTH (Analysis / Classification)
**Type:** Class
**Purpose:** Classifies the emotional tone of story beats using keyword matching across 10 predefined emotional categories.

```typescript
enum EmotionalTone {
  DEVASTATING = "Devastating",
  HOPEFUL = "Hopeful",
  TENSE = "Tense",
  JOYFUL = "Joyful",
  MELANCHOLIC = "Melancholic",
  TRIUMPHANT = "Triumphant",
  FEARFUL = "Fearful",
  PEACEFUL = "Peaceful",
  CONFLICTED = "Conflicted",
  RESIGNED = "Resigned",
}

interface ClassificationResult {
  classification: string;
  confidence: number;
  method: string;
  prompt?: string;
}

interface EmotionalClassificationState {
  ncpData?: { storybeats: NCPStoryBeat[] };
  storybeatId?: string;
  emotionalClassification?: string;
  confidenceScore?: number;
  error?: string;
}

class EmotionalBeatClassifierNode {
  classifyEmotionalTone(content: string): ClassificationResult;
}
```

### UnifiedNarrativeState / NCP Schema
**Direction:** EAST (Vision / Definition)
**Type:** Interfaces + Factory Functions
**Purpose:** Shared narrative state contract across six systems in the stack, with NCP data model for structured story data exchange.

```typescript
interface StoryBeat {
  id: string;
  content: string;
  sequence: number;
  phase: NarrativePhase;
  function: NarrativeFunction;
  emotionalTone?: string;
  characterIds: string[];
  themeIds: string[];
}

interface UnifiedNarrativeState {
  storyId: string;
  sessionId: string;
  beats: StoryBeat[];
  characters: CharacterState[];
  themes: ThematicThread[];
  routingDecisions: RoutingDecision[];
  currentEpisode: number;
  metadata: Record<string, unknown>;
}

interface NCPStoryBeat {
  id: string;
  content: string;
  emotional_weight: number;
  narrative_function: string;
  player_id: string;
}

interface NCPData {
  moments: Moment[];
  storypoints: StoryPoint[];
  storybeats: NCPStoryBeat[];
  players: Player[];
  perspectives: Perspective[];
}
```

### NarrativeRedisManager
**Direction:** NORTH (Action / Persistence)
**Type:** Class
**Purpose:** Redis-backed state persistence for `UnifiedNarrativeState` with serialization, health checks, and a `MockRedis` for testing.

```typescript
interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}

class NarrativeRedisManager {
  constructor(config: RedisConfig);
  async saveState(state: UnifiedNarrativeState): Promise<void>;
  async loadState(storyId: string): Promise<UnifiedNarrativeState | null>;
  async healthCheck(): Promise<HealthCheckResult>;
}

class MockRedis {
  // In-memory Redis mock for testing without infrastructure
}
```

---

## Integration Architecture

### Consumer Pattern

This library has optional peer dependencies on `@langchain/langgraph` and `ioredis`. It does NOT directly depend on the langchainjs custom libraries (relational-intelligence, prompt-decomposition, narrative-tracing) but is **conceptually aligned** through shared patterns:

- The Three-Universe model (Engineer/Ceremony/Story Engine) parallels the Medicine Wheel's multi-perspective approach in relational-intelligence
- NarrativeCoherenceEngine's gap analysis parallels the ValueGate's constraint checking pattern
- The `UnifiedNarrativeState` is the shared contract consumed by the Storytelling system, Flowise, Langflow, and Miadi

### Dependency Graph

```
        ava-langgraph-narrative-intelligence
        (ThreeUniverseProcessor, CoherenceEngine,
         EmotionalClassifier, RedisManager, NCP)
                       │
        ┌──────────────┼───────────────────┐
        │              │                   │
        ▼              ▼                   ▼
  @langchain/       ioredis          Storytelling
  langgraph       (optional)          System
  (optional)                              │
                                    ┌─────┼──────┐
                                    ▼     ▼      ▼
                              Flowise Langflow  Miadi-46
                              (UnifiedNarrativeState consumers)
```

---

## Kinship Mapping

| This Package | Related Package | Kinship Type | Shared Pattern |
|---|---|---|---|
| `ThreeUniverseProcessor` | `jgwill/Miadi` → `rispecs/miadi-code/SPEC.md` (Three-Universe Terminal Agent) | Direct Kin | Engineer/Ceremony/Story Engine mapping — Mia/Ava8/Miette as three interpretive lenses |
| `NarrativeCoherenceEngine` | `jgwill/medicine-wheel` → `narrative-engine.spec.md` | Kin (Narrative Processing) | Both process narrative content through typed pipelines; coherence engine scores what narrative engine produces |
| `ThreeUniverseProcessor` | `ava-langchain-relational-intelligence` → `rispecs/relational-intelligence/relational-intelligence.spec.md` | Conceptual Sibling | Three-Universe multi-perspective analysis parallels MedicineWheelFilter's four-quadrant assessment — both ensure multiple dimensions of reality are engaged |
| `NarrativeCoherenceEngine` | `ava-langchain-narrative-tracing` → `rispecs/narrative-tracing/narrative-tracing.spec.md` | Complementary (Analysis ↔ Observability) | Intelligence provides analysis; tracing provides observability. Both use Three-Universe model independently |
| `UnifiedNarrativeState` | `ava-langgraph-prompt-decomposition-engine` → `rispecs/prompt-decomposition-engine/prompt-decomposition-engine.spec.md` | Sibling (State Pattern) | Both define graph state schemas — `DecompositionState` for PDE pipeline, `UnifiedNarrativeState` for narrative lifecycle |
| `EmotionalBeatClassifierNode` | `ava-langgraph-inquiry-routing-engine` → `rispecs/inquiry-routing-engine/inquiry-routing-engine.spec.md` | Sibling (Classification Pattern) | Both use keyword-based classification nodes — inquiry routing classifies intent, emotional classifier classifies tone |

---

## Advancement Path

### Next Implementation Steps

1. **StructuralThinkingGraph** — Create a four-node linear LangGraph subgraph (picture→draft→review→revise) that ports miaco's `pde-to-st` command. Each node transforms the narrative state: PICTURE captures the current creative reality, DRAFT generates the initial output, REVIEW applies coherence analysis, and REVISE incorporates feedback — embodying Robert Fritz's structural thinking methodology.

2. **EpisodeRetrievalSubgraph** — Create a consent-gated episode retrieval subgraph that surfaces historical narrative context (previous episodes, character arcs, thematic threads) while respecting relational accountability. The retrieval gate checks whether the requesting agent has appropriate relational context before granting access to narrative history.

3. **LLM-Enhanced Three-Universe Processing** — Advance the `ThreeUniverseProcessor` beyond keyword-based intent classification toward LLM-powered perspective analysis where each universe perspective is generated by an LLM prompt tuned for that universe's interpretive lens.

4. **NCP Integration Deepening** — Advance NCP schema toward bidirectional synchronization with the Storytelling system's NCP implementation, enabling real-time narrative state sharing during story generation.

5. **Coherence-Driven Routing** — Advance the `NarrativeCoherenceEngine` from analysis-only toward active routing where identified gaps automatically trigger targeted enrichment subgraphs (storyteller for structural gaps, architect for continuity gaps, author for thematic decisions).

6. **Multi-Story State Management** — Advance `NarrativeRedisManager` toward concurrent multi-story management with episode indexing, cross-story character tracking, and thematic thread continuity across separate story generation sessions.
