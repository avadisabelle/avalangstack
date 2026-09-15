/**
 * Structural Thinking Graph
 *
 * A 4-node linear pipeline (Four Directions) that ports miaco's `pde-to-st` command.
 * Transforms a prompt/situation into a structured ThinkingDocument through:
 *
 *   1. pictureNode (EAST)  — Snapshot current reality vs desired outcome
 *   2. draftNode  (SOUTH)  — Draft reasoning sections per dimension
 *   3. reviewNode (WEST)   — Review for coherence, completeness, balance
 *   4. reviseNode (NORTH)  — Apply annotations, produce final document
 *
 * NO LLM dependencies — all keyword-based analysis.
 */

import { v4 as uuidv4 } from "uuid";

// =============================================================================
// Types
// =============================================================================

export interface StructuralTensionSnapshot {
  id: string;
  prompt: string;
  currentReality: string;
  desiredOutcome: string;
  components: Array<{
    dimension: string;
    currentState: string;
    desiredState: string;
    gap: number;
    keywords: string[];
  }>;
  overallMagnitude: number;
  createdAt: string;
}

export interface ThinkingSection {
  dimension: string;
  direction: "east" | "south" | "west" | "north";
  analysis: string;
  proposedActions: string[];
  confidence: number;
}

export interface ThinkingDocument {
  id: string;
  title: string;
  sections: ThinkingSection[];
  summary: string;
  createdAt: string;
  revised: boolean;
}

export interface ReviewAnnotation {
  sectionDimension: string;
  type: "missing" | "weak" | "strong" | "redundant";
  note: string;
}

export interface StructuralThinkingState {
  // Input
  prompt: string;
  currentReality?: string;
  desiredOutcome?: string;

  // EAST output
  snapshot?: StructuralTensionSnapshot;

  // SOUTH output
  draftDocument?: ThinkingDocument;

  // WEST output
  reviewAnnotations?: ReviewAnnotation[];

  // NORTH output
  finalDocument?: ThinkingDocument;

  // Metadata
  error?: string;
}

export interface StructuralThinkingOptions {
  dimensions?: string[];
  minConfidence?: number;
}

// =============================================================================
// Dimension Keywords
// =============================================================================

const DIMENSION_KEYWORDS: Record<string, string[]> = {
  technical: [
    "code", "build", "deploy", "api", "architecture", "system", "implement",
    "refactor", "test", "schema", "database", "infrastructure", "pipeline",
    "performance", "optimize", "debug", "module", "service", "endpoint",
  ],
  relational: [
    "team", "collaborate", "communicate", "trust", "relationship", "community",
    "support", "mentor", "feedback", "pair", "share", "together", "kinship",
    "consent", "witness", "reciprocity", "empathy", "listen", "dialogue",
  ],
  ceremonial: [
    "ceremony", "ritual", "protocol", "sacred", "threshold", "transition",
    "blessing", "opening", "closing", "intention", "gratitude", "honor",
    "respect", "elder", "tradition", "circle", "fire", "medicine",
  ],
  narrative: [
    "story", "arc", "character", "theme", "tension", "resolution", "plot",
    "scene", "chapter", "protagonist", "journey", "transformation", "conflict",
    "climax", "denouement", "episode", "beat", "perspective", "voice",
  ],
};

// =============================================================================
// Node 1: pictureNode (EAST) — Snapshot
// =============================================================================

function pictureNode(state: StructuralThinkingState): StructuralThinkingState {
  const { prompt, currentReality, desiredOutcome } = state;
  const promptLower = prompt.toLowerCase();

  const inferredReality = currentReality || inferCurrentReality(promptLower);
  const inferredOutcome = desiredOutcome || inferDesiredOutcome(promptLower);

  const components = Object.entries(DIMENSION_KEYWORDS).map(
    ([dimension, keywords]) => {
      const matched = keywords.filter((kw) => promptLower.includes(kw));
      const currentState = matched.length > 0
        ? `Current ${dimension} state involves: ${matched.slice(0, 3).join(", ")}`
        : `No explicit ${dimension} signals detected`;
      const desiredState = matched.length > 0
        ? `Desired ${dimension} outcome addresses: ${matched.slice(0, 3).join(", ")}`
        : `${dimension} dimension needs clarification`;
      const gap = matched.length > 0
        ? Math.min(1.0, 0.3 + matched.length * 0.15)
        : 0.1;

      return {
        dimension,
        currentState,
        desiredState,
        gap: Math.round(gap * 100) / 100,
        keywords: matched,
      };
    }
  );

  const overallMagnitude =
    components.length > 0
      ? Math.round(
          (components.reduce((sum, c) => sum + c.gap, 0) / components.length) *
            100
        ) / 100
      : 0;

  const snapshot: StructuralTensionSnapshot = {
    id: uuidv4(),
    prompt,
    currentReality: inferredReality,
    desiredOutcome: inferredOutcome,
    components,
    overallMagnitude,
    createdAt: new Date().toISOString(),
  };

  return { ...state, snapshot };
}

function inferCurrentReality(promptLower: string): string {
  const problemSignals = ["problem", "issue", "stuck", "broken", "missing", "lack", "need"];
  const matched = problemSignals.filter((s) => promptLower.includes(s));
  if (matched.length > 0) {
    return `Current situation has challenges: ${matched.join(", ")}`;
  }
  return "Current state described in prompt";
}

function inferDesiredOutcome(promptLower: string): string {
  const goalSignals = ["want", "goal", "achieve", "improve", "create", "build", "resolve"];
  const matched = goalSignals.filter((s) => promptLower.includes(s));
  if (matched.length > 0) {
    return `Desired outcome targets: ${matched.join(", ")}`;
  }
  return "Desired outcome to be determined from analysis";
}

// =============================================================================
// Node 2: draftNode (SOUTH) — Draft ThinkingDocument
// =============================================================================

function draftNode(state: StructuralThinkingState): StructuralThinkingState {
  const snapshot = state.snapshot;
  if (!snapshot) {
    return { ...state, error: "No snapshot available for drafting" };
  }

  const sections: ThinkingSection[] = snapshot.components.map((component) => {
    const hasKeywords = component.keywords.length > 0;
    const confidence = hasKeywords
      ? Math.min(0.95, 0.5 + component.keywords.length * 0.1)
      : 0.3;

    const analysis = hasKeywords
      ? `The ${component.dimension} dimension shows tension (gap: ${component.gap}). ` +
        `Key signals: ${component.keywords.join(", ")}. ` +
        `Current: ${component.currentState}. Target: ${component.desiredState}.`
      : `The ${component.dimension} dimension has low signal presence. ` +
        `Consider whether this dimension needs explicit attention.`;

    const proposedActions = generateActions(component.dimension, component.keywords);

    return {
      dimension: component.dimension,
      direction: "south" as const,
      analysis,
      proposedActions,
      confidence: Math.round(confidence * 100) / 100,
    };
  });

  const title = `Structural Thinking: ${snapshot.prompt.slice(0, 60)}${snapshot.prompt.length > 60 ? "..." : ""}`;

  const activeDimensions = sections.filter((s) => s.confidence > 0.4);
  const summary =
    activeDimensions.length > 0
      ? `Draft analysis across ${activeDimensions.length} active dimensions. ` +
        `Strongest signal in: ${activeDimensions.sort((a, b) => b.confidence - a.confidence)[0].dimension}. ` +
        `Overall tension magnitude: ${snapshot.overallMagnitude}.`
      : `Low signal across all dimensions. Prompt may need refinement.`;

  const draftDocument: ThinkingDocument = {
    id: uuidv4(),
    title,
    sections,
    summary,
    createdAt: new Date().toISOString(),
    revised: false,
  };

  return { ...state, draftDocument };
}

function generateActions(dimension: string, keywords: string[]): string[] {
  const actionMap: Record<string, string[]> = {
    technical: [
      "Assess architecture impact",
      "Identify implementation dependencies",
      "Define technical acceptance criteria",
    ],
    relational: [
      "Map stakeholder relationships",
      "Identify communication needs",
      "Establish feedback loops",
    ],
    ceremonial: [
      "Define ceremony protocols",
      "Identify threshold moments",
      "Plan opening and closing rituals",
    ],
    narrative: [
      "Map story arc progression",
      "Identify thematic threads",
      "Define character transformations",
    ],
  };

  const base = actionMap[dimension] || [`Address ${dimension} considerations`];

  if (keywords.length > 2) {
    base.push(`Deep-dive into: ${keywords.slice(0, 3).join(", ")}`);
  }

  return base;
}

// =============================================================================
// Node 3: reviewNode (WEST) — Review for coherence and balance
// =============================================================================

function reviewNode(state: StructuralThinkingState): StructuralThinkingState {
  const draft = state.draftDocument;
  if (!draft) {
    return { ...state, error: "No draft document available for review" };
  }

  const annotations: ReviewAnnotation[] = [];
  const allDimensions = Object.keys(DIMENSION_KEYWORDS);

  // Check which dimensions are represented
  const representedDimensions = new Set(draft.sections.map((s) => s.dimension));

  // Flag missing dimensions
  for (const dim of allDimensions) {
    if (!representedDimensions.has(dim)) {
      annotations.push({
        sectionDimension: dim,
        type: "missing",
        note: `The ${dim} dimension is entirely absent from the analysis`,
      });
    }
  }

  // Review each section
  for (const section of draft.sections) {
    if (section.confidence < 0.4) {
      annotations.push({
        sectionDimension: section.dimension,
        type: "weak",
        note: `Low confidence (${section.confidence}) — needs strengthening or explicit acknowledgment`,
      });
    } else if (section.confidence > 0.8) {
      annotations.push({
        sectionDimension: section.dimension,
        type: "strong",
        note: `Strong signal (${section.confidence}) — well-supported dimension`,
      });
    }

    if (section.proposedActions.length < 2) {
      annotations.push({
        sectionDimension: section.dimension,
        type: "weak",
        note: `Insufficient proposed actions for ${section.dimension}`,
      });
    }
  }

  // Check for balance across dimensions
  const confidences = draft.sections.map((s) => s.confidence);
  if (confidences.length >= 2) {
    const maxConf = Math.max(...confidences);
    const minConf = Math.min(...confidences);
    if (maxConf - minConf > 0.5) {
      const weakest = draft.sections.reduce((a, b) =>
        a.confidence < b.confidence ? a : b
      );
      annotations.push({
        sectionDimension: weakest.dimension,
        type: "weak",
        note: `Significant imbalance detected — ${weakest.dimension} is underrepresented relative to peers`,
      });
    }
  }

  // Check for redundancy (sections with identical keyword overlap)
  for (let i = 0; i < draft.sections.length; i++) {
    for (let j = i + 1; j < draft.sections.length; j++) {
      const a = draft.sections[i];
      const b = draft.sections[j];
      if (
        a.analysis === b.analysis &&
        a.confidence > 0.3 &&
        b.confidence > 0.3
      ) {
        annotations.push({
          sectionDimension: b.dimension,
          type: "redundant",
          note: `${b.dimension} section duplicates ${a.dimension} analysis`,
        });
      }
    }
  }

  return { ...state, reviewAnnotations: annotations };
}

// =============================================================================
// Node 4: reviseNode (NORTH) — Apply annotations, produce final document
// =============================================================================

function reviseNode(state: StructuralThinkingState): StructuralThinkingState {
  const draft = state.draftDocument;
  const annotations = state.reviewAnnotations;

  if (!draft) {
    return { ...state, error: "No draft document to revise" };
  }
  if (!annotations) {
    return { ...state, error: "No review annotations to apply" };
  }

  // Deep copy sections for revision
  const revisedSections: ThinkingSection[] = draft.sections.map((s) => ({
    ...s,
    direction: "north" as const,
  }));

  // Apply annotations
  for (const annotation of annotations) {
    if (annotation.type === "missing") {
      // Add a compensating section for missing dimensions
      revisedSections.push({
        dimension: annotation.sectionDimension,
        direction: "north",
        analysis:
          `Compensating section: The ${annotation.sectionDimension} dimension was not detected in the original prompt. ` +
          `This may indicate either an implicit assumption or a genuine gap that warrants attention.`,
        proposedActions: [
          `Explicitly consider ${annotation.sectionDimension} implications`,
          `Consult stakeholders about ${annotation.sectionDimension} requirements`,
        ],
        confidence: 0.2,
      });
    }

    if (annotation.type === "weak") {
      const section = revisedSections.find(
        (s) => s.dimension === annotation.sectionDimension
      );
      if (section) {
        section.analysis += ` [Review note: ${annotation.note}]`;
        if (section.proposedActions.length < 2) {
          section.proposedActions.push(
            `Strengthen ${section.dimension} analysis with additional evidence`
          );
        }
      }
    }

    if (annotation.type === "redundant") {
      const section = revisedSections.find(
        (s) => s.dimension === annotation.sectionDimension
      );
      if (section) {
        section.analysis += ` [Review note: potential redundancy — ${annotation.note}]`;
      }
    }
  }

  // Rebuild summary
  const strongSections = annotations.filter((a) => a.type === "strong");
  const weakSections = annotations.filter((a) => a.type === "weak");
  const missingSections = annotations.filter((a) => a.type === "missing");

  const summaryParts: string[] = [
    `Revised analysis with ${revisedSections.length} sections.`,
  ];

  if (strongSections.length > 0) {
    summaryParts.push(
      `Strong dimensions: ${strongSections.map((a) => a.sectionDimension).join(", ")}.`
    );
  }
  if (weakSections.length > 0) {
    summaryParts.push(
      `Attention needed: ${weakSections.map((a) => a.sectionDimension).join(", ")}.`
    );
  }
  if (missingSections.length > 0) {
    summaryParts.push(
      `Compensating sections added for: ${missingSections.map((a) => a.sectionDimension).join(", ")}.`
    );
  }

  const finalDocument: ThinkingDocument = {
    id: uuidv4(),
    title: draft.title,
    sections: revisedSections,
    summary: summaryParts.join(" "),
    createdAt: new Date().toISOString(),
    revised: true,
  };

  return { ...state, finalDocument };
}

// =============================================================================
// Main Class
// =============================================================================

/**
 * Structural Thinking Graph — Four Directions pipeline.
 *
 * Processes a prompt through EAST → SOUTH → WEST → NORTH stages to produce
 * a complete ThinkingDocument with structural tension analysis.
 *
 * @example
 * const graph = new StructuralThinkingGraph();
 * const result = graph.process("We need to build a new API and align the team");
 * console.log(result.finalDocument?.summary);
 */
export class StructuralThinkingGraph {
  private dimensions: string[];
  private minConfidence: number;

  constructor(options: StructuralThinkingOptions = {}) {
    this.dimensions = options.dimensions ?? Object.keys(DIMENSION_KEYWORDS);
    this.minConfidence = options.minConfidence ?? 0.3;
  }

  /**
   * Run the full Four Directions pipeline on a prompt.
   */
  process(
    prompt: string,
    currentReality?: string,
    desiredOutcome?: string
  ): StructuralThinkingState {
    let state: StructuralThinkingState = {
      prompt,
      currentReality,
      desiredOutcome,
    };

    // EAST — Picture the tension
    state = pictureNode(state);
    if (state.error) return state;

    // SOUTH — Draft the document
    state = draftNode(state);
    if (state.error) return state;

    // WEST — Review for balance
    state = reviewNode(state);
    if (state.error) return state;

    // NORTH — Revise and finalize
    state = reviseNode(state);

    return state;
  }

  /**
   * Access the configured dimensions.
   */
  getDimensions(): string[] {
    return [...this.dimensions];
  }

  /**
   * Access the minimum confidence threshold.
   */
  getMinConfidence(): number {
    return this.minConfidence;
  }
}
