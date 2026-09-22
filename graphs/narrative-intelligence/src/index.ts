/**
 * @ava/narrative-intelligence
 *
 * Narrative Intelligence Toolkit for JavaScript/TypeScript
 *
 * This package provides the core narrative intelligence components:
 * - Three-Perspective Processing (Engineer/Ceremony/Story Engine readings of each event)
 * - Narrative Coherence Analysis
 * - Story Beat Classification
 * - State Management with Redis
 *
 * Port of the Python narrative-intelligence package with full feature parity.
 *
 * @example
 * import {
 *   ThreePerspectiveProcessor,
 *   NarrativeCoherenceEngine,
 *   createUnifiedNarrativeState,
 * } from "@ava/narrative-intelligence";
 *
 * // Read an event from three perspectives
 * const processor = new ThreePerspectiveProcessor();
 * const analysis = processor.process({ content: "Add new feature" }, "github.push");
 * console.log(`Lead perspective: ${analysis.leadPerspective}`);
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
  PerspectiveType,
  NarrativePhase,
  NarrativeFunction,
  // Interfaces
  PerspectiveReading,
  ThreePerspectiveAnalysis,
  NarrativePosition,
  StoryBeat,
  CharacterState,
  ThematicThread,
  RoutingDecision,
  UnifiedNarrativeState,
  // Factory functions
  createPerspectiveReading,
  createThreePerspectiveAnalysis,
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
  // Readers for stored records (accept pre-rename keys)
  normalizePerspectiveType,
  normalizePerspectiveReading,
  normalizeThreePerspectiveAnalysis,
  normalizeStoryBeat,
  normalizeRoutingDecision,
  normalizeUnifiedNarrativeState,
  // Deprecated aliases (pre-rename names)
  Universe,
  UniversePerspective,
  ThreeUniverseAnalysis,
  createUniversePerspective,
  createThreeUniverseAnalysis,
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
  // Three-Perspective Processor
  EventType,
  ProcessedEvent,
  ThreePerspectiveState,
  AnalysisCallback,
  IntentKeywordMap,
  ThreePerspectiveProcessorOptions,
  NO_EVIDENCE_CONFIDENCE,
  DEFAULT_MIN_CONFIDENCE_MARGIN,
  engineerIntentKeywords,
  ceremonyIntentKeywords,
  storyEngineIntentKeywords,
  analyzeEngineerPerspective,
  analyzeCeremonyPerspective,
  analyzeStoryEnginePerspective,
  synthesizePerspectives,
  ThreePerspectiveProcessor,
  // Deprecated aliases (pre-rename names)
  ThreeUniverseState,
  ThreeUniverseProcessorOptions,
  ThreeUniverseProcessor,
} from "./graphs/three_perspective_processor.js";

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
