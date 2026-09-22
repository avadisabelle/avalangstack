/**
 * Schema exports for narrative-intelligence
 */

// Unified State Bridge
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
} from "./unified_state_bridge.js";

// NCP types
export {
  // Interfaces
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
} from "./ncp.js";
