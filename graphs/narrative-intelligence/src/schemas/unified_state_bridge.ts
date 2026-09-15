/**
 * Unified Narrative State Bridge
 *
 * The shared contract between all six systems in the Narrative Intelligence Stack:
 * 1. LangGraph Narrative Intelligence Toolkit
 * 2. ava-langflow Universal Router
 * 3. ava-Flowise Agent Coordination
 * 4. LangChain/Langfuse Tracing
 * 5. Storytelling System
 * 6. Miadi-46 Event-Driven Platform
 */

/**
 * The three interpretive universes from multiverse_3act
 */
export enum Universe {
  ENGINEER = "engineer", // Mia - The Builder
  CEREMONY = "ceremony", // Ava8 - The Keeper
  STORY_ENGINE = "story_engine", // Miette - The Weaver
}

/**
 * Single universe's interpretation of an event
 */
export interface UniversePerspective {
  universe: Universe;
  intent: string;
  confidence: number;
  suggestedFlows: string[];
  context: Record<string, unknown>;
  /**
   * The terms that fired to produce this perspective's intent, in the order
   * they were detected. Lets a consumer explain (and correct) a classification
   * instead of trusting an opaque winner. Empty when the intent came from a
   * no-evidence fallback.
   */
  evidence: string[];
}

/**
 * Create a UniversePerspective
 */
export function createUniversePerspective(
  universe: Universe,
  intent: string,
  confidence: number,
  options: Partial<UniversePerspective> = {}
): UniversePerspective {
  return {
    universe,
    intent,
    confidence,
    suggestedFlows: options.suggestedFlows ?? [],
    context: options.context ?? {},
    evidence: options.evidence ?? [],
  };
}

/**
 * Complete three-universe analysis of an event
 */
export interface ThreeUniverseAnalysis {
  engineer: UniversePerspective;
  ceremony: UniversePerspective;
  storyEngine: UniversePerspective;
  leadUniverse: Universe;
  coherenceScore: number;
  timestamp: string;
  /**
   * Confidence distance between the winning universe and the runner-up. A small
   * margin means the lead is barely decided — see `ambiguous`.
   */
  leadMargin: number;
  /**
   * True when `leadMargin` falls below the processor's `minConfidenceMargin`.
   * The winner is still reported for backward compatibility, but a near-coinflip
   * (e.g. 0.5 vs 0.6) is flagged rather than asserted.
   */
  ambiguous: boolean;
}

/**
 * Create a ThreeUniverseAnalysis
 */
export function createThreeUniverseAnalysis(
  engineer: UniversePerspective,
  ceremony: UniversePerspective,
  storyEngine: UniversePerspective,
  leadUniverse: Universe,
  coherenceScore: number,
  options: { leadMargin?: number; ambiguous?: boolean } = {}
): ThreeUniverseAnalysis {
  return {
    engineer,
    ceremony,
    storyEngine,
    leadUniverse,
    coherenceScore,
    timestamp: new Date().toISOString(),
    leadMargin: options.leadMargin ?? 0,
    ambiguous: options.ambiguous ?? false,
  };
}

/**
 * Get perspective for a specific universe
 */
export function getPerspective(
  analysis: ThreeUniverseAnalysis,
  universe: Universe
): UniversePerspective {
  switch (universe) {
    case Universe.ENGINEER:
      return analysis.engineer;
    case Universe.CEREMONY:
      return analysis.ceremony;
    case Universe.STORY_ENGINE:
      return analysis.storyEngine;
  }
}

/**
 * Phases in the three-act structure
 */
export enum NarrativePhase {
  SETUP = "setup", // Act 1
  CONFRONTATION = "confrontation", // Act 2
  RESOLUTION = "resolution", // Act 3
}

/**
 * Narrative functions for story beats
 */
export enum NarrativeFunction {
  INCITING_INCIDENT = "inciting_incident",
  RISING_ACTION = "rising_action",
  TURNING_POINT = "turning_point",
  COMPLICATION = "complication",
  CRISIS = "crisis",
  CLIMAX = "climax",
  RESOLUTION = "resolution",
  DENOUEMENT = "denouement",
  BEAT = "beat", // Generic beat
}

/**
 * Safely convert a string to a NarrativeFunction enum value.
 * Defaults to NarrativeFunction.BEAT if the string does not match any enum value.
 */
export function getNarrativeFunctionFromString(
  funcString: string
): NarrativeFunction {
  const normalizedString = funcString.toUpperCase();
  if (Object.values(NarrativeFunction).includes(normalizedString as NarrativeFunction)) {
    return normalizedString as NarrativeFunction;
  }
  return NarrativeFunction.BEAT;
}


/**
 * Current position in the narrative journey
 */
export interface NarrativePosition {
  act: number;
  phase: NarrativePhase;
  currentBeatId?: string;
  beatCount: number;
  characterArcStrength: number;
  thematicResonance: number;
  emotionalTone: string;
  leadUniverse: Universe;
}

/**
 * Create a NarrativePosition with defaults
 */
export function createNarrativePosition(
  options: Partial<NarrativePosition> = {}
): NarrativePosition {
  return {
    act: options.act ?? 1,
    phase: options.phase ?? NarrativePhase.SETUP,
    currentBeatId: options.currentBeatId,
    beatCount: options.beatCount ?? 0,
    characterArcStrength: options.characterArcStrength ?? 0.5,
    thematicResonance: options.thematicResonance ?? 0.5,
    emotionalTone: options.emotionalTone ?? "neutral",
    leadUniverse: options.leadUniverse ?? Universe.STORY_ENGINE,
  };
}

/**
 * A single story beat with three-universe perspectives
 */
export interface StoryBeat {
  id: string;
  sequence: number;
  content: string;
  narrativeFunction: NarrativeFunction;
  act: number;

  // Three-universe analysis
  universeAnalysis?: ThreeUniverseAnalysis;
  leadUniverse: Universe;

  // Emotional/thematic data
  emotionalTone: string;
  thematicTags: string[];

  // Character data
  characterId?: string;
  characterArcImpact: number;

  // Metadata
  source: string;
  sourceEventId?: string;
  timestamp: string;

  // Enrichment tracking
  enrichmentsApplied: string[];
  qualityScore: number;
}

/**
 * Create a StoryBeat with defaults
 */
export function createStoryBeat(
  id: string,
  sequence: number,
  content: string,
  narrativeFunction: NarrativeFunction,
  act: number,
  options: Partial<StoryBeat> = {}
): StoryBeat {
  return {
    id,
    sequence,
    content,
    narrativeFunction,
    act,
    universeAnalysis: options.universeAnalysis,
    leadUniverse: options.leadUniverse ?? Universe.STORY_ENGINE,
    emotionalTone: options.emotionalTone ?? "neutral",
    thematicTags: options.thematicTags ?? [],
    characterId: options.characterId,
    characterArcImpact: options.characterArcImpact ?? 0.0,
    source: options.source ?? "generator",
    sourceEventId: options.sourceEventId,
    timestamp: options.timestamp ?? new Date().toISOString(),
    enrichmentsApplied: options.enrichmentsApplied ?? [],
    qualityScore: options.qualityScore ?? 0.5,
  };
}

/**
 * Character state tracking for arc continuity
 */
export interface CharacterState {
  id: string;
  name: string;
  archetype: string;
  universe: Universe;

  // Arc tracking
  arcPosition: number;
  initialState: string;
  currentState: string;
  growthPoints: Array<{
    timestamp: string;
    impact: number;
    description: string;
  }>;

  // Relationships
  relationships: string[];
}

/**
 * Create a CharacterState with defaults
 */
export function createCharacterState(
  id: string,
  name: string,
  archetype: string,
  universe: Universe,
  options: Partial<CharacterState> = {}
): CharacterState {
  return {
    id,
    name,
    archetype,
    universe,
    arcPosition: options.arcPosition ?? 0.0,
    initialState: options.initialState ?? "",
    currentState: options.currentState ?? "",
    growthPoints: options.growthPoints ?? [],
    relationships: options.relationships ?? [],
  };
}

/**
 * A thematic thread being tracked across the narrative
 */
export interface ThematicThread {
  id: string;
  name: string;
  description: string;

  // Tracking
  strength: number;
  tensionLevel: number;
  resolutionProgress: number;

  // Related beats
  beatIds: string[];
}

/**
 * Create a ThematicThread with defaults
 */
export function createThematicThread(
  id: string,
  name: string,
  description: string,
  options: Partial<ThematicThread> = {}
): ThematicThread {
  return {
    id,
    name,
    description,
    strength: options.strength ?? 0.5,
    tensionLevel: options.tensionLevel ?? 0.5,
    resolutionProgress: options.resolutionProgress ?? 0.0,
    beatIds: options.beatIds ?? [],
  };
}

/**
 * Record of a routing decision for tracing
 */
export interface RoutingDecision {
  id: string;
  backend: string;
  flow: string;
  universeAnalysis: ThreeUniverseAnalysis;
  narrativePosition: NarrativePosition;

  // Decision factors
  score: number;
  method: string;

  // Results
  success: boolean;
  resultSummary: string;
  latencyMs: number;

  timestamp: string;
}

/**
 * Create a RoutingDecision
 */
export function createRoutingDecision(
  id: string,
  backend: string,
  flow: string,
  universeAnalysis: ThreeUniverseAnalysis,
  narrativePosition: NarrativePosition,
  score: number,
  options: Partial<RoutingDecision> = {}
): RoutingDecision {
  return {
    id,
    backend,
    flow,
    universeAnalysis,
    narrativePosition,
    score,
    method: options.method ?? "narrative",
    success: options.success ?? true,
    resultSummary: options.resultSummary ?? "",
    latencyMs: options.latencyMs ?? 0.0,
    timestamp: options.timestamp ?? new Date().toISOString(),
  };
}

/**
 * The complete unified state shared across all systems.
 * This is THE contract that all six systems use to communicate.
 */
export interface UnifiedNarrativeState {
  // Identity
  storyId: string;
  sessionId: string;

  // Narrative position
  position: NarrativePosition;

  // Story content
  beats: StoryBeat[];

  // Character tracking
  characters: Record<string, CharacterState>;

  // Theme tracking
  themes: Record<string, ThematicThread>;

  // Routing history
  routingDecisions: RoutingDecision[];

  // Episode tracking
  currentEpisodeId?: string;
  episodeBeatsCount: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Metrics
  overallCoherence: number;
  emotionalArcStrength: number;
}

/**
 * Create a new UnifiedNarrativeState
 */
export function createUnifiedNarrativeState(
  storyId: string,
  sessionId: string,
  options: {
    includeDefaultCharacters?: boolean;
    includeDefaultThemes?: boolean;
  } = {}
): UnifiedNarrativeState {
  const state: UnifiedNarrativeState = {
    storyId,
    sessionId,
    position: createNarrativePosition(),
    beats: [],
    characters: {},
    themes: {},
    routingDecisions: [],
    episodeBeatsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    overallCoherence: 0.5,
    emotionalArcStrength: 0.5,
  };

  if (options.includeDefaultCharacters !== false) {
    state.characters = getDefaultCharacters();
  }

  if (options.includeDefaultThemes !== false) {
    state.themes = getDefaultThemes();
  }

  return state;
}

/**
 * Add a beat to the state
 */
export function addBeat(state: UnifiedNarrativeState, beat: StoryBeat): void {
  state.beats.push(beat);
  state.position.beatCount = state.beats.length;
  state.position.currentBeatId = beat.id;
  state.position.leadUniverse = beat.leadUniverse;

  // Update act based on narrative function
  if (beat.narrativeFunction === NarrativeFunction.INCITING_INCIDENT) {
    state.position.act = 1;
    state.position.phase = NarrativePhase.SETUP;
  } else if (
    beat.narrativeFunction === NarrativeFunction.TURNING_POINT ||
    beat.narrativeFunction === NarrativeFunction.CRISIS
  ) {
    state.position.act = 2;
    state.position.phase = NarrativePhase.CONFRONTATION;
  } else if (
    beat.narrativeFunction === NarrativeFunction.CLIMAX ||
    beat.narrativeFunction === NarrativeFunction.RESOLUTION
  ) {
    state.position.act = 3;
    state.position.phase = NarrativePhase.RESOLUTION;
  }

  state.episodeBeatsCount += 1;
  state.updatedAt = new Date().toISOString();
}

/**
 * Add a routing decision to the state
 */
export function addRoutingDecision(
  state: UnifiedNarrativeState,
  decision: RoutingDecision
): void {
  state.routingDecisions.push(decision);
  state.updatedAt = new Date().toISOString();
}

/**
 * Update character arc position
 */
export function updateCharacterArc(
  state: UnifiedNarrativeState,
  characterId: string,
  impact: number,
  description: string
): void {
  const character = state.characters[characterId];
  if (character) {
    character.arcPosition = Math.min(1.0, character.arcPosition + impact);
    character.growthPoints.push({
      timestamp: new Date().toISOString(),
      impact,
      description,
    });
    state.updatedAt = new Date().toISOString();
  }
}

/**
 * Update theme strength
 */
export function updateThemeStrength(
  state: UnifiedNarrativeState,
  themeId: string,
  strengthDelta: number
): void {
  const theme = state.themes[themeId];
  if (theme) {
    theme.strength = Math.max(0.0, Math.min(1.0, theme.strength + strengthDelta));
    state.updatedAt = new Date().toISOString();
  }
}

/**
 * Get the last n beats for context
 */
export function getLastNBeats(
  state: UnifiedNarrativeState,
  n: number = 5
): StoryBeat[] {
  return state.beats.slice(-n);
}

/**
 * Calculate overall narrative coherence
 */
export function calculateCoherence(state: UnifiedNarrativeState): number {
  if (state.routingDecisions.length === 0) {
    return 0.5;
  }

  const recentDecisions = state.routingDecisions.slice(-20);
  const coherences = recentDecisions.map((rd) => rd.universeAnalysis.coherenceScore);
  state.overallCoherence =
    coherences.reduce((a, b) => a + b, 0) / coherences.length;

  return state.overallCoherence;
}

/**
 * Check if we should create a new episode
 */
export function shouldCreateNewEpisode(state: UnifiedNarrativeState): boolean {
  if (state.episodeBeatsCount >= 12) {
    return true;
  }
  if (
    state.beats.length > 0 &&
    state.beats[state.beats.length - 1].narrativeFunction ===
      NarrativeFunction.RESOLUTION
  ) {
    return true;
  }
  return false;
}

/**
 * Start a new episode
 */
export function startNewEpisode(
  state: UnifiedNarrativeState,
  episodeId: string
): void {
  state.currentEpisodeId = episodeId;
  state.episodeBeatsCount = 0;
  state.updatedAt = new Date().toISOString();
}

/**
 * Get the three main archetypes from multiverse_3act
 */
export function getDefaultCharacters(): Record<string, CharacterState> {
  return {
    "the-builder": createCharacterState(
      "the-builder",
      "Mia",
      "The Builder",
      Universe.ENGINEER,
      {
        initialState: "Analytical, focused on structural integrity",
        currentState: "Analytical, focused on structural integrity",
      }
    ),
    "the-keeper": createCharacterState(
      "the-keeper",
      "Ava8",
      "The Keeper",
      Universe.CEREMONY,
      {
        initialState: "Reverent, guardian of relational protocols",
        currentState: "Reverent, guardian of relational protocols",
      }
    ),
    "the-weaver": createCharacterState(
      "the-weaver",
      "Miette",
      "The Weaver",
      Universe.STORY_ENGINE,
      {
        initialState: "Playful, sees narrative patterns in chaos",
        currentState: "Playful, sees narrative patterns in chaos",
      }
    ),
  };
}

/**
 * Get default thematic threads from multiverse_3act
 */
export function getDefaultThemes(): Record<string, ThematicThread> {
  return {
    integration: createThematicThread(
      "integration",
      "Integration Without Extraction",
      "The tension between connecting systems and respecting their autonomy"
    ),
    collaboration: createThematicThread(
      "collaboration",
      "Cross-Universe Collaboration",
      "Three perspectives learning to work together while maintaining distinction"
    ),
    coherence: createThematicThread(
      "coherence",
      "Narrative Coherence",
      "The gap between disconnected events and meaningful story"
    ),
  };
}

/**
 * Create a story beat from a webhook event
 */
export function createBeatFromWebhook(
  eventId: string,
  content: string,
  universeAnalysis: ThreeUniverseAnalysis,
  sequence: number
): StoryBeat {
  const storyEngineContext = universeAnalysis.storyEngine.context;
  const act = (storyEngineContext.act as number) || 2;

  const narrativeFunction: NarrativeFunction = getNarrativeFunctionFromString(
    universeAnalysis.storyEngine.intent
  );

  return createStoryBeat(
    `beat_${eventId}`,
    sequence,
    content,
    narrativeFunction,
    act,
    {
      universeAnalysis,
      leadUniverse: universeAnalysis.leadUniverse,
      source: "webhook",
      sourceEventId: eventId,
    }
  );
}

/**
 * Standard Redis key patterns for state storage
 */
export const RedisKeys = {
  state: (sessionId: string) => `ncp:state:${sessionId}`,
  currentState: () => "ncp:state:current",
  beats: (sessionId: string) => `ncp:beats:${sessionId}`,
  beat: (beatId: string) => `ncp:beat:${beatId}`,
  eventAnalysis: (eventId: string) => `ncp:event:${eventId}`,
  routingHistory: (sessionId: string) => `ncp:routing:${sessionId}`,
  episode: (episodeId: string) => `ncp:episode:${episodeId}`,
};

/**
 * Serialize state to JSON
 */
export function serializeState(state: UnifiedNarrativeState): string {
  return JSON.stringify(state);
}

/**
 * Deserialize state from JSON
 */
export function deserializeState(json: string): UnifiedNarrativeState {
  return JSON.parse(json) as UnifiedNarrativeState;
}
