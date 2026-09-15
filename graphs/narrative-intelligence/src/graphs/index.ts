/**
 * Graph exports for narrative-intelligence
 */

// Three Universe Processor
export {
  // Enums
  EventType,
  // Interfaces
  ProcessedEvent,
  ThreeUniverseState,
  AnalysisCallback,
  // Functions
  engineerIntentKeywords,
  ceremonyIntentKeywords,
  storyEngineIntentKeywords,
  analyzeEngineerPerspective,
  analyzeCeremonyPerspective,
  analyzeStoryEnginePerspective,
  synthesizePerspectives,
  // Main class
  ThreeUniverseProcessor,
} from "./three_universe_processor.js";

// Coherence Engine
export {
  // Enums
  GapType,
  GapSeverity,
  RoutingTarget,
  // Types
  ComponentStatus,
  // Interfaces
  Gap,
  ComponentScore,
  CoherenceScore,
  TrinityAssessment,
  CoherenceEngineState,
  CoherenceResult,
  // Factory functions
  createGap,
  createComponentScore,
  createCoherenceScore,
  createTrinityAssessment,
  // Main class
  NarrativeCoherenceEngine,
} from "./coherence_engine.js";

// Structural Thinking Graph
export {
  // Interfaces
  StructuralTensionSnapshot,
  ThinkingSection,
  ThinkingDocument,
  ReviewAnnotation,
  StructuralThinkingState,
  StructuralThinkingOptions,
  // Main class
  StructuralThinkingGraph,
} from "./structural_thinking_graph.js";

// Episode Retrieval Subgraph
export {
  // Interfaces
  EpisodeBundleMinimal,
  RetrievalQuery,
  ConsentContext,
  RetrievalResult,
  EpisodeRetrievalState,
  EpisodeRetrievalOptions,
  // Main class
  EpisodeRetrievalSubgraph,
} from "./episode_retrieval.js";
