/**
 * Graph exports for narrative-intelligence
 */

// Three-Perspective Processor
export {
  // Enums
  EventType,
  // Interfaces
  ProcessedEvent,
  ThreePerspectiveState,
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
  ThreePerspectiveProcessor,
  // Deprecated aliases (pre-rename names)
  ThreeUniverseState,
  ThreeUniverseProcessor,
} from "./three_perspective_processor.js";

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
