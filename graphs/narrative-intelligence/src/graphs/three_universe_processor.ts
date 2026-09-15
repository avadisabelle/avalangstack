/**
 * Three-Universe Processor
 *
 * Processes events through all three universe lenses:
 * - Engineer World (Mia) - Technical precision
 * - Ceremony World (Ava8) - Relational protocols
 * - Story Engine World (Miette) - Narrative patterns
 *
 * This produces a ThreeUniverseAnalysis with:
 * - Individual perspectives from each universe
 * - Lead universe determination
 * - Coherence score
 */

import {
  Universe,
  UniversePerspective,
  ThreeUniverseAnalysis,
  NarrativeFunction,
  StoryBeat,
  createUniversePerspective,
  createThreeUniverseAnalysis,
  createStoryBeat,
  getNarrativeFunctionFromString,
} from "../schemas/unified_state_bridge.js";

/**
 * Types of events that can be processed.
 */
export enum EventType {
  GITHUB_PUSH = "github.push",
  GITHUB_ISSUE = "github.issue",
  GITHUB_PR = "github.pull_request",
  GITHUB_COMMENT = "github.comment",
  GITHUB_REVIEW = "github.review",
  USER_INPUT = "user.input",
  AGENT_ACTION = "agent.action",
  SYSTEM_EVENT = "system.event",
}

/**
 * An event ready for three-universe processing.
 */
export interface ProcessedEvent {
  eventId: string;
  eventType: EventType;
  content: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
  source?: string;
}

/**
 * State for the three-universe processor.
 */
export interface ThreeUniverseState {
  // Input
  event: Record<string, unknown>;
  eventType: string;

  // Processing state
  engineerPerspective?: UniversePerspective;
  ceremonyPerspective?: UniversePerspective;
  storyEnginePerspective?: UniversePerspective;

  // Output
  analysis?: ThreeUniverseAnalysis;
  leadUniverse?: Universe;
  coherenceScore?: number;

  // Error handling
  error?: string;
}

/**
 * Protocol for callbacks that receive three-universe analysis results.
 */
export type AnalysisCallback = (
  eventId: string,
  eventContent: string,
  engineerResult: Record<string, unknown>,
  ceremonyResult: Record<string, unknown>,
  storyEngineResult: Record<string, unknown>,
  leadUniverse: string,
  coherenceScore: number
) => void;

/**
 * A map of intent name -> the terms that signal it. Every universe's lexicon
 * uses this shape, and every consumer can pass their own domain vocabulary in
 * rather than forking the classifier.
 */
export type IntentKeywordMap = Record<string, string[]>;

/**
 * Confidence assigned when a universe finds NO supporting evidence. Kept equal
 * across all three universes so an empty-evidence event does not silently tilt
 * to whichever universe happened to have the highest fallback — the historical
 * cause of plain engineering text landing in ceremony.
 */
export const NO_EVIDENCE_CONFIDENCE = 0.4;

/**
 * Default minimum confidence margin between the winning universe and the
 * runner-up. Below this the lead is reported as `ambiguous` instead of asserted.
 */
export const DEFAULT_MIN_CONFIDENCE_MARGIN = 0.15;

/**
 * Score every intent against the content and record which terms actually fired.
 * Returns per-intent scores (matches / lexicon size) plus the flat list of
 * matched terms so a perspective can explain itself.
 */
function scoreIntents(
  contentLower: string,
  keywords: IntentKeywordMap
): { intentScores: Record<string, number>; evidence: string[] } {
  const intentScores: Record<string, number> = {};
  const evidence: string[] = [];

  for (const [intent, terms] of Object.entries(keywords)) {
    const fired = terms.filter((term) =>
      contentLower.includes(term.toLowerCase())
    );
    if (fired.length > 0) {
      intentScores[intent] = fired.length / terms.length;
      evidence.push(...fired);
    }
  }

  return { intentScores, evidence };
}

// =============================================================================
// Engineer World (Mia) - The Builder
// =============================================================================

/**
 * Keywords that indicate different engineering intents.
 */
export function engineerIntentKeywords(): Record<string, string[]> {
  return {
    feature_implementation: [
      "feat:",
      "feature",
      "add",
      "implement",
      "create",
      "new",
    ],
    bug_fix: ["fix:", "bug", "hotfix", "patch", "resolve", "correct", "failing"],
    refactor: [
      "refactor",
      "refact:",
      "cleanup",
      "restructure",
      "reorganize",
      "interface",
      "contract",
    ],
    type_system: [
      "schema",
      "type",
      "types",
      "typing",
      "compile",
      "interface",
      "contract",
      "validate",
      "spec",
      "tangled",
    ],
    documentation: ["docs:", "doc:", "documentation", "readme", "comment"],
    testing: ["test:", "tests:", "testing", "spec", "coverage", "validate"],
    dependency: ["deps:", "dependency", "upgrade", "update", "bump"],
    configuration: ["config:", "configure", "settings", "env"],
    performance: ["perf:", "performance", "optimize", "speed", "cache"],
    security: ["security", "sec:", "vulnerability", "auth", "permission"],
    ci_cd: ["ci:", "cd:", "pipeline", "workflow", "build"],
  };
}

/**
 * Mia's perspective: The Builder (Engineer-world)
 *
 * Focuses on:
 * - What was built/changed
 * - Technical impact
 * - System architecture implications
 * - Flow routing for technical actions
 */
export function analyzeEngineerPerspective(
  state: ThreeUniverseState,
  keywords: IntentKeywordMap = engineerIntentKeywords()
): ThreeUniverseState {
  const event = state.event;
  const eventType = state.eventType;

  // Extract relevant content
  let content = "";
  const payload = event.payload as Record<string, unknown> | undefined;

  if (payload) {
    const commits = payload.commits as Array<Record<string, string>> | undefined;
    if (commits) {
      content = commits.map((c) => c.message || "").join(" ");
    } else if (payload.issue) {
      const issue = payload.issue as Record<string, string>;
      content = (issue.title || "") + " " + (issue.body || "");
    } else if (payload.pull_request) {
      const pr = payload.pull_request as Record<string, string>;
      content = (pr.title || "") + " " + (pr.body || "");
    }
  } else if (event.content) {
    content = event.content as string;
  }

  const contentLower = content.toLowerCase();

  // Analyze intent based on keywords
  const { intentScores, evidence } = scoreIntents(contentLower, keywords);

  // Determine primary intent
  let intent: string;
  let confidence: number;

  if (Object.keys(intentScores).length > 0) {
    intent = Object.entries(intentScores).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];
    confidence = Math.min(0.95, 0.6 + intentScores[intent] * 0.4);
  } else {
    intent = "maintenance";
    confidence = NO_EVIDENCE_CONFIDENCE;
  }

  // Map intents to suggested flows
  const flowMap: Record<string, string[]> = {
    feature_implementation: [
      "code_review",
      "integration_test",
      "documentation_update",
    ],
    bug_fix: ["regression_test", "root_cause_analysis", "changelog_update"],
    refactor: ["architecture_review", "performance_test", "code_quality"],
    type_system: ["type_check", "schema_validation", "contract_review"],
    documentation: ["doc_review", "example_validation"],
    testing: ["coverage_analysis", "test_quality_review"],
    dependency: ["security_scan", "compatibility_test"],
    configuration: ["validation_test", "rollback_plan"],
    performance: ["benchmark", "profiling", "optimization_review"],
    security: ["security_audit", "penetration_test", "credential_scan"],
    ci_cd: ["pipeline_validation", "deployment_test"],
    maintenance: ["standard_ci"],
  };

  const suggestedFlows = flowMap[intent] || ["standard_ci"];

  // Build context
  const context: Record<string, unknown> = {
    detectedKeywords: Object.entries(intentScores)
      .filter(([, v]) => v > 0)
      .map(([k]) => k),
    contentLength: content.length,
    eventType,
    technicalScope: determineTechnicalScope(content, event),
    estimatedComplexity: estimateComplexity(content, event),
  };

  const perspective = createUniversePerspective(
    Universe.ENGINEER,
    intent,
    confidence,
    { suggestedFlows, context, evidence }
  );

  return { ...state, engineerPerspective: perspective };
}

function determineTechnicalScope(
  content: string,
  _event: Record<string, unknown>
): string {
  const contentLower = content.toLowerCase();

  if (["api", "endpoint", "route"].some((kw) => contentLower.includes(kw))) {
    return "api_layer";
  }
  if (
    ["database", "schema", "migration"].some((kw) => contentLower.includes(kw))
  ) {
    return "data_layer";
  }
  if (
    ["ui", "component", "frontend"].some((kw) => contentLower.includes(kw))
  ) {
    return "presentation_layer";
  }
  if (["test", "spec"].some((kw) => contentLower.includes(kw))) {
    return "testing";
  }
  if (["config", "env", "settings"].some((kw) => contentLower.includes(kw))) {
    return "configuration";
  }

  return "general";
}

function estimateComplexity(
  content: string,
  event: Record<string, unknown>
): string {
  const payload = event.payload as Record<string, unknown> | undefined;
  if (payload) {
    const commits = payload.commits as unknown[] | undefined;
    if (commits) {
      if (commits.length > 5) return "high";
      if (commits.length > 2) return "medium";
    }
  }

  if (content.length > 500) return "high";
  if (content.length > 100) return "medium";

  return "low";
}

// =============================================================================
// Ceremony World (Ava8) - The Keeper
// =============================================================================

/**
 * Keywords that indicate different ceremonial intents.
 */
export function ceremonyIntentKeywords(): Record<string, string[]> {
  return {
    co_creation: ["we", "together", "team", "pair", "collaborate", "co-author"],
    gratitude_expression: [
      "thanks",
      "thank you",
      "grateful",
      "appreciate",
      "credit",
    ],
    witnessing: ["witness", "observe", "acknowledge", "see", "recognize"],
    sacred_pause: ["pause", "reflect", "consider", "contemplate", "breathe"],
    relationship_building: [
      "connect",
      "relationship",
      "community",
      "support",
    ],
    healing: ["heal", "restore", "repair", "reconcile", "mend"],
    celebration: [
      "celebrate",
      "milestone",
      "achievement",
      "success",
      "complete",
    ],
    offering: ["offer", "gift", "contribute", "share", "give"],
  };
}

/**
 * Ava8's perspective: The Keeper (Ceremony-world)
 *
 * Focuses on:
 * - Who contributed and their state
 * - Relational dynamics (K'é)
 * - Witnessing and acknowledgment
 * - Seven-generation awareness
 */
export function analyzeCeremonyPerspective(
  state: ThreeUniverseState,
  keywords: IntentKeywordMap = ceremonyIntentKeywords()
): ThreeUniverseState {
  const event = state.event;

  // Extract contributor information
  const contributors = extractContributors(event);

  // Extract content for analysis
  const content = extractContent(event);
  const contentLower = content.toLowerCase();

  // Analyze relational intent
  const { intentScores, evidence } = scoreIntents(contentLower, keywords);

  // Special case: multiple contributors = co_creation (relational evidence, not
  // a lexical term — recorded explicitly so the boost is explainable).
  if (contributors.length > 1) {
    intentScores.co_creation = (intentScores.co_creation || 0) + 0.5;
    evidence.push("multiple-contributors");
  }

  // Determine primary intent
  let intent: string;
  let confidence: number;

  if (Object.keys(intentScores).length > 0) {
    intent = Object.entries(intentScores).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];
    confidence = Math.min(0.95, 0.5 + intentScores[intent] * 0.4);
  } else {
    intent = "individual_offering";
    confidence = NO_EVIDENCE_CONFIDENCE;
  }

  // Map intents to ceremonial flows
  const flowMap: Record<string, string[]> = {
    co_creation: ["witness_collaboration", "honor_contributions", "amplify_voices"],
    gratitude_expression: [
      "amplify_acknowledgment",
      "record_connection",
      "reciprocity_check",
    ],
    witnessing: ["hold_space", "reflect_back", "presence"],
    sacred_pause: ["create_silence", "contemplation_prompt", "breathing_space"],
    relationship_building: [
      "map_connections",
      "strengthen_ties",
      "introduce_support",
    ],
    healing: ["compassion_response", "restoration_path", "forgiveness_space"],
    celebration: ["amplify_joy", "community_acknowledgment", "gratitude_circle"],
    offering: ["receive_gracefully", "honor_gift", "share_forward"],
    individual_offering: [
      "witness_work",
      "hold_space",
      "gentle_acknowledgment",
    ],
  };

  const suggestedFlows = flowMap[intent] || ["witness_work", "hold_space"];

  // Build ceremonial context
  const context: Record<string, unknown> = {
    contributors,
    isCollaborative: contributors.length > 1,
    senderEnergy: assessEnergy(content),
    witnessingNeeded: needsWitnessing(content, event),
    relationshipDepth: assessRelationshipDepth(contributors, event),
    sevenGenerationRelevance: assessLongTermImpact(content, event),
  };

  const perspective = createUniversePerspective(
    Universe.CEREMONY,
    intent,
    confidence,
    { suggestedFlows, context, evidence }
  );

  return { ...state, ceremonyPerspective: perspective };
}

function extractContributors(event: Record<string, unknown>): string[] {
  const contributors: string[] = [];

  if (event.sender) {
    contributors.push(event.sender as string);
  }

  const payload = event.payload as Record<string, unknown> | undefined;
  if (payload) {
    // Git commits
    const commits = payload.commits as Array<Record<string, unknown>> | undefined;
    if (commits) {
      for (const commit of commits) {
        const author = (commit.author as Record<string, string> | undefined)?.name;
        if (author && !contributors.includes(author)) {
          contributors.push(author);
        }
      }
    }

    // Issue/PR author
    const issue = payload.issue as Record<string, unknown> | undefined;
    if (issue) {
      const user = issue.user as Record<string, string> | undefined;
      if (user?.login && !contributors.includes(user.login)) {
        contributors.push(user.login);
      }
    }

    const pr = payload.pull_request as Record<string, unknown> | undefined;
    if (pr) {
      const user = pr.user as Record<string, string> | undefined;
      if (user?.login && !contributors.includes(user.login)) {
        contributors.push(user.login);
      }
    }
  }

  return contributors.length > 0 ? contributors : ["unknown"];
}

function extractContent(event: Record<string, unknown>): string {
  if (event.content) {
    return event.content as string;
  }

  const payload = event.payload as Record<string, unknown> | undefined;
  if (payload) {
    const parts: string[] = [];

    const commits = payload.commits as Array<Record<string, string>> | undefined;
    if (commits) {
      parts.push(...commits.map((c) => c.message || ""));
    }

    const issue = payload.issue as Record<string, string> | undefined;
    if (issue) {
      parts.push(issue.title || "");
      parts.push(issue.body || "");
    }

    const pr = payload.pull_request as Record<string, string> | undefined;
    if (pr) {
      parts.push(pr.title || "");
      parts.push(pr.body || "");
    }

    const comment = payload.comment as Record<string, string> | undefined;
    if (comment) {
      parts.push(comment.body || "");
    }

    return parts.filter(Boolean).join(" ");
  }

  return "";
}

function assessEnergy(content: string): string {
  const contentLower = content.toLowerCase();

  if (["urgent", "critical", "asap", "emergency"].some((w) =>
    contentLower.includes(w)
  )) {
    return "urgent_flow";
  }
  if (["excited", "happy", "great", "awesome"].some((w) =>
    contentLower.includes(w)
  )) {
    return "joyful_flow";
  }
  if (["stuck", "blocked", "help", "issue"].some((w) =>
    contentLower.includes(w)
  )) {
    return "seeking_support";
  }
  if (["thoughtful", "consider", "reflect"].some((w) =>
    contentLower.includes(w)
  )) {
    return "contemplative_flow";
  }

  return "steady_flow";
}

function needsWitnessing(
  content: string,
  _event: Record<string, unknown>
): boolean {
  const contentLower = content.toLowerCase();

  // Vulnerable sharing needs witnessing
  if (["first", "new", "trying", "learning", "help"].some((w) =>
    contentLower.includes(w)
  )) {
    return true;
  }

  // Significant achievements need witnessing
  if (["complete", "achieve", "milestone", "done"].some((w) =>
    contentLower.includes(w)
  )) {
    return true;
  }

  return false;
}

function assessRelationshipDepth(
  contributors: string[],
  _event: Record<string, unknown>
): string {
  if (contributors.length > 2) return "community";
  if (contributors.length > 1) return "pair";
  return "individual";
}

function assessLongTermImpact(
  content: string,
  _event: Record<string, unknown>
): number {
  const contentLower = content.toLowerCase();
  let score = 0.3; // Base score

  // Infrastructure changes have long-term impact
  if (["architecture", "foundation", "core", "framework"].some((w) =>
    contentLower.includes(w)
  )) {
    score += 0.3;
  }

  // Documentation affects future generations
  if (["document", "guide", "tutorial", "example"].some((w) =>
    contentLower.includes(w)
  )) {
    score += 0.2;
  }

  // Breaking changes affect the future
  if (["breaking", "migration", "deprecate"].some((w) =>
    contentLower.includes(w)
  )) {
    score += 0.2;
  }

  return Math.min(1.0, score);
}

// =============================================================================
// Story Engine World (Miette) - The Weaver
// =============================================================================

/**
 * Keywords that indicate different narrative functions.
 */
export function storyEngineIntentKeywords(): Record<string, string[]> {
  return {
    inciting_incident: ["init", "start", "begin", "new", "first", "introduce"],
    rising_action: ["add", "implement", "build", "develop", "progress", "continue"],
    turning_point: ["feat:", "major", "significant", "pivot", "change", "transform"],
    complication: ["issue", "problem", "bug", "error", "conflict", "challenge"],
    crisis: ["critical", "urgent", "breaking", "emergency", "blocker"],
    climax: ["complete", "finish", "final", "release", "launch", "deploy"],
    resolution: ["fix", "resolve", "close", "merge", "done"],
    denouement: ["cleanup", "refactor", "optimize", "polish", "improve"],
  };
}

/**
 * Miette's perspective: The Weaver (Story-engine-world)
 *
 * Focuses on:
 * - Narrative position (which act/phase)
 * - Dramatic function
 * - Story arc progression
 * - Character development
 */
export function analyzeStoryEnginePerspective(
  state: ThreeUniverseState,
  keywords: IntentKeywordMap = storyEngineIntentKeywords()
): ThreeUniverseState {
  const event = state.event;
  const content = extractContent(event);
  const contentLower = content.toLowerCase();

  // Analyze narrative function
  const { intentScores, evidence } = scoreIntents(contentLower, keywords);

  // Determine primary intent
  let intent: string;
  let confidence: number;

  if (Object.keys(intentScores).length > 0) {
    intent = Object.entries(intentScores).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];
    confidence = Math.min(0.95, 0.55 + intentScores[intent] * 0.4);
  } else {
    intent = "rising_action";
    confidence = NO_EVIDENCE_CONFIDENCE;
  }

  // Map intent to act
  const actMap: Record<string, number> = {
    inciting_incident: 1,
    rising_action: 2,
    turning_point: 2,
    complication: 2,
    crisis: 2,
    climax: 3,
    resolution: 3,
    denouement: 3,
  };
  const act = actMap[intent] || 2;

  // Map intent to narrative function
  const functionMap: Record<string, string> = {
    inciting_incident: "inciting_incident",
    rising_action: "rising_action",
    turning_point: "turning_point",
    complication: "complication",
    crisis: "crisis",
    climax: "climax",
    resolution: "resolution",
    denouement: "denouement",
  };
  const narrativeFunction = functionMap[intent] || "beat";

  // Suggested flows for story engine
  const flowMap: Record<string, string[]> = {
    inciting_incident: ["establish_stakes", "introduce_characters", "set_tone"],
    rising_action: ["advance_narrative", "develop_characters", "build_tension"],
    turning_point: ["mark_pivot", "shift_perspective", "update_arc"],
    complication: ["deepen_conflict", "raise_stakes", "add_obstacle"],
    crisis: ["peak_tension", "force_decision", "approach_climax"],
    climax: ["resolve_main_conflict", "character_transformation", "theme_revelation"],
    resolution: ["tie_loose_ends", "show_consequences", "new_equilibrium"],
    denouement: ["reflect_journey", "hint_future", "final_image"],
  };

  const suggestedFlows = flowMap[intent] || [
    "advance_narrative",
    "update_arc_position",
  ];

  // Calculate dramatic tension
  const dramaticTension = calculateDramaticTension(intent, content);

  // Build story context
  const context: Record<string, unknown> = {
    act,
    narrativeFunction,
    dramaticTension,
    suggestedNextBeat: suggestNextBeat(intent),
    characterImpact: assessCharacterImpact(content),
    themeResonance: assessThemeResonance(content),
    pacingSuggestion: suggestPacing(intent, dramaticTension),
  };

  const perspective = createUniversePerspective(
    Universe.STORY_ENGINE,
    intent,
    confidence,
    { suggestedFlows, context, evidence }
  );

  return { ...state, storyEnginePerspective: perspective };
}

function calculateDramaticTension(intent: string, content: string): number {
  const baseTension: Record<string, number> = {
    inciting_incident: 0.4,
    rising_action: 0.5,
    turning_point: 0.7,
    complication: 0.6,
    crisis: 0.9,
    climax: 1.0,
    resolution: 0.4,
    denouement: 0.2,
  };

  let tension = baseTension[intent] || 0.5;
  const contentLower = content.toLowerCase();

  // Adjust based on content intensity
  if (["urgent", "critical", "breaking"].some((w) => contentLower.includes(w))) {
    tension = Math.min(1.0, tension + 0.2);
  }
  if (["minor", "small", "trivial"].some((w) => contentLower.includes(w))) {
    tension = Math.max(0.1, tension - 0.2);
  }

  return Math.round(tension * 100) / 100;
}

function suggestNextBeat(currentIntent: string): string {
  const nextBeatMap: Record<string, string> = {
    inciting_incident: "rising_action",
    rising_action: "complication",
    turning_point: "rising_action",
    complication: "crisis",
    crisis: "climax",
    climax: "resolution",
    resolution: "denouement",
    denouement: "inciting_incident", // New cycle
  };
  return nextBeatMap[currentIntent] || "rising_action";
}

function assessCharacterImpact(content: string): string {
  const contentLower = content.toLowerCase();

  if (["transform", "change", "grow", "learn"].some((w) =>
    contentLower.includes(w)
  )) {
    return "transformative";
  }
  if (["challenge", "struggle", "overcome"].some((w) =>
    contentLower.includes(w)
  )) {
    return "character_testing";
  }
  if (["connect", "relationship", "team"].some((w) => contentLower.includes(w))) {
    return "relational";
  }

  return "incremental";
}

function assessThemeResonance(content: string): string {
  const contentLower = content.toLowerCase();
  const themes: string[] = [];

  if (["together", "team", "collaborate"].some((w) => contentLower.includes(w))) {
    themes.push("collaboration");
  }
  if (["integrate", "connect", "bridge"].some((w) => contentLower.includes(w))) {
    themes.push("integration");
  }
  if (["coherent", "consistent", "unified"].some((w) =>
    contentLower.includes(w)
  )) {
    themes.push("coherence");
  }
  if (["transform", "change", "evolve"].some((w) => contentLower.includes(w))) {
    themes.push("transformation");
  }

  return themes.length > 0 ? themes.join(", ") : "development";
}

function suggestPacing(intent: string, tension: number): string {
  if (tension > 0.8) return "accelerate";
  if (tension < 0.3) return "breathe";
  if (intent === "inciting_incident" || intent === "climax") return "emphasize";
  return "steady";
}

// =============================================================================
// Synthesis - Combining All Three Perspectives
// =============================================================================

/**
 * Combine all three universe perspectives into a unified analysis.
 */
export function synthesizePerspectives(
  state: ThreeUniverseState,
  minConfidenceMargin: number = DEFAULT_MIN_CONFIDENCE_MARGIN
): ThreeUniverseState {
  const engineer = state.engineerPerspective;
  const ceremony = state.ceremonyPerspective;
  const storyEngine = state.storyEnginePerspective;

  if (!engineer || !ceremony || !storyEngine) {
    return {
      ...state,
      error: "Missing one or more perspectives",
    };
  }

  // Determine lead universe based on confidence and special conditions
  const lead = determineLeadUniverse(engineer, ceremony, storyEngine);

  // Calculate coherence
  const coherence = calculateCoherence(engineer, ceremony, storyEngine);

  // How decisively was the lead won? A small margin between the two most
  // confident universes means the winner is close to a coin-flip.
  const sorted = [
    engineer.confidence,
    ceremony.confidence,
    storyEngine.confidence,
  ].sort((a, b) => b - a);
  const leadMargin = Math.round((sorted[0] - sorted[1]) * 100) / 100;
  const ambiguous = leadMargin < minConfidenceMargin;

  // Build the analysis
  const analysis = createThreeUniverseAnalysis(
    engineer,
    ceremony,
    storyEngine,
    lead,
    coherence,
    { leadMargin, ambiguous }
  );

  return {
    ...state,
    analysis,
    leadUniverse: lead,
    coherenceScore: coherence,
  };
}

/**
 * Determine which universe should lead the response.
 *
 * Priority logic:
 * 1. CEREMONY leads if: new contributor, sacred pause needed, relational obligation
 * 2. STORY_ENGINE leads if: narrative coherence critical, character arc in focus
 * 3. ENGINEER leads if: technical precision critical, schema validation required
 * 4. Otherwise: highest confidence wins
 */
function determineLeadUniverse(
  engineer: UniversePerspective,
  ceremony: UniversePerspective,
  storyEngine: UniversePerspective
): Universe {
  const ceremonyContext = ceremony.context;

  // Check ceremony priority conditions
  if (ceremonyContext.witnessingNeeded) {
    return Universe.CEREMONY;
  }
  if (ceremonyContext.isCollaborative) {
    // Collaborative work honors the ceremony world
    return Universe.CEREMONY;
  }

  // Check story engine priority conditions
  const storyContext = storyEngine.context;
  if ((storyContext.dramaticTension as number) > 0.8) {
    // High drama moments are led by story engine
    return Universe.STORY_ENGINE;
  }
  if (
    storyContext.narrativeFunction === "climax" ||
    storyContext.narrativeFunction === "turning_point"
  ) {
    return Universe.STORY_ENGINE;
  }

  // Check engineer priority conditions
  const engineerContext = engineer.context;
  if (engineerContext.estimatedComplexity === "high") {
    return Universe.ENGINEER;
  }
  if (engineer.intent === "security" || engineer.intent === "bug_fix") {
    // Technical urgency
    return Universe.ENGINEER;
  }

  // Default: highest confidence
  const perspectives: [UniversePerspective, Universe][] = [
    [engineer, Universe.ENGINEER],
    [ceremony, Universe.CEREMONY],
    [storyEngine, Universe.STORY_ENGINE],
  ];

  return perspectives.reduce((a, b) =>
    a[0].confidence > b[0].confidence ? a : b
  )[1];
}

/**
 * Calculate how well the three perspectives align.
 *
 * Higher coherence means the perspectives are complementary.
 * Lower coherence might indicate conflicting interpretations.
 */
function calculateCoherence(
  engineer: UniversePerspective,
  ceremony: UniversePerspective,
  storyEngine: UniversePerspective
): number {
  // Base: average confidence
  const avgConfidence =
    (engineer.confidence + ceremony.confidence + storyEngine.confidence) / 3;

  // Bonus for alignment
  let bonus = 0.0;

  // If all suggest similar urgency
  const engineerUrgent = ["security", "bug_fix", "performance"].includes(
    engineer.intent
  );
  const ceremonyUrgent = ceremony.context.senderEnergy === "urgent_flow";
  const storyUrgent =
    (storyEngine.context.dramaticTension as number) > 0.7;

  if ([engineerUrgent, ceremonyUrgent, storyUrgent].filter(Boolean).length >= 2) {
    bonus += 0.1; // Aligned on urgency
  }

  // Penalty for very different confidences (might indicate conflict)
  const confidences = [
    engineer.confidence,
    ceremony.confidence,
    storyEngine.confidence,
  ];
  const confidenceSpread = Math.max(...confidences) - Math.min(...confidences);
  const penalty = confidenceSpread * 0.2;

  const coherence = avgConfidence + bonus - penalty;
  return Math.round(Math.max(0.0, Math.min(1.0, coherence)) * 100) / 100;
}

// =============================================================================
// Main Processor Class
// =============================================================================

/**
 * High-level interface for three-universe event processing.
 *
 * @example
 * const processor = new ThreeUniverseProcessor();
 * const result = processor.process(event);
 * console.log(result.leadUniverse);  // "ceremony"
 *
 * @example With tracing callback
 * const handler = new NarrativeTracingHandler({ storyId: "story_123" });
 * const bridge = new LangGraphBridge(handler);
 * const processor = new ThreeUniverseProcessor({
 *   tracingCallback: bridge.createThreeUniverseCallback()
 * });
 * const result = processor.process(event);  // Automatically traced to Langfuse
 */
/**
 * Options for {@link ThreeUniverseProcessor}.
 */
export interface ThreeUniverseProcessorOptions {
  tracingCallback?: AnalysisCallback;
  /**
   * Override any universe's lexicon. Merged over the built-in keywords, so you
   * only supply the vocabulary that is specific to your domain. Pass a whole
   * map to replace a universe's lexicon outright.
   */
  keywords?: {
    engineer?: IntentKeywordMap;
    ceremony?: IntentKeywordMap;
    storyEngine?: IntentKeywordMap;
  };
  /**
   * Confidence margin below which a lead is reported as `ambiguous`.
   * Defaults to {@link DEFAULT_MIN_CONFIDENCE_MARGIN}.
   */
  minConfidenceMargin?: number;
}

export class ThreeUniverseProcessor {
  private tracingCallback?: AnalysisCallback;
  private engineerKeywords: IntentKeywordMap;
  private ceremonyKeywords: IntentKeywordMap;
  private storyEngineKeywords: IntentKeywordMap;
  private minConfidenceMargin: number;

  constructor(options: ThreeUniverseProcessorOptions = {}) {
    this.tracingCallback = options.tracingCallback;
    this.engineerKeywords = {
      ...engineerIntentKeywords(),
      ...(options.keywords?.engineer ?? {}),
    };
    this.ceremonyKeywords = {
      ...ceremonyIntentKeywords(),
      ...(options.keywords?.ceremony ?? {}),
    };
    this.storyEngineKeywords = {
      ...storyEngineIntentKeywords(),
      ...(options.keywords?.storyEngine ?? {}),
    };
    this.minConfidenceMargin =
      options.minConfidenceMargin ?? DEFAULT_MIN_CONFIDENCE_MARGIN;
  }

  /**
   * Process an event through all three universes.
   *
   * @param event The event data (webhook payload, user input, etc.)
   * @param eventType Type of event (e.g., "github.push", "user.input")
   * @returns ThreeUniverseAnalysis with all perspectives and synthesis
   */
  process(
    event: Record<string, unknown>,
    eventType: string = "unknown"
  ): ThreeUniverseAnalysis {
    // Initialize state
    let state: ThreeUniverseState = {
      event,
      eventType,
    };

    // Process through each universe
    state = analyzeEngineerPerspective(state, this.engineerKeywords);
    state = analyzeCeremonyPerspective(state, this.ceremonyKeywords);
    state = analyzeStoryEnginePerspective(state, this.storyEngineKeywords);
    state = synthesizePerspectives(state, this.minConfidenceMargin);

    // Check for errors
    if (state.error) {
      throw new Error(`Processing error: ${state.error}`);
    }

    const analysis = state.analysis!;

    // Call tracing callback if configured
    if (this.tracingCallback && analysis) {
      const eventId =
        (event.eventId as string) ||
        (event.id as string) ||
        `${eventType}_${Date.now()}`;
      const eventContent = this.extractEventContent(event);

      this.tracingCallback(
        eventId,
        eventContent,
        perspectiveToRecord(analysis.engineer),
        perspectiveToRecord(analysis.ceremony),
        perspectiveToRecord(analysis.storyEngine),
        analysis.leadUniverse,
        analysis.coherenceScore
      );
    }

    return analysis;
  }

  private extractEventContent(event: Record<string, unknown>): string {
    // Try common content locations
    if (event.content) {
      return String(event.content).slice(0, 500);
    }

    const payload = event.payload as Record<string, unknown> | undefined;
    if (payload && typeof payload === "object") {
      const issue = payload.issue as Record<string, string> | undefined;
      if (issue?.title) return issue.title;

      const pr = payload.pull_request as Record<string, string> | undefined;
      if (pr?.title) return pr.title;

      const comment = payload.comment as Record<string, string> | undefined;
      if (comment?.body) return comment.body.slice(0, 500);
    }

    if (event.message) {
      return String(event.message).slice(0, 500);
    }

    return `Event: ${event.eventType || "unknown"}`;
  }

  /**
   * Convenience method for processing GitHub webhooks.
   */
  processWebhook(webhookPayload: Record<string, unknown>): ThreeUniverseAnalysis {
    // Determine event type from webhook
    let eventType = "github.push"; // Default

    const payload = webhookPayload.payload as Record<string, unknown> | undefined;
    if (payload) {
      if (payload.issue) {
        eventType = "github.issue";
      } else if (payload.pull_request) {
        eventType = "github.pull_request";
      } else if (payload.comment) {
        eventType = "github.comment";
      }
    }

    return this.process(webhookPayload, eventType);
  }

  /**
   * Create a story beat from event and analysis.
   */
  createBeatFromAnalysis(
    event: Record<string, unknown>,
    analysis: ThreeUniverseAnalysis,
    sequence: number
  ): StoryBeat {
    // Map story engine intent to NarrativeFunction
    const storyIntent = analysis.storyEngine.intent;
    const narrativeFunc = getNarrativeFunctionFromString(storyIntent);

    // Extract act
    const act = (analysis.storyEngine.context.act as number) || 2;

    // Build content
    let content = extractContent(event);
    if (!content) {
      content = String(event.eventType || "event");
    }

    // Generate beat ID
    const timestamp = new Date().toISOString();
    const beatId = `beat_${timestamp}`;

    // Source event ID
    let sourceEventId: string | undefined;
    const payload = event.payload as Record<string, unknown> | undefined;
    if (payload) {
      const headCommit = payload.head_commit as Record<string, string> | undefined;
      if (headCommit?.id) {
        sourceEventId = headCommit.id;
      } else if (payload.issue) {
        const issue = payload.issue as Record<string, unknown>;
        sourceEventId = String(issue.id);
      } else if (payload.pull_request) {
        const pr = payload.pull_request as Record<string, unknown>;
        sourceEventId = String(pr.id);
      }
    }

    return createStoryBeat(beatId, sequence, content.slice(0, 500), narrativeFunc, act, {
      universeAnalysis: analysis,
      leadUniverse: analysis.leadUniverse,
      source: "processor",
      sourceEventId,
    });
  }
}

/**
 * Convert a UniversePerspective to a plain record.
 */
function perspectiveToRecord(
  perspective: UniversePerspective
): Record<string, unknown> {
  return {
    universe: perspective.universe,
    intent: perspective.intent,
    confidence: perspective.confidence,
    suggestedFlows: perspective.suggestedFlows,
    context: perspective.context,
  };
}
