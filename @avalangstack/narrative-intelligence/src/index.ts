/**
 * @ava/narrative-intelligence
 *
 * Narrative Intelligence Toolkit for JavaScript/TypeScript
 *
 * This package provides the core narrative intelligence components:
 * - Three-Universe Processing (Engineer/Ceremony/Story Engine perspectives)
 * - Narrative Coherence Analysis
 * - Story Beat Classification
 * - State Management with Redis
 *
 * Port of the Python narrative-intelligence package with full feature parity.
 *
 * @example
 * import {
 *   ThreeUniverseProcessor,
 *   NarrativeCoherenceEngine,
 *   createUnifiedNarrativeState,
 * } from "@ava/narrative-intelligence";
 *
 * // Process an event through three universes
 * const processor = new ThreeUniverseProcessor();
 * const analysis = processor.process({ content: "Add new feature" }, "github.push");
 * console.log(`Lead universe: ${analysis.leadUniverse}`);
 *
 * // Analyze narrative coherence
 * const engine = new NarrativeCoherenceEngine();
 * const result = engine.analyze(beats, characters, themes);
 * console.log(`Overall coherence: ${result.coherenceScore.toFixed(2)}`); // 0-1
 * console.log(`Breakdown: ${result.coherenceBreakdown.overall}`); // 0-100
 */

// ============================================================================
// Schemas - Core Data Types
// ============================================================================

export {
  // Enums
  Universe,
  NarrativePhase,
  NarrativeFunction,
  // Interfaces
  UniversePerspective,
  ThreeUniverseAnalysis,
  NarrativePosition,
  StoryBeat,
  CharacterState,
  ThematicThread,
  RoutingDecision,
  UnifiedNarrativeState,
  // Factory functions
  createUniversePerspective,
  createThreeUniverseAnalysis,
  getPerspective,
  createNarrativePosition,
  createStoryBeat,
  createCharacterState,
  createThematicThread,
  createRoutingDecision,
  createUnifiedNarrativeState,
  // State manipulation
  addBeat,
  addRoutingDecision,
  updateCharacterArc,
  updateThemeStrength,
  getLastNBeats,
  calculateCoherence,
  shouldCreateNewEpisode,
  startNewEpisode,
  // Defaults
  getDefaultCharacters,
  getDefaultThemes,
  // Utilities
  createBeatFromWebhook,
  RedisKeys,
  serializeState,
  deserializeState,
} from "./schemas/unified_state_bridge.js";

export {
  // NCP types
  Moment,
  StoryPoint,
  NCPStoryBeat,
  Player,
  Perspective,
  NCPData,
  // Factory functions
  createMoment,
  createStoryPoint,
  createNCPStoryBeat,
  createPlayer,
  createPerspective,
  createNCPData,
  // Query functions
  getPlayer,
  getPerspectiveById,
  getStorybeat,
  getStorypoint,
  getPlayerStorybeats,
  getStorybeatsByEmotionalWeight,
  // Serialization
  parseNCPData,
  serializeNCPData,
} from "./schemas/ncp.js";

// ============================================================================
// Graphs - Processing Pipelines
// ============================================================================

export {
  // Three Universe Processor
  EventType,
  ProcessedEvent,
  ThreeUniverseState,
  AnalysisCallback,
  IntentKeywordMap,
  ThreeUniverseProcessorOptions,
  NO_EVIDENCE_CONFIDENCE,
  DEFAULT_MIN_CONFIDENCE_MARGIN,
  engineerIntentKeywords,
  ceremonyIntentKeywords,
  storyEngineIntentKeywords,
  analyzeEngineerPerspective,
  analyzeCeremonyPerspective,
  analyzeStoryEnginePerspective,
  synthesizePerspectives,
  ThreeUniverseProcessor,
} from "./graphs/three_universe_processor.js";

export {
  // Coherence Engine
  GapType,
  TensionType,
  GapSeverity,
  RoutingTarget,
  ComponentStatus,
  Gap,
  Tension,
  ComponentScore,
  CoherenceScore,
  TrinityAssessment,
  CoherenceEngineState,
  CoherenceResult,
  createGap,
  createTension,
  createComponentScore,
  createCoherenceScore,
  createTrinityAssessment,
  NarrativeCoherenceEngine,
} from "./graphs/coherence_engine.js";

export {
  // Structural Thinking Graph
  StructuralTensionSnapshot,
  ThinkingSection,
  ThinkingDocument,
  ReviewAnnotation,
  StructuralThinkingState,
  StructuralThinkingOptions,
  StructuralThinkingGraph,
} from "./graphs/structural_thinking_graph.js";

export {
  // Episode Retrieval Subgraph
  EpisodeBundleMinimal,
  RetrievalQuery,
  ConsentContext,
  RetrievalResult,
  EpisodeRetrievalState,
  EpisodeRetrievalOptions,
  EpisodeRetrievalSubgraph,
} from "./graphs/episode_retrieval.js";

// ============================================================================
// Nodes - Individual Processing Steps
// ============================================================================

export {
  // Emotional Classifier
  EmotionalTone,
  ClassificationResult,
  EmotionalClassificationState,
  TONE_KEYWORDS,
  EmotionalBeatClassifierNode,
  classifyEmotionalTone,
} from "./nodes/emotional_classifier.js";

// ============================================================================
// Integrations - External System Connections
// ============================================================================

export {
  // Redis State Manager
  RedisConfig,
  RedisClient,
  HealthCheckResult,
  createRedisConfig,
  NarrativeRedisManager,
  MockRedis,
  getNarrativeManager,
} from "./integrations/redis_state.js";

// ============================================================================
// Namespace Exports for Organized Access
// ============================================================================

export * as schemas from "./schemas/index.js";
export * as graphs from "./graphs/index.js";
export * as nodes from "./nodes/index.js";
export * as integrations from "./integrations/index.js";
