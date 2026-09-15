/**
 * Redis State Manager for Narrative Intelligence
 *
 * Provides Redis-backed persistence for the UnifiedNarrativeState,
 * enabling cross-system state sharing and mid-story resumption.
 *
 * This integrates with:
 * - Miadi-46's Redis patterns (webhook event storage)
 * - ava-langflow's redis_state.py (session state)
 * - LangGraph checkpointing (for graph state persistence)
 */

import {
  UnifiedNarrativeState,
  StoryBeat,
  ThreeUniverseAnalysis,
  RoutingDecision,
  RedisKeys,
  createUnifiedNarrativeState,
  serializeState,
  deserializeState,
  addBeat,
  addRoutingDecision,
  startNewEpisode,
} from "../schemas/unified_state_bridge.js";

/**
 * Configuration for Redis connection.
 */
export interface RedisConfig {
  host: string;
  port: number;
  db: number;
  password?: string;
  url?: string; // Alternative: full redis URL

  // TTL settings
  stateTtlHours: number;
  beatTtlHours: number;
  eventCacheTtlHours: number;

  // Connection pool
  maxConnections: number;
  decodeResponses: boolean;
}

/**
 * Create a RedisConfig with defaults.
 */
export function createRedisConfig(
  options: Partial<RedisConfig> = {}
): RedisConfig {
  return {
    host: options.host ?? "localhost",
    port: options.port ?? 6379,
    db: options.db ?? 0,
    password: options.password,
    url: options.url,
    stateTtlHours: options.stateTtlHours ?? 168, // 1 week
    beatTtlHours: options.beatTtlHours ?? 720, // 30 days
    eventCacheTtlHours: options.eventCacheTtlHours ?? 24, // 1 day
    maxConnections: options.maxConnections ?? 10,
    decodeResponses: options.decodeResponses ?? true,
  };
}

/**
 * Redis client interface for compatibility with various Redis clients.
 */
export interface RedisClient {
  ping(): Promise<string>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<unknown>;
  setex(key: string, ttl: number, value: string): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  rpush(key: string, value: string): Promise<number>;
  lrange(key: string, start: number, end: number): Promise<string[]>;
  ltrim(key: string, start: number, end: number): Promise<unknown>;
  expire(key: string, ttl: number): Promise<unknown>;
  quit(): Promise<unknown>;
}

/**
 * Health check result.
 */
export interface HealthCheckResult {
  status: "healthy" | "unhealthy";
  connected: boolean;
  latencyMs?: number;
  error?: string;
  timestamp: string;
}

/**
 * Redis-backed state management for narrative intelligence.
 *
 * Responsibilities:
 * - Store and retrieve UnifiedNarrativeState
 * - Manage story beat persistence
 * - Cache three-universe analysis results
 * - Track routing decision history
 * - Enable cross-system state sharing
 *
 * @example
 * const manager = new NarrativeRedisManager(createRedisConfig());
 * await manager.connect();
 *
 * // Get or create state
 * const state = await manager.getOrCreateState("story_123", "session_456");
 *
 * // Add a beat
 * await manager.addBeat("session_456", beat);
 *
 * // Get current state
 * const state = await manager.getState("session_456");
 *
 * await manager.disconnect();
 */
export class NarrativeRedisManager {
  private config: RedisConfig;
  private redis: RedisClient | null = null;
  private connected = false;

  constructor(config?: RedisConfig) {
    this.config = config ?? createRedisConfig();
  }

  /**
   * Establish Redis connection.
   */
  async connect(client?: RedisClient): Promise<void> {
    if (client) {
      // Use provided client
      this.redis = client;
      await this.redis.ping();
      this.connected = true;
      return;
    }

    // Try to use ioredis if available
    try {
      // Dynamic import for optional Redis dependency
      let Redis: any;
      try {
        const ioredisModule = await import("ioredis");
        Redis = ioredisModule.default;
      } catch (importError) {
        console.warn("ioredis module not found. Falling back to MockRedis.", importError);
        // Fall through to mock if ioredis is not available
      }

      if (Redis) {
        const redisUrl =
          this.config.url ??
          `redis://${this.config.password ? `:${this.config.password}@` : ""}${this.config.host}:${this.config.port}/${this.config.db}`;

        const redis = new Redis(redisUrl);
        try {
          await redis.ping();
          this.redis = {
            ping: () => redis.ping(),
            get: (key) => redis.get(key),
            set: (key, value) => redis.set(key, value),
            setex: (key, ttl, value) => redis.setex(key, ttl, value),
            del: (...keys) => redis.del(...keys),
            keys: (pattern) => redis.keys(pattern),
            rpush: (key, value) => redis.rpush(key, value),
            lrange: (key, start, end) => redis.lrange(key, start, end),
            ltrim: (key, start, end) => redis.ltrim(key, start, end),
            expire: (key, ttl) => redis.expire(key, ttl),
            quit: () => redis.quit(),
          };
          this.connected = true;
          console.log("Connected to Redis for narrative state management");
          return;
        } catch (connectionError) {
          console.error("Failed to connect to Redis, using MockRedis instead:", connectionError);
          // Fall through to mock if connection fails
        }
      }
    } catch (unexpectedError) {
      console.error("An unexpected error occurred during Redis setup, using MockRedis instead:", unexpectedError);
      // Fall through to mock for any other unexpected errors
    }

    // Fall back to mock
    console.log("Redis not available, using mock mode");
    this.redis = new MockRedis();
    this.connected = true;
  }

  /**
   * Close Redis connection.
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
    this.connected = false;
  }

  // =========================================================================
  // State Management
  // =========================================================================

  /**
   * Retrieve narrative state for a session.
   */
  async getState(sessionId: string): Promise<UnifiedNarrativeState | null> {
    if (!this.redis) return null;

    const key = RedisKeys.state(sessionId);
    const data = await this.redis.get(key);

    if (data) {
      try {
        return deserializeState(data);
      } catch (e) {
        console.error(`Failed to deserialize state for ${sessionId}:`, e);
        return null;
      }
    }
    return null;
  }

  /**
   * Get existing state or create new one.
   */
  async getOrCreateState(
    storyId: string,
    sessionId: string,
    options: {
      includeDefaultCharacters?: boolean;
      includeDefaultThemes?: boolean;
    } = {}
  ): Promise<UnifiedNarrativeState> {
    const existing = await this.getState(sessionId);
    if (existing) {
      return existing;
    }

    // Create new state
    const state = createUnifiedNarrativeState(storyId, sessionId, options);

    // Save it
    await this.saveState(state);

    return state;
  }

  /**
   * Save narrative state to Redis.
   */
  async saveState(state: UnifiedNarrativeState): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const key = RedisKeys.state(state.sessionId);
      state.updatedAt = new Date().toISOString();

      const ttlSeconds = this.config.stateTtlHours * 3600;
      await this.redis.setex(key, ttlSeconds, serializeState(state));

      // Also update "current" pointer if this is the active state
      await this.redis.set(RedisKeys.currentState(), state.sessionId);

      return true;
    } catch (e) {
      console.error("Failed to save state:", e);
      return false;
    }
  }

  /**
   * Get the ID of the currently active session.
   */
  async getCurrentSessionId(): Promise<string | null> {
    if (!this.redis) return null;
    return this.redis.get(RedisKeys.currentState());
  }

  /**
   * Set the currently active session.
   */
  async setCurrentSession(sessionId: string): Promise<void> {
    if (this.redis) {
      await this.redis.set(RedisKeys.currentState(), sessionId);
    }
  }

  // =========================================================================
  // Beat Management
  // =========================================================================

  /**
   * Add a story beat to the session.
   */
  async addBeatToSession(
    sessionId: string,
    beat: StoryBeat
  ): Promise<boolean> {
    if (!this.redis) return false;

    try {
      // Store individual beat
      const beatKey = RedisKeys.beat(beat.id);
      const ttlSeconds = this.config.beatTtlHours * 3600;
      await this.redis.setex(beatKey, ttlSeconds, JSON.stringify(beat));

      // Add to session's beat list
      const beatsKey = RedisKeys.beats(sessionId);
      await this.redis.rpush(beatsKey, beat.id);
      await this.redis.expire(beatsKey, ttlSeconds);

      // Update state
      const state = await this.getState(sessionId);
      if (state) {
        addBeat(state, beat);
        await this.saveState(state);
      }

      return true;
    } catch (e) {
      console.error("Failed to add beat:", e);
      return false;
    }
  }

  /**
   * Retrieve a specific beat by ID.
   */
  async getBeat(beatId: string): Promise<StoryBeat | null> {
    if (!this.redis) return null;

    const key = RedisKeys.beat(beatId);
    const data = await this.redis.get(key);

    if (data) {
      try {
        return JSON.parse(data) as StoryBeat;
      } catch (e) {
        console.error(`Failed to deserialize beat ${beatId}:`, e);
        return null;
      }
    }
    return null;
  }

  /**
   * Get the most recent beats for a session.
   */
  async getRecentBeats(
    sessionId: string,
    count: number = 10
  ): Promise<StoryBeat[]> {
    if (!this.redis) return [];

    const beatsKey = RedisKeys.beats(sessionId);
    const beatIds = await this.redis.lrange(beatsKey, -count, -1);

    const beats: StoryBeat[] = [];
    for (const beatId of beatIds.reverse()) {
      // Most recent first
      const beat = await this.getBeat(beatId);
      if (beat) {
        beats.push(beat);
      }
    }

    return beats;
  }

  // =========================================================================
  // Event Analysis Caching
  // =========================================================================

  /**
   * Cache three-universe analysis for a webhook event.
   */
  async cacheEventAnalysis(
    eventId: string,
    analysis: ThreeUniverseAnalysis
  ): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const key = RedisKeys.eventAnalysis(eventId);
      const ttlSeconds = this.config.eventCacheTtlHours * 3600;
      await this.redis.setex(key, ttlSeconds, JSON.stringify(analysis));
      return true;
    } catch (e) {
      console.error("Failed to cache event analysis:", e);
      return false;
    }
  }

  /**
   * Retrieve cached analysis for an event.
   */
  async getCachedAnalysis(
    eventId: string
  ): Promise<ThreeUniverseAnalysis | null> {
    if (!this.redis) return null;

    const key = RedisKeys.eventAnalysis(eventId);
    const data = await this.redis.get(key);

    if (data) {
      try {
        return JSON.parse(data) as ThreeUniverseAnalysis;
      } catch (e) {
        console.error(`Failed to deserialize analysis for ${eventId}:`, e);
        return null;
      }
    }
    return null;
  }

  // =========================================================================
  // Routing History
  // =========================================================================

  /**
   * Record a routing decision for learning and tracing.
   */
  async recordRoutingDecision(
    sessionId: string,
    decision: RoutingDecision
  ): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const key = RedisKeys.routingHistory(sessionId);
      await this.redis.rpush(key, JSON.stringify(decision));

      // Keep only last 100 decisions per session
      await this.redis.ltrim(key, -100, -1);

      // Update state
      const state = await this.getState(sessionId);
      if (state) {
        addRoutingDecision(state, decision);
        await this.saveState(state);
      }

      return true;
    } catch (e) {
      console.error("Failed to record routing decision:", e);
      return false;
    }
  }

  /**
   * Get recent routing decisions for a session.
   */
  async getRoutingHistory(
    sessionId: string,
    count: number = 50
  ): Promise<RoutingDecision[]> {
    if (!this.redis) return [];

    const key = RedisKeys.routingHistory(sessionId);
    const dataList = await this.redis.lrange(key, -count, -1);

    const decisions: RoutingDecision[] = [];
    for (const data of dataList) {
      try {
        decisions.push(JSON.parse(data) as RoutingDecision);
      } catch (e) {
        console.warn("Failed to deserialize routing decision:", e);
      }
    }

    return decisions;
  }

  // =========================================================================
  // Episode Management
  // =========================================================================

  /**
   * Mark the start of a new episode.
   */
  async startNewEpisode(
    sessionId: string,
    episodeId: string
  ): Promise<boolean> {
    const state = await this.getState(sessionId);
    if (state) {
      startNewEpisode(state, episodeId);
      return this.saveState(state);
    }
    return false;
  }

  /**
   * Get all beats for an episode.
   */
  async getEpisodeBeats(episodeId: string): Promise<StoryBeat[]> {
    if (!this.redis) return [];

    const key = RedisKeys.episode(episodeId);
    const data = await this.redis.get(key);

    if (data) {
      try {
        const episodeData = JSON.parse(data);
        const beatIds = episodeData.beat_ids || [];
        const beats: StoryBeat[] = [];

        for (const beatId of beatIds) {
          const beat = await this.getBeat(beatId);
          if (beat) {
            beats.push(beat);
          }
        }
        return beats;
      } catch (e) {
        console.error("Failed to get episode beats:", e);
        return [];
      }
    }
    return [];
  }

  // =========================================================================
  // Utility Methods
  // =========================================================================

  /**
   * List all session IDs matching pattern.
   */
  async listSessions(pattern: string = "ncp:state:*"): Promise<string[]> {
    if (!this.redis) return [];

    const keys = await this.redis.keys(pattern);
    return keys
      .filter((k) => k !== "ncp:state:current")
      .map((k) => k.replace("ncp:state:", ""));
  }

  /**
   * Delete all data for a session.
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    if (!this.redis) return false;

    try {
      // Get beat IDs first
      const beatsKey = RedisKeys.beats(sessionId);
      const beatIds = await this.redis.lrange(beatsKey, 0, -1);

      // Delete beats
      for (const beatId of beatIds) {
        await this.redis.del(RedisKeys.beat(beatId));
      }

      // Delete session keys
      await this.redis.del(
        RedisKeys.state(sessionId),
        RedisKeys.beats(sessionId),
        RedisKeys.routingHistory(sessionId)
      );

      console.log(`Deleted session ${sessionId}`);
      return true;
    } catch (e) {
      console.error("Failed to delete session:", e);
      return false;
    }
  }

  /**
   * Check Redis connection health.
   */
  async healthCheck(): Promise<HealthCheckResult> {
    try {
      const start = Date.now();
      if (this.redis) {
        await this.redis.ping();
      }
      const latency = Date.now() - start;

      return {
        status: "healthy",
        connected: this.connected,
        latencyMs: latency,
        timestamp: new Date().toISOString(),
      };
    } catch (e) {
      return {
        status: "unhealthy",
        connected: this.connected,
        error: e instanceof Error ? e.message : String(e),
        timestamp: new Date().toISOString(),
      };
    }
  }
}

/**
 * Mock Redis for development/testing without real Redis.
 * Stores data in memory, mimics async Redis API.
 */
export class MockRedis implements RedisClient {
  private data: Map<string, string> = new Map();
  private lists: Map<string, string[]> = new Map();
  private expiry: Map<string, number> = new Map();

  async ping(): Promise<string> {
    return "PONG";
  }

  async get(key: string): Promise<string | null> {
    this.checkExpiry(key);
    return this.data.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<string> {
    this.data.set(key, value);
    return "OK";
  }

  async setex(key: string, ttl: number, value: string): Promise<string> {
    this.data.set(key, value);
    this.expiry.set(key, Date.now() + ttl * 1000);
    return "OK";
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.data.delete(key)) count++;
      if (this.lists.delete(key)) count++;
    }
    return count;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(
      "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$"
    );
    return [...this.data.keys(), ...this.lists.keys()].filter((k) =>
      regex.test(k)
    );
  }

  async rpush(key: string, value: string): Promise<number> {
    if (!this.lists.has(key)) {
      this.lists.set(key, []);
    }
    this.lists.get(key)!.push(value);
    return this.lists.get(key)!.length;
  }

  async lrange(key: string, start: number, end: number): Promise<string[]> {
    const list = this.lists.get(key) ?? [];
    const actualEnd = end === -1 ? list.length : end + 1;
    const actualStart = start < 0 ? Math.max(0, list.length + start) : start;
    return list.slice(actualStart, actualEnd);
  }

  async ltrim(key: string, start: number, end: number): Promise<string> {
    const list = this.lists.get(key);
    if (list) {
      const actualEnd = end === -1 ? list.length : end + 1;
      const actualStart = start < 0 ? Math.max(0, list.length + start) : start;
      this.lists.set(key, list.slice(actualStart, actualEnd));
    }
    return "OK";
  }

  async expire(key: string, ttl: number): Promise<number> {
    this.expiry.set(key, Date.now() + ttl * 1000);
    return 1;
  }

  async quit(): Promise<string> {
    return "OK";
  }

  private checkExpiry(key: string): void {
    const expiry = this.expiry.get(key);
    if (expiry && Date.now() > expiry) {
      this.data.delete(key);
      this.lists.delete(key);
      this.expiry.delete(key);
    }
  }
}

/**
 * Get a configured narrative Redis manager.
 */
export async function getNarrativeManager(
  redisUrl?: string
): Promise<NarrativeRedisManager> {
  const config = createRedisConfig(redisUrl ? { url: redisUrl } : {});
  const manager = new NarrativeRedisManager(config);
  await manager.connect();
  return manager;
}
