/**
 * Shared constants for the Inquiry Routing Engine.
 *
 * Direction-to-source mappings, relational keywords for classification,
 * and source channel descriptors.
 */

import type { InquirySource } from "ava-langchain-inquiry-routing";

// =============================================================================
// Direction ↔ Source Defaults
// =============================================================================

/**
 * Default source channel for each direction.
 *
 * Canonical Medicine Wheel mapping (medicine-wheel-pi/agents/inquiry-router.md):
 *   East=Vision, South=Action, West=Synthesis, North=Structure
 *
 * NOTE: mcp-pde uses a variant mapping (WEST=Validation, NORTH=Action).
 * The source-channel affinities below align with inquiry content patterns
 * rather than the directional labels themselves, so they hold under either mapping.
 *
 * - EAST (Vision): Local knowledge base via QMD semantic search
 * - SOUTH (Action): Academic deep-search for learning
 * - WEST (Synthesis): Local knowledge base for reflective verification
 * - NORTH (Structure): Workspace scanning for execution context
 */
export const DIRECTION_SOURCE_DEFAULTS: Record<string, string> = {
  east: "qmd-local",
  south: "deep-search-academic",
  west: "qmd-local",
  north: "workspace-scan",
};

// =============================================================================
// Relational Classification Keywords
// =============================================================================

/**
 * Keywords indicating relational or ceremonial content
 * that requires deeper accountability gating.
 */
export const RELATIONAL_KEYWORDS: string[] = [
  "indigenous", "ceremony", "medicine wheel", "elder", "sacred",
  "protocol", "relational", "accountability", "reciprocity",
  "sovereign", "governance", "consent", "land", "community",
  "two-eyed seeing", "etuaptmumk", "ocap", "first nations",
];

/**
 * Keywords that trigger ceremonial hold —
 * work in these domains requires explicit human review.
 */
export const CEREMONY_HOLD_KEYWORDS: string[] = [
  "indigenous", "ceremony", "sacred", "elder", "medicine wheel",
  "sovereign", "first nations", "treaty",
];

// =============================================================================
// Source Channel Descriptors
// =============================================================================

/**
 * Human-readable descriptors for each source channel.
 */
export const SOURCE_CHANNEL_DESCRIPTORS: Record<string, string> = {
  "qmd-local": "QMD Local — Semantic search (lex/vec/hyde) against local knowledge corpus",
  "deep-search-academic": "Deep Search — Academic and web-scale retrieval for learning inquiries",
  "workspace-scan": "Workspace Scan — Glob/grep pattern matching against the local codebase",
};

// =============================================================================
// Directional Labels (Anishinaabe)
// =============================================================================

/**
 * Directional labels (Anishinaabe) — canonical Medicine Wheel mapping.
 *
 * NOTE: mcp-pde uses a variant mapping (WEST=Validation, NORTH=Action).
 * This package follows the canonical mapping from medicine-wheel-pi/agents/inquiry-router.md.
 */
export const DIRECTION_LABELS: Record<string, string> = {
  east: "Waabinong (Vision)",
  south: "Zhaawanong (Action)",
  west: "Epangishmok (Synthesis)",
  north: "Kiiwedinong (Structure)",
};

// =============================================================================
// Validation Thresholds
// =============================================================================

/** Minimum confidence for an inquiry to pass validation */
export const MIN_CONFIDENCE_THRESHOLD = 0.3;

/** Minimum relational score for batch to proceed without ceremony */
export const MIN_RELATIONAL_SCORE = 0.5;

/** Weight of relational completeness in overall validation */
export const RELATIONAL_WEIGHT = 0.6;

/** Weight of accountability completeness in overall validation */
export const ACCOUNTABILITY_WEIGHT = 0.4;
