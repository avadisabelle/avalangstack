/**
 * Narrative Context Protocol (NCP) Types
 *
 * These interfaces define the structure of narrative data following the NCP specification.
 */

/**
 * A specific moment or event within a story beat.
 */
export interface Moment {
  momentId: string;
  description: string;
  timestamp?: string;
  metadata: Record<string, unknown>;
}

/**
 * Create a Moment with defaults
 */
export function createMoment(
  momentId: string,
  description: string,
  options: Partial<Moment> = {}
): Moment {
  return {
    momentId,
    description,
    timestamp: options.timestamp,
    metadata: options.metadata ?? {},
  };
}

/**
 * A key story point or plot point in the narrative.
 */
export interface StoryPoint {
  storypointId: string;
  title: string;
  description: string;
  type?: string; // e.g., 'inciting_incident', 'climax'
  relatedPlayers: string[];
  metadata: Record<string, unknown>;
}

/**
 * Create a StoryPoint with defaults
 */
export function createStoryPoint(
  storypointId: string,
  title: string,
  description: string,
  options: Partial<StoryPoint> = {}
): StoryPoint {
  return {
    storypointId,
    title,
    description,
    type: options.type,
    relatedPlayers: options.relatedPlayers ?? [],
    metadata: options.metadata ?? {},
  };
}

/**
 * A story beat representing a unit of narrative progression.
 */
export interface NCPStoryBeat {
  storybeatId: string;
  title: string;
  description: string;
  emotionalWeight?: string; // e.g., 'Devastating', 'Hopeful', 'Tense'
  moments: Moment[];
  relatedPlayers: string[];
  relatedStorypoints: string[];
  metadata: Record<string, unknown>;
}

/**
 * Create an NCPStoryBeat with defaults
 */
export function createNCPStoryBeat(
  storybeatId: string,
  title: string,
  description: string,
  options: Partial<NCPStoryBeat> = {}
): NCPStoryBeat {
  return {
    storybeatId,
    title,
    description,
    emotionalWeight: options.emotionalWeight,
    moments: options.moments ?? [],
    relatedPlayers: options.relatedPlayers ?? [],
    relatedStorypoints: options.relatedStorypoints ?? [],
    metadata: options.metadata ?? {},
  };
}

/**
 * A character or entity in the narrative.
 */
export interface Player {
  playerId: string;
  name: string;
  wound?: string; // The character's wound or trauma
  desire?: string; // The character's primary desire or goal
  arc?: string; // Description of the character's arc or transformation
  role?: string; // e.g., 'protagonist', 'antagonist'
  metadata: Record<string, unknown>;
}

/**
 * Create a Player with defaults
 */
export function createPlayer(
  playerId: string,
  name: string,
  options: Partial<Player> = {}
): Player {
  return {
    playerId,
    name,
    wound: options.wound,
    desire: options.desire,
    arc: options.arc,
    role: options.role,
    metadata: options.metadata ?? {},
  };
}

/**
 * A thematic perspective or lens through which to view the narrative.
 */
export interface Perspective {
  perspectiveId: string;
  name: string;
  description: string;
  thematicQuestion?: string; // The central question this perspective explores
  tension?: string; // e.g., 'Safety vs Vulnerability'
  metadata: Record<string, unknown>;
}

/**
 * Create a Perspective with defaults
 */
export function createPerspective(
  perspectiveId: string,
  name: string,
  description: string,
  options: Partial<Perspective> = {}
): Perspective {
  return {
    perspectiveId,
    name,
    description,
    thematicQuestion: options.thematicQuestion,
    tension: options.tension,
    metadata: options.metadata ?? {},
  };
}

/**
 * Complete Narrative Context Protocol data structure.
 */
export interface NCPData {
  title: string;
  author?: string;
  version: string;
  players: Player[];
  perspectives: Perspective[];
  storybeats: NCPStoryBeat[];
  storypoints: StoryPoint[];
  metadata: Record<string, unknown>;
}

/**
 * Create an NCPData structure with defaults
 */
export function createNCPData(
  title: string,
  options: Partial<NCPData> = {}
): NCPData {
  return {
    title,
    author: options.author,
    version: options.version ?? "1.0",
    players: options.players ?? [],
    perspectives: options.perspectives ?? [],
    storybeats: options.storybeats ?? [],
    storypoints: options.storypoints ?? [],
    metadata: options.metadata ?? {},
  };
}

/**
 * Get a player by ID from NCP data
 */
export function getPlayer(data: NCPData, playerId: string): Player | undefined {
  return data.players.find((p) => p.playerId === playerId);
}

/**
 * Get a perspective by ID from NCP data
 */
export function getPerspectiveById(
  data: NCPData,
  perspectiveId: string
): Perspective | undefined {
  return data.perspectives.find((p) => p.perspectiveId === perspectiveId);
}

/**
 * Get a story beat by ID from NCP data
 */
export function getStorybeat(
  data: NCPData,
  storybeatId: string
): NCPStoryBeat | undefined {
  return data.storybeats.find((sb) => sb.storybeatId === storybeatId);
}

/**
 * Get a story point by ID from NCP data
 */
export function getStorypoint(
  data: NCPData,
  storypointId: string
): StoryPoint | undefined {
  return data.storypoints.find((sp) => sp.storypointId === storypointId);
}

/**
 * Get all story beats involving a specific player
 */
export function getPlayerStorybeats(
  data: NCPData,
  playerId: string
): NCPStoryBeat[] {
  return data.storybeats.filter((sb) => sb.relatedPlayers.includes(playerId));
}

/**
 * Get all story beats with a specific emotional weight
 */
export function getStorybeatsByEmotionalWeight(
  data: NCPData,
  emotionalWeight: string
): NCPStoryBeat[] {
  return data.storybeats.filter((sb) => sb.emotionalWeight === emotionalWeight);
}

/**
 * Parse NCP data from JSON
 */
export function parseNCPData(json: string): NCPData {
  const raw = JSON.parse(json);

  // Convert snake_case from Python to camelCase
  return {
    title: raw.title,
    author: raw.author,
    version: raw.version ?? "1.0",
    players: (raw.players ?? []).map((p: Record<string, unknown>) => ({
      playerId: p.player_id ?? p.playerId,
      name: p.name,
      wound: p.wound,
      desire: p.desire,
      arc: p.arc,
      role: p.role,
      metadata: p.metadata ?? {},
    })),
    perspectives: (raw.perspectives ?? []).map((p: Record<string, unknown>) => ({
      perspectiveId: p.perspective_id ?? p.perspectiveId,
      name: p.name,
      description: p.description,
      thematicQuestion: p.thematic_question ?? p.thematicQuestion,
      tension: p.tension,
      metadata: p.metadata ?? {},
    })),
    storybeats: (raw.storybeats ?? []).map((sb: Record<string, unknown>) => ({
      storybeatId: sb.storybeat_id ?? sb.storybeatId,
      title: sb.title,
      description: sb.description,
      emotionalWeight: sb.emotional_weight ?? sb.emotionalWeight,
      moments: ((sb.moments ?? []) as Record<string, unknown>[]).map((m) => ({
        momentId: m.moment_id ?? m.momentId,
        description: m.description,
        timestamp: m.timestamp,
        metadata: m.metadata ?? {},
      })),
      relatedPlayers: sb.related_players ?? sb.relatedPlayers ?? [],
      relatedStorypoints: sb.related_storypoints ?? sb.relatedStorypoints ?? [],
      metadata: sb.metadata ?? {},
    })),
    storypoints: (raw.storypoints ?? []).map((sp: Record<string, unknown>) => ({
      storypointId: sp.storypoint_id ?? sp.storypointId,
      title: sp.title,
      description: sp.description,
      type: sp.type,
      relatedPlayers: sp.related_players ?? sp.relatedPlayers ?? [],
      metadata: sp.metadata ?? {},
    })),
    metadata: raw.metadata ?? {},
  };
}

/**
 * Serialize NCP data to JSON
 */
export function serializeNCPData(data: NCPData): string {
  return JSON.stringify(data);
}
