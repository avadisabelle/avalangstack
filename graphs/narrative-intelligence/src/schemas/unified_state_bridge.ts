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
 * The three perspectives from multiverse_3act: three readings of one event.
 * Stored values are the bare `engineer`, `ceremony` and `story_engine`.
 */
export enum PerspectiveType {
  ENGINEER = "engineer", // Mia - The Builder
  CEREMONY = "ceremony", // Ava8 - The Keeper
  STORY_ENGINE = "story_engine", // Miette - The Weaver
}

/**
 * @deprecated use PerspectiveType
 */
export const Universe = PerspectiveType;
/**
 * @deprecated use PerspectiveType
 */
export type Universe = PerspectiveType;

/**
 * Legacy spellings of the perspective values, mapped to the bare values.
 */
const LEGACY_PERSPECTIVE_VALUES: Record<string, PerspectiveType> = {
  "engineer-world": PerspectiveType.ENGINEER,
  "ceremony-world": PerspectiveType.CEREMONY,
  "story-engine-world": PerspectiveType.STORY_ENGINE,
};

const PERSPECTIVE_VALUES = new Set<string>(Object.values(PerspectiveType));

/**
 * Read a stored perspective value. Returns the bare value for `engineer`,
 * `ceremony` and `story_engine`, maps the legacy `engineer-world`,
 * `ceremony-world` and `story-engine-world` forms to them, and returns
 * `undefined` for anything else.
 */
export function normalizePerspectiveType(
  value: unknown
): PerspectiveType | undefined {
  if (typeof value !== "string") return undefined;
  if (PERSPECTIVE_VALUES.has(value)) return value as PerspectiveType;
  return LEGACY_PERSPECTIVE_VALUES[value];
}

/**
 * One perspective's reading of an event
 */
export interface PerspectiveReading {
  perspectiveType: PerspectiveType;
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
 * @deprecated use PerspectiveReading
 */
export type UniversePerspective = PerspectiveReading;

/**
 * Create a PerspectiveReading
 */
export function createPerspectiveReading(
  perspectiveType: PerspectiveType,
  intent: string,
  confidence: number,
  options: Partial<PerspectiveReading> = {}
): PerspectiveReading {
  return {
    perspectiveType,
    intent,
    confidence,
    suggestedFlows: options.suggestedFlows ?? [],
    context: options.context ?? {},
    evidence: options.evidence ?? [],
  };
}

/**
 * @deprecated use createPerspectiveReading
 */
export const createUniversePerspective = createPerspectiveReading;

/**
 * Complete three-perspective analysis of an event
 */
export interface ThreePerspectiveAnalysis {
  engineer: PerspectiveReading;
  ceremony: PerspectiveReading;
  storyEngine: PerspectiveReading;
  leadPerspective: PerspectiveType;
  coherenceScore: number;
  timestamp: string;
  /**
   * Confidence distance between the winning perspective and the runner-up. A
   * small margin means the lead is barely decided — see `ambiguous`.
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
 * @deprecated use ThreePerspectiveAnalysis
 */
export type ThreeUniverseAnalysis = ThreePerspectiveAnalysis;

/**
 * Create a ThreePerspectiveAnalysis
 */
export function createThreePerspectiveAnalysis(
  engineer: PerspectiveReading,
  ceremony: PerspectiveReading,
  storyEngine: PerspectiveReading,
  leadPerspective: PerspectiveType,
  coherenceScore: number,
  options: { leadMargin?: number; ambiguous?: boolean } = {}
): ThreePerspectiveAnalysis {
  return {
    engineer,
    ceremony,
    storyEngine,
    leadPerspective,
    coherenceScore,
    timestamp: new Date().toISOString(),
    leadMargin: options.leadMargin ?? 0,
    ambiguous: options.ambiguous ?? false,
  };
}

/**
 * @deprecated use createThreePerspectiveAnalysis
 */
export const createThreeUniverseAnalysis = createThreePerspectiveAnalysis;

/**
 * Get the reading for one perspective
 */
export function getPerspective(
  analysis: ThreePerspectiveAnalysis,
  perspectiveType: PerspectiveType
): PerspectiveReading {
  switch (perspectiveType) {
    case PerspectiveType.ENGINEER:
      return analysis.engineer;
    case PerspectiveType.CEREMONY:
      return analysis.ceremony;
    case PerspectiveType.STORY_ENGINE:
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
  leadPerspective: PerspectiveType;
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
    leadPerspective: options.leadPerspective ?? PerspectiveType.STORY_ENGINE,
  };
}

/**
 * A single story beat with its three-perspective analysis
 */
export interface StoryBeat {
  id: string;
  sequence: number;
  content: string;
  narrativeFunction: NarrativeFunction;
  act: number;

  // Three-perspective analysis
  perspectiveAnalysis?: ThreePerspectiveAnalysis;
  leadPerspective: PerspectiveType;

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
    perspectiveAnalysis: options.perspectiveAnalysis,
    leadPerspective: options.leadPerspective ?? PerspectiveType.STORY_ENGINE,
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
  perspectiveType: PerspectiveType;

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
  perspectiveType: PerspectiveType,
  options: Partial<CharacterState> = {}
): CharacterState {
  return {
    id,
    name,
    archetype,
    perspectiveType,
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
  perspectiveAnalysis: ThreePerspectiveAnalysis;
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
  perspectiveAnalysis: ThreePerspectiveAnalysis,
  narrativePosition: NarrativePosition,
  score: number,
  options: Partial<RoutingDecision> = {}
): RoutingDecision {
  return {
    id,
    backend,
    flow,
    perspectiveAnalysis,
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
  state.position.leadPerspective = beat.leadPerspective;

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
  // Routing history has no TTL, so decisions recorded before the perspective
  // rename carry `universeAnalysis`. Read either key.
  const coherences = recentDecisions.map(
    (rd) => readPerspectiveAnalysisField(rd as unknown as LooseRecord)!.coherenceScore
  );
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
      PerspectiveType.ENGINEER,
      {
        initialState: "Analytical, focused on structural integrity",
        currentState: "Analytical, focused on structural integrity",
      }
    ),
    "the-keeper": createCharacterState(
      "the-keeper",
      "Ava8",
      "The Keeper",
      PerspectiveType.CEREMONY,
      {
        initialState: "Reverent, guardian of relational protocols",
        currentState: "Reverent, guardian of relational protocols",
      }
    ),
    "the-weaver": createCharacterState(
      "the-weaver",
      "Miette",
      "The Weaver",
      PerspectiveType.STORY_ENGINE,
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
      "Cross-Perspective Collaboration",
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
  perspectiveAnalysis: ThreePerspectiveAnalysis,
  sequence: number
): StoryBeat {
  const storyEngineContext = perspectiveAnalysis.storyEngine.context;
  const act = (storyEngineContext.act as number) || 2;

  const narrativeFunction: NarrativeFunction = getNarrativeFunctionFromString(
    perspectiveAnalysis.storyEngine.intent
  );

  return createStoryBeat(
    `beat_${eventId}`,
    sequence,
    content,
    narrativeFunction,
    act,
    {
      perspectiveAnalysis,
      leadPerspective: perspectiveAnalysis.leadPerspective,
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
 * Deserialize state from JSON. Accepts states stored before the perspective
 * rename (see {@link normalizeUnifiedNarrativeState}).
 */
export function deserializeState(json: string): UnifiedNarrativeState {
  return normalizeUnifiedNarrativeState(JSON.parse(json));
}

// ============================================================================
// Readers for stored records
//
// Redis values written before the perspective rename carry `universe`,
// `leadUniverse` and `universeAnalysis`. The readers below accept those keys
// and the current ones, return records with the current keys only, and map
// legacy `*-world` perspective values to the bare values.
// ============================================================================

type LooseRecord = Record<string, unknown>;

function isRecord(value: unknown): value is LooseRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Pick a perspective value from the current key or the legacy key. Known
 * values are normalized. An unknown value is kept as stored.
 */
function readPerspectiveField(
  record: LooseRecord,
  key: string,
  legacyKey: string
): PerspectiveType | undefined {
  const raw = record[key] ?? record[legacyKey];
  return normalizePerspectiveType(raw) ?? (raw as PerspectiveType | undefined);
}

function readPerspectiveAnalysisField(
  record: LooseRecord
): ThreePerspectiveAnalysis | undefined {
  const raw = record.perspectiveAnalysis ?? record.universeAnalysis;
  return raw === undefined ? undefined : normalizeThreePerspectiveAnalysis(raw);
}

/**
 * Read a stored perspective reading. Accepts `perspectiveType` or the legacy
 * `universe` key.
 */
export function normalizePerspectiveReading(raw: unknown): PerspectiveReading {
  if (!isRecord(raw)) return raw as PerspectiveReading;
  const { universe: _legacy, ...rest } = raw;
  return {
    ...rest,
    perspectiveType: readPerspectiveField(raw, "perspectiveType", "universe"),
  } as PerspectiveReading;
}

/**
 * Read a stored three-perspective analysis (for example an `ncp:event:*`
 * value). Accepts `leadPerspective` or the legacy `leadUniverse` key, and
 * legacy keys on each reading.
 */
export function normalizeThreePerspectiveAnalysis(
  raw: unknown
): ThreePerspectiveAnalysis {
  if (!isRecord(raw)) return raw as ThreePerspectiveAnalysis;
  const { leadUniverse: _legacy, ...rest } = raw;
  const analysis: LooseRecord = {
    ...rest,
    leadPerspective: readPerspectiveField(raw, "leadPerspective", "leadUniverse"),
  };
  for (const key of ["engineer", "ceremony", "storyEngine"]) {
    if (raw[key] !== undefined) {
      analysis[key] = normalizePerspectiveReading(raw[key]);
    }
  }
  return analysis as unknown as ThreePerspectiveAnalysis;
}

function normalizeNarrativePosition(raw: unknown): NarrativePosition {
  if (!isRecord(raw)) return raw as NarrativePosition;
  const { leadUniverse: _legacy, ...rest } = raw;
  return {
    ...rest,
    leadPerspective:
      readPerspectiveField(raw, "leadPerspective", "leadUniverse") ??
      PerspectiveType.STORY_ENGINE,
  } as NarrativePosition;
}

/**
 * Read a stored story beat (for example an `ncp:beat:*` value). Accepts
 * `leadPerspective` / `perspectiveAnalysis` or the legacy `leadUniverse` /
 * `universeAnalysis` keys.
 */
export function normalizeStoryBeat(raw: unknown): StoryBeat {
  if (!isRecord(raw)) return raw as StoryBeat;
  const { leadUniverse: _lead, universeAnalysis: _analysis, ...rest } = raw;
  const beat: LooseRecord = {
    ...rest,
    leadPerspective:
      readPerspectiveField(raw, "leadPerspective", "leadUniverse") ??
      PerspectiveType.STORY_ENGINE,
  };
  const analysis = readPerspectiveAnalysisField(raw);
  if (analysis !== undefined) {
    beat.perspectiveAnalysis = analysis;
  }
  return beat as unknown as StoryBeat;
}

function normalizeCharacterState(raw: unknown): CharacterState {
  if (!isRecord(raw)) return raw as CharacterState;
  const { universe: _legacy, ...rest } = raw;
  return {
    ...rest,
    perspectiveType: readPerspectiveField(raw, "perspectiveType", "universe"),
  } as CharacterState;
}

/**
 * Read a stored routing decision (for example an `ncp:routing:*` entry).
 * Accepts `perspectiveAnalysis` or the legacy `universeAnalysis` key.
 */
export function normalizeRoutingDecision(raw: unknown): RoutingDecision {
  if (!isRecord(raw)) return raw as RoutingDecision;
  const { universeAnalysis: _legacy, ...rest } = raw;
  const decision: LooseRecord = { ...rest };
  const analysis = readPerspectiveAnalysisField(raw);
  if (analysis !== undefined) {
    decision.perspectiveAnalysis = analysis;
  }
  if (raw.narrativePosition !== undefined) {
    decision.narrativePosition = normalizeNarrativePosition(raw.narrativePosition);
  }
  return decision as unknown as RoutingDecision;
}

/**
 * Read a stored unified state (an `ncp:state:*` value), normalizing its
 * position, beats, characters and routing decisions.
 */
export function normalizeUnifiedNarrativeState(
  raw: unknown
): UnifiedNarrativeState {
  if (!isRecord(raw)) return raw as UnifiedNarrativeState;
  const state: LooseRecord = { ...raw };
  if (raw.position !== undefined) {
    state.position = normalizeNarrativePosition(raw.position);
  }
  if (Array.isArray(raw.beats)) {
    state.beats = raw.beats.map(normalizeStoryBeat);
  }
  if (Array.isArray(raw.routingDecisions)) {
    state.routingDecisions = raw.routingDecisions.map(normalizeRoutingDecision);
  }
  if (isRecord(raw.characters)) {
    state.characters = Object.fromEntries(
      Object.entries(raw.characters).map(([id, character]) => [
        id,
        normalizeCharacterState(character),
      ])
    );
  }
  return state as unknown as UnifiedNarrativeState;
}
