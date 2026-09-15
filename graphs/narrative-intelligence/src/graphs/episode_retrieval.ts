/**
 * Episode Retrieval Subgraph
 *
 * A consent-gated episode retrieval system that finds episodes by keyword overlap,
 * time range, speaker, and direction — returning results only when consent is granted.
 *
 * Features:
 * - Keyword-based relevance scoring (no LLM)
 * - Consent ceremony gate (granted / pending / revoked)
 * - Time range, speaker, and direction filtering
 * - Results ranked by relevance score
 */

// =============================================================================
// Types
// =============================================================================

export interface EpisodeBundleMinimal {
  id: string;
  title: string;
  sessionId: string;
  createdAt: string;
  tags: string[];
  summary: string;
  kinship: {
    speakers: string[];
    roles: string[];
    consent: "granted" | "pending" | "revoked";
  };
}

export interface RetrievalQuery {
  queryText: string;
  timeRange?: { start: string; end: string };
  speakers?: string[];
  directions?: Array<"east" | "south" | "west" | "north">;
  maxResults?: number;
}

export interface ConsentContext {
  requesterId: string;
  purpose: string;
  consentStatus: "granted" | "pending" | "revoked";
}

export interface RetrievalResult {
  episodeId: string;
  title: string;
  relevanceScore: number;
  matchedKeywords: string[];
  sessionId: string;
  createdAt: string;
  speakers: string[];
}

export interface EpisodeRetrievalState {
  query: RetrievalQuery;
  consent: ConsentContext;
  episodes: EpisodeBundleMinimal[];
  results?: RetrievalResult[];
  gateVerdict?: "allowed" | "denied" | "escalate";
  error?: string;
}

export interface EpisodeRetrievalOptions {
  defaultMaxResults?: number;
  minRelevanceScore?: number;
}

// =============================================================================
// Direction Keywords (reuse same 4 dimensions)
// =============================================================================

const DIRECTION_KEYWORDS: Record<string, string[]> = {
  east: [
    "vision", "picture", "see", "observe", "snapshot", "perspective",
    "awareness", "illuminate", "sunrise", "beginning",
  ],
  south: [
    "draft", "create", "build", "grow", "nurture", "develop",
    "youth", "energy", "experiment", "prototype",
  ],
  west: [
    "review", "reflect", "assess", "evaluate", "introspect",
    "harvest", "mature", "wisdom", "sunset", "balance",
  ],
  north: [
    "revise", "complete", "finalize", "wisdom", "elder",
    "integrate", "synthesize", "whole", "resolution", "north",
  ],
};

// =============================================================================
// Node 1: Consent Gate
// =============================================================================

function consentGate(state: EpisodeRetrievalState): EpisodeRetrievalState {
  const { consent } = state;

  if (consent.consentStatus === "granted") {
    return { ...state, gateVerdict: "allowed" };
  }

  if (consent.consentStatus === "pending") {
    return {
      ...state,
      gateVerdict: "escalate",
      results: [],
    };
  }

  // Revoked
  return {
    ...state,
    gateVerdict: "denied",
    results: [],
  };
}

// =============================================================================
// Node 2: Filter Episodes
// =============================================================================

function filterEpisodes(
  state: EpisodeRetrievalState
): EpisodeRetrievalState {
  if (state.gateVerdict !== "allowed") {
    return state;
  }

  const { query, episodes } = state;
  let filtered = [...episodes];

  // Filter by episode-level consent
  filtered = filtered.filter((ep) => ep.kinship.consent === "granted");

  // Filter by time range
  if (query.timeRange) {
    const startTime = new Date(query.timeRange.start).getTime();
    const endTime = new Date(query.timeRange.end).getTime();

    filtered = filtered.filter((ep) => {
      const epTime = new Date(ep.createdAt).getTime();
      return epTime >= startTime && epTime <= endTime;
    });
  }

  // Filter by speakers
  if (query.speakers && query.speakers.length > 0) {
    const querySpakers = new Set(
      query.speakers.map((s) => s.toLowerCase())
    );
    filtered = filtered.filter((ep) =>
      ep.kinship.speakers.some((s) => querySpakers.has(s.toLowerCase()))
    );
  }

  return { ...state, episodes: filtered };
}

// =============================================================================
// Node 3: Score and Rank
// =============================================================================

function scoreAndRank(state: EpisodeRetrievalState): EpisodeRetrievalState {
  if (state.gateVerdict !== "allowed") {
    return state;
  }

  const { query, episodes } = state;
  const queryLower = query.queryText.toLowerCase();
  const queryTerms = queryLower
    .split(/\s+/)
    .filter((t) => t.length > 2);

  // Collect direction keywords if filtered
  const directionTerms: string[] = [];
  if (query.directions && query.directions.length > 0) {
    for (const dir of query.directions) {
      const keywords = DIRECTION_KEYWORDS[dir];
      if (keywords) {
        directionTerms.push(...keywords);
      }
    }
  }

  const scored: RetrievalResult[] = [];

  for (const ep of episodes) {
    const matchedKeywords: string[] = [];

    // Score by tag overlap
    const tagsLower = ep.tags.map((t) => t.toLowerCase());
    for (const term of queryTerms) {
      if (tagsLower.some((tag) => tag.includes(term))) {
        matchedKeywords.push(term);
      }
    }

    // Score by summary keyword overlap
    const summaryLower = ep.summary.toLowerCase();
    for (const term of queryTerms) {
      if (summaryLower.includes(term) && !matchedKeywords.includes(term)) {
        matchedKeywords.push(term);
      }
    }

    // Score by title keyword overlap
    const titleLower = ep.title.toLowerCase();
    for (const term of queryTerms) {
      if (titleLower.includes(term) && !matchedKeywords.includes(term)) {
        matchedKeywords.push(term);
      }
    }

    // Bonus for direction keyword matches
    let directionBonus = 0;
    if (directionTerms.length > 0) {
      const allText = `${titleLower} ${summaryLower} ${tagsLower.join(" ")}`;
      for (const dkw of directionTerms) {
        if (allText.includes(dkw)) {
          directionBonus += 0.05;
        }
      }
    }

    // Calculate relevance score
    const baseScore =
      queryTerms.length > 0
        ? matchedKeywords.length / queryTerms.length
        : 0;

    const relevanceScore = Math.round(
      Math.min(1.0, baseScore + directionBonus) * 100
    ) / 100;

    if (relevanceScore > 0 || matchedKeywords.length > 0) {
      scored.push({
        episodeId: ep.id,
        title: ep.title,
        relevanceScore,
        matchedKeywords,
        sessionId: ep.sessionId,
        createdAt: ep.createdAt,
        speakers: ep.kinship.speakers,
      });
    }
  }

  // Sort by relevance descending
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return { ...state, results: scored };
}

// =============================================================================
// Node 4: Limit Results
// =============================================================================

function limitResults(
  state: EpisodeRetrievalState,
  defaultMax: number,
  minScore: number
): EpisodeRetrievalState {
  if (!state.results) {
    return state;
  }

  const maxResults = state.query.maxResults ?? defaultMax;

  const filtered = state.results
    .filter((r) => r.relevanceScore >= minScore)
    .slice(0, maxResults);

  return { ...state, results: filtered };
}

// =============================================================================
// Main Class
// =============================================================================

/**
 * Episode Retrieval Subgraph — consent-gated episode search.
 *
 * Filters and ranks episodes by keyword relevance, time range, speakers,
 * and direction — but only when consent is granted.
 *
 * @example
 * const subgraph = new EpisodeRetrievalSubgraph();
 * const result = subgraph.retrieve(
 *   { queryText: "ceremony opening", maxResults: 5 },
 *   { requesterId: "agent-1", purpose: "analysis", consentStatus: "granted" },
 *   episodes
 * );
 * console.log(result.results); // ranked matches
 * console.log(result.gateVerdict); // "allowed"
 */
export class EpisodeRetrievalSubgraph {
  private defaultMaxResults: number;
  private minRelevanceScore: number;

  constructor(options: EpisodeRetrievalOptions = {}) {
    this.defaultMaxResults = options.defaultMaxResults ?? 10;
    this.minRelevanceScore = options.minRelevanceScore ?? 0.0;
  }

  /**
   * Retrieve episodes matching the query, gated by consent.
   */
  retrieve(
    query: RetrievalQuery,
    consent: ConsentContext,
    episodes: EpisodeBundleMinimal[]
  ): EpisodeRetrievalState {
    let state: EpisodeRetrievalState = {
      query,
      consent,
      episodes,
    };

    // Gate — check consent
    state = consentGate(state);
    if (state.gateVerdict !== "allowed") {
      return state;
    }

    // Filter — apply time/speaker/consent filters
    state = filterEpisodes(state);

    // Score — keyword relevance ranking
    state = scoreAndRank(state);

    // Limit — trim to maxResults
    state = limitResults(state, this.defaultMaxResults, this.minRelevanceScore);

    return state;
  }

  /**
   * Access the configured default max results.
   */
  getDefaultMaxResults(): number {
    return this.defaultMaxResults;
  }

  /**
   * Access the configured minimum relevance score.
   */
  getMinRelevanceScore(): number {
    return this.minRelevanceScore;
  }
}
