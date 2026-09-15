/**
 * Narrative Coherence Engine
 *
 * Analyzes narrative coherence and identifies gaps.
 * This is a core dependency for the Editor Anvil app.
 *
 * Features:
 * - Gap identification (structural, thematic, character, sensory, continuity)
 * - Coherence scoring across multiple dimensions
 * - Enrichment routing suggestions
 * - Trinity perspective integration (Mia/Miette/Ava8)
 */

import {
  StoryBeat,
  CharacterState,
  ThematicThread,
} from "../schemas/unified_state_bridge.js";

/**
 * Types of narrative gaps that can be identified.
 */
/**
 * Kinds of structural tension between current reality and desired outcome.
 * In a creative orientation this distance is the generative force, not a
 * deficiency — hence `TensionType`, the forward name.
 */
export enum GapType {
  STRUCTURAL = "structural", // Missing beats, incomplete arcs
  THEMATIC = "thematic", // Promised themes underdelivered
  CHARACTER = "character", // Traits mentioned but not demonstrated
  SENSORY = "sensory", // Scenes lacking grounding detail
  CONTINUITY = "continuity", // Timeline/detail inconsistencies
}

/**
 * Forward name for {@link GapType}. Same values — a tension is the generative
 * distance to close, not a hole to patch.
 */
export type TensionType = GapType;
export const TensionType = GapType;

/**
 * Severity levels for identified gaps.
 */
export enum GapSeverity {
  CRITICAL = "critical", // Must fix before publication
  MODERATE = "moderate", // Should address in next pass
  MINOR = "minor", // Nice to have, low priority
}

/**
 * Where to route gaps for remediation.
 */
export enum RoutingTarget {
  STORYTELLER = "storyteller", // Needs prose refinement
  STRUCTURIST = "structurist", // Needs structural repair
  ARCHITECT = "architect", // Schema inconsistency
  AUTHOR = "author", // Human decision required
}

/**
 * Component score status.
 */
export type ComponentStatus = "good" | "warning" | "critical";

/**
 * A structural tension identified in the story — the distance between what the
 * narrative is and what it is reaching toward.
 */
export interface Tension {
  id: string;
  tensionType: TensionType;
  /**
   * @deprecated Use `tensionType`. Retained as an alias for one minor version;
   * carries the same value.
   */
  gapType: TensionType;
  severity: GapSeverity;
  description: string;
  location: Record<string, unknown>; // beat_id, chapter_id, position
  suggestedRoute: RoutingTarget;
  resolved: boolean;
  resolution?: string;
}

/**
 * @deprecated Use {@link Tension}. Backward-compatible alias.
 */
export type Gap = Tension;

/**
 * Create a Tension with defaults. Populates both `tensionType` and the
 * deprecated `gapType` alias with the same value.
 */
export function createTension(
  id: string,
  tensionType: TensionType,
  severity: GapSeverity,
  description: string,
  suggestedRoute: RoutingTarget,
  options: Partial<Tension> = {}
): Tension {
  return {
    id,
    tensionType,
    gapType: tensionType,
    severity,
    description,
    location: options.location ?? {},
    suggestedRoute,
    resolved: options.resolved ?? false,
    resolution: options.resolution,
  };
}

/**
 * @deprecated Use {@link createTension}. Backward-compatible alias.
 */
export function createGap(
  id: string,
  gapType: GapType,
  severity: GapSeverity,
  description: string,
  suggestedRoute: RoutingTarget,
  options: Partial<Tension> = {}
): Tension {
  return createTension(
    id,
    gapType,
    severity,
    description,
    suggestedRoute,
    options
  );
}

/**
 * Score for a single coherence component.
 */
export interface ComponentScore {
  score: number; // 0-100
  status: ComponentStatus;
  issues: string[];
  suggestions: string[];
}

/**
 * Create a ComponentScore with defaults
 */
export function createComponentScore(
  score: number,
  status: ComponentStatus,
  options: Partial<ComponentScore> = {}
): ComponentScore {
  return {
    score,
    status,
    issues: options.issues ?? [],
    suggestions: options.suggestions ?? [],
  };
}

/**
 * Complete coherence score for a narrative.
 */
export interface CoherenceScore {
  overall: number;
  narrativeFlow: ComponentScore;
  characterConsistency: ComponentScore;
  pacing: ComponentScore;
  themeSaturation: ComponentScore;
  continuity: ComponentScore;
  analyzedAt: string;
}

/**
 * Create a CoherenceScore
 */
export function createCoherenceScore(
  overall: number,
  narrativeFlow: ComponentScore,
  characterConsistency: ComponentScore,
  pacing: ComponentScore,
  themeSaturation: ComponentScore,
  continuity: ComponentScore
): CoherenceScore {
  return {
    overall,
    narrativeFlow,
    characterConsistency,
    pacing,
    themeSaturation,
    continuity,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Assessment from three narrative perspectives (Mia/Miette/Ava8).
 */
export interface TrinityAssessment {
  mia: string; // Structural quality (🧠 logical, analytical)
  miette: string; // Emotional effectiveness (🌸 feeling, resonance)
  ava8: string; // Atmospheric/sensory (🎨 visual, immersive)
  priorities: string[];
}

/**
 * Create a TrinityAssessment
 */
export function createTrinityAssessment(
  mia: string,
  miette: string,
  ava8: string,
  priorities: string[] = []
): TrinityAssessment {
  return { mia, miette, ava8, priorities };
}

/**
 * Type alias for the coherence engine state.
 */
export interface CoherenceEngineState {
  beats: StoryBeat[];
  characters: CharacterState[];
  themes: ThematicThread[];

  // Component scores
  narrativeFlowScore?: ComponentScore;
  characterConsistencyScore?: ComponentScore;
  pacingScore?: ComponentScore;
  themeSaturationScore?: ComponentScore;
  continuityScore?: ComponentScore;

  // Overall
  overallScore?: number;
  gaps?: Gap[];
  trinityAssessment?: TrinityAssessment;
  coherenceScore?: CoherenceScore;
}

/**
 * Result of coherence analysis.
 */
export interface CoherenceResult {
  /**
   * Overall narrative coherence as a single comparable number in the range
   * 0-1. Safe to format (`.toFixed`) or compare numerically. For the component
   * breakdown and the 0-100 scores, see `coherenceBreakdown`.
   */
  coherenceScore: number;
  /**
   * Full coherence breakdown: the 0-100 `overall` plus every per-component
   * score (narrative flow, character consistency, pacing, theme, continuity).
   */
  coherenceBreakdown: CoherenceScore;
  tensions: Tension[];
  /**
   * @deprecated Use `tensions`. Retained as an alias for one minor version;
   * references the same array of items.
   */
  gaps: Tension[];
  trinityAssessment: TrinityAssessment;
}

/**
 * Analyzes narrative coherence and identifies gaps.
 *
 * This is a core component for the Editor Anvil app, providing:
 * - Comprehensive coherence scoring across 5 dimensions
 * - Gap identification with severity and routing
 * - Trinity perspective assessment (Mia/Miette/Ava8)
 * - Actionable improvement suggestions
 *
 * @example
 * const engine = new NarrativeCoherenceEngine();
 * const result = engine.analyze(beats, characters, themes);
 *
 * // Overall coherence as a 0-1 number
 * console.log(`Overall coherence: ${result.coherenceScore.toFixed(2)}`);
 * // Component breakdown (0-100 scores)
 * console.log(`Flow: ${result.coherenceBreakdown.narrativeFlow.score}`);
 *
 * // Access tensions (gaps is a deprecated alias)
 * for (const tension of result.tensions) {
 *   console.log(`Tension: ${tension.description} (${tension.severity})`);
 * }
 *
 * // Access Trinity assessment
 * console.log(`Mia says: ${result.trinityAssessment.mia}`);
 */
export class NarrativeCoherenceEngine {
  private strictMode: boolean;
  private gapCounter: number;

  constructor(options: { strictMode?: boolean } = {}) {
    this.strictMode = options.strictMode ?? false;
    this.gapCounter = 0;
  }

  private generateGapId(): string {
    this.gapCounter += 1;
    return `gap_${this.gapCounter}`;
  }

  /**
   * Analyze narrative flow - how smoothly the story progresses.
   *
   * Checks:
   * - Beat transitions (jarring vs smooth)
   * - Logical causality between beats
   * - Pacing consistency
   */
  private analyzeNarrativeFlow(state: CoherenceEngineState): CoherenceEngineState {
    const beats = state.beats;
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score: number;
    let status: ComponentStatus;

    if (beats.length < 2) {
      score = 50.0;
      issues.push("Too few beats to assess flow");
      suggestions.push("Add more story beats to establish narrative rhythm");
    } else {
      // Check for logical function progression
      const functions = beats.map((b) => b.narrativeFunction);

      // Penalize if no setup before confrontation
      let hasProperStructure = false;
      for (let i = 0; i < functions.length; i++) {
        const func = functions[i];
        if (["setup", "introduction", "discovery"].includes(func)) {
          hasProperStructure = true;
          break;
        } else if (["confrontation", "crisis", "climax"].includes(func)) {
          if (!hasProperStructure) {
            issues.push(`Beat ${i + 1} escalates without proper setup`);
            hasProperStructure = true; // Only report once
          }
        }
      }

      // Check emotional continuity
      let prevTone: string | undefined;
      let jarringTransitions = 0;

      for (let i = 0; i < beats.length; i++) {
        const beat = beats[i];
        if (prevTone && beat.emotionalTone) {
          // Simple check: devastation followed by joy is jarring
          const jarringPairs: [string, string][] = [
            ["devastating", "joyful"],
            ["fearful", "peaceful"],
            ["triumphant", "devastating"],
          ];
          for (const [p1, p2] of jarringPairs) {
            if (
              (prevTone.toLowerCase().includes(p1) &&
                beat.emotionalTone.toLowerCase().includes(p2)) ||
              (prevTone.toLowerCase().includes(p2) &&
                beat.emotionalTone.toLowerCase().includes(p1))
            ) {
              jarringTransitions += 1;
              issues.push(`Jarring emotional transition at Beat ${i + 1}`);
            }
          }
        }
        prevTone = beat.emotionalTone;
      }

      // Calculate score
      let baseScore = 85.0;
      baseScore -= jarringTransitions * 10;
      baseScore -=
        issues.filter((i) => i.includes("without proper setup")).length * 15;

      score = Math.max(0.0, Math.min(100.0, baseScore));

      if (jarringTransitions > 0) {
        suggestions.push("Add transitional beats to smooth emotional shifts");
      }
      if (!hasProperStructure) {
        suggestions.push(
          "Consider adding setup beats before major confrontations"
        );
      }
    }

    // Determine status
    if (score >= 70) {
      status = "good";
    } else if (score >= 50) {
      status = "warning";
    } else {
      status = "critical";
    }

    state.narrativeFlowScore = createComponentScore(score, status, {
      issues,
      suggestions,
    });

    return state;
  }

  /**
   * Analyze character consistency across the narrative.
   *
   * Checks:
   * - Character voice consistency
   * - Arc progression logic
   * - Relationship evolution coherence
   */
  private analyzeCharacterConsistency(
    state: CoherenceEngineState
  ): CoherenceEngineState {
    const beats = state.beats;
    const characters = state.characters;
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score: number;
    let status: ComponentStatus;

    if (characters.length === 0) {
      score = 50.0;
      issues.push("No character data provided");
      suggestions.push("Define character states to enable consistency analysis");
    } else {
      // Track character appearances across beats
      const characterBeats: Record<string, number[]> = {};
      for (const char of characters) {
        characterBeats[char.id] = [];
      }

      for (let i = 0; i < beats.length; i++) {
        const beat = beats[i];
        if (beat.characterId && characterBeats[beat.characterId]) {
          characterBeats[beat.characterId].push(i);
        }
      }

      // Check for characters with large gaps
      for (const [charId, appearances] of Object.entries(characterBeats)) {
        if (appearances.length >= 2) {
          for (let i = 1; i < appearances.length; i++) {
            const gap = appearances[i] - appearances[i - 1];
            if (gap > 5) {
              // More than 5 beats between appearances
              const char = characters.find((c) => c.id === charId);
              const name = char?.name || charId;
              issues.push(`Character '${name}' disappears for ${gap} beats`);
              suggestions.push(
                `Consider adding '${name}' to beats between ${appearances[i - 1] + 1} and ${appearances[i] + 1}`
              );
            }
          }
        }
      }

      // Check arc progression
      for (const char of characters) {
        if (char.arcPosition < 0.1 && beats.length > 5) {
          issues.push(`Character '${char.name}' has minimal arc progression`);
        }
      }

      // Calculate score based on issues
      let baseScore = 90.0;
      baseScore -= issues.filter((i) => i.includes("disappears")).length * 8;
      baseScore -= issues.filter((i) => i.includes("minimal arc")).length * 12;

      score = Math.max(0.0, Math.min(100.0, baseScore));
    }

    // Determine status
    if (score >= 70) {
      status = "good";
    } else if (score >= 50) {
      status = "warning";
    } else {
      status = "critical";
    }

    state.characterConsistencyScore = createComponentScore(score, status, {
      issues,
      suggestions,
    });

    return state;
  }

  /**
   * Analyze narrative pacing.
   *
   * Checks:
   * - Tension/relief distribution
   * - Beat density per section
   * - Climax positioning
   */
  private analyzePacing(state: CoherenceEngineState): CoherenceEngineState {
    const beats = state.beats;
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score: number;
    let status: ComponentStatus;

    if (beats.length < 3) {
      score = 50.0;
      issues.push("Too few beats to assess pacing");
      suggestions.push("Add more beats to establish proper pacing rhythm");
    } else {
      // Analyze function distribution
      const functions = beats.map((b) => b.narrativeFunction.toLowerCase());

      // Check for climax positioning (should be in last third)
      const climaxPositions = functions
        .map((f, i) => (f.includes("climax") ? i : -1))
        .filter((i) => i >= 0);

      if (climaxPositions.length === 0) {
        issues.push("No climax beat identified");
        suggestions.push("Ensure at least one beat has a climax function");
      } else {
        // Check if climax is too early
        const lastClimax = climaxPositions[climaxPositions.length - 1];
        const total = beats.length;
        if (lastClimax < total * 0.5) {
          issues.push("Climax occurs too early in the narrative");
          suggestions.push(
            "Move climax to later in the story or add post-climax resolution beats"
          );
        }
      }

      // Check for consecutive high-tension beats
      const highTensionFuncs = [
        "confrontation",
        "crisis",
        "climax",
        "revelation",
      ];
      let consecutiveHigh = 0;
      let maxConsecutive = 0;

      for (const func of functions) {
        if (highTensionFuncs.some((ht) => func.includes(ht))) {
          consecutiveHigh += 1;
          maxConsecutive = Math.max(maxConsecutive, consecutiveHigh);
        } else {
          consecutiveHigh = 0;
        }
      }

      if (maxConsecutive > 3) {
        issues.push(
          `Found ${maxConsecutive} consecutive high-tension beats`
        );
        suggestions.push(
          "Add breathing room with quieter beats between intense moments"
        );
      }

      // Calculate score
      let baseScore = 85.0;
      if (climaxPositions.length === 0) {
        baseScore -= 20;
      } else if (climaxPositions[climaxPositions.length - 1] < beats.length * 0.5) {
        baseScore -= 15;
      }
      baseScore -= Math.min(20, maxConsecutive * 5);

      score = Math.max(0.0, Math.min(100.0, baseScore));
    }

    // Determine status
    if (score >= 70) {
      status = "good";
    } else if (score >= 50) {
      status = "warning";
    } else {
      status = "critical";
    }

    state.pacingScore = createComponentScore(score, status, {
      issues,
      suggestions,
    });

    return state;
  }

  /**
   * Analyze how well themes permeate the narrative.
   *
   * Checks:
   * - Theme presence across beats
   * - Theme introduction and payoff
   * - Theme strength consistency
   */
  private analyzeThemeSaturation(
    state: CoherenceEngineState
  ): CoherenceEngineState {
    const beats = state.beats;
    const themes = state.themes;
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score: number;
    let status: ComponentStatus;

    if (themes.length === 0) {
      score = 50.0;
      issues.push("No themes defined");
      suggestions.push(
        "Define thematic threads to enable saturation analysis"
      );
    } else {
      // Track theme presence
      const themeCoverage: Record<string, number> = {};

      for (const theme of themes) {
        // Calculate theme presence across beats
        let beatsWithTheme = 0;
        for (const beat of beats) {
          if (beat.thematicTags?.includes(theme.id)) {
            beatsWithTheme += 1;
          }
        }

        const coverage = beatsWithTheme / Math.max(beats.length, 1);
        themeCoverage[theme.name] = coverage;

        // Check for underdeveloped themes
        if (coverage < 0.2 && theme.strength > 0.5) {
          issues.push(
            `Theme '${theme.name}' is important but appears rarely`
          );
          suggestions.push(
            `Weave '${theme.name}' into more beats to fulfill its promise`
          );
        }

        // Check for theme that appears but never pays off
        if (coverage > 0.3 && theme.strength < 0.3) {
          issues.push(
            `Theme '${theme.name}' appears often but lacks impact`
          );
          suggestions.push(
            `Strengthen the thematic weight of '${theme.name}' in key beats`
          );
        }
      }

      // Calculate average coverage
      const coverageValues = Object.values(themeCoverage);
      const avgCoverage =
        coverageValues.reduce((a, b) => a + b, 0) /
        Math.max(coverageValues.length, 1);

      // Score based on coverage and issues
      let baseScore = Math.min(100.0, avgCoverage * 100 + 20); // Base on coverage + buffer
      baseScore -= issues.filter((i) => i.includes("rarely")).length * 10;
      baseScore -= issues.filter((i) => i.includes("lacks impact")).length * 8;

      score = Math.max(0.0, Math.min(100.0, baseScore));
    }

    // Determine status
    if (score >= 70) {
      status = "good";
    } else if (score >= 50) {
      status = "warning";
    } else {
      status = "critical";
    }

    state.themeSaturationScore = createComponentScore(score, status, {
      issues,
      suggestions,
    });

    return state;
  }

  /**
   * Analyze narrative continuity.
   *
   * Checks:
   * - Timeline consistency
   * - Detail consistency across beats
   * - Setting/location coherence
   */
  private analyzeContinuity(state: CoherenceEngineState): CoherenceEngineState {
    const beats = state.beats;
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score: number;
    let status: ComponentStatus;

    if (beats.length < 2) {
      score = 70.0; // Default to passing if not enough to analyze
      issues.push("Too few beats for continuity analysis");
    } else {
      // Check sequence ordering
      const sequences = beats.map((b) => b.sequence);
      const sortedSequences = [...sequences].sort((a, b) => a - b);

      if (JSON.stringify(sequences) !== JSON.stringify(sortedSequences)) {
        issues.push("Beat sequences are not in order");
        suggestions.push("Reorder beats to ensure logical sequence progression");
      }

      // Check for duplicate sequences
      if (sequences.length !== new Set(sequences).size) {
        issues.push("Duplicate beat sequence numbers found");
        suggestions.push("Ensure each beat has a unique sequence number");
      }

      // Check for gaps in sequence
      const maxSeq = Math.max(...sequences);
      const expected = new Set(
        Array.from({ length: maxSeq }, (_, i) => i + 1)
      );
      const actual = new Set(sequences);
      const missing = [...expected].filter((x) => !actual.has(x));

      if (missing.length > 0 && missing.length <= 3) {
        // Small gaps are issues
        issues.push(`Missing beat sequences: ${missing.sort().join(", ")}`);
        suggestions.push("Fill in missing beat sequences or renumber");
      }

      // Calculate score
      let baseScore = 90.0;
      baseScore -= issues.filter((i) => i.includes("not in order")).length * 20;
      baseScore -= issues.filter((i) => i.includes("Duplicate")).length * 15;
      baseScore -= issues.filter((i) => i.includes("Missing")).length * 5;

      score = Math.max(0.0, Math.min(100.0, baseScore));
    }

    // Determine status
    if (score >= 70) {
      status = "good";
    } else if (score >= 50) {
      status = "warning";
    } else {
      status = "critical";
    }

    state.continuityScore = createComponentScore(score, status, {
      issues,
      suggestions,
    });

    return state;
  }

  /**
   * Calculate the overall coherence score from components.
   */
  private calculateOverallScore(
    state: CoherenceEngineState
  ): CoherenceEngineState {
    const components = [
      state.narrativeFlowScore,
      state.characterConsistencyScore,
      state.pacingScore,
      state.themeSaturationScore,
      state.continuityScore,
    ];

    const validScores = components
      .filter((c): c is ComponentScore => c !== undefined)
      .map((c) => c.score);

    if (validScores.length > 0) {
      // Weighted average (narrative flow and character consistency weighted higher)
      const weights = [1.2, 1.2, 1.0, 1.0, 0.8]; // Matches component order
      const weightedSum = validScores.reduce(
        (sum, s, i) => sum + s * weights[i],
        0
      );
      const totalWeight = weights
        .slice(0, validScores.length)
        .reduce((a, b) => a + b, 0);
      state.overallScore = weightedSum / totalWeight;
    } else {
      state.overallScore = 50.0;
    }

    return state;
  }

  /**
   * Identify narrative gaps from component analyses.
   */
  private identifyGaps(state: CoherenceEngineState): CoherenceEngineState {
    const gaps: Gap[] = [];

    // Extract issues from each component
    const componentMappings: [keyof CoherenceEngineState, GapType][] = [
      ["narrativeFlowScore", GapType.STRUCTURAL],
      ["characterConsistencyScore", GapType.CHARACTER],
      ["pacingScore", GapType.STRUCTURAL],
      ["themeSaturationScore", GapType.THEMATIC],
      ["continuityScore", GapType.CONTINUITY],
    ];

    for (const [componentKey, gapType] of componentMappings) {
      const component = state[componentKey] as ComponentScore | undefined;
      if (component?.issues) {
        for (const issue of component.issues) {
          // Determine severity
          let severity: GapSeverity;
          if (component.status === "critical") {
            severity = GapSeverity.CRITICAL;
          } else if (issue.includes("rarely") || issue.includes("disappears")) {
            severity = GapSeverity.MODERATE;
          } else {
            severity = GapSeverity.MINOR;
          }

          // Determine routing
          let route: RoutingTarget;
          if (gapType === GapType.STRUCTURAL) {
            route = RoutingTarget.STRUCTURIST;
          } else if (gapType === GapType.CHARACTER) {
            route = RoutingTarget.STORYTELLER;
          } else if (gapType === GapType.THEMATIC) {
            route = RoutingTarget.STRUCTURIST;
          } else if (gapType === GapType.SENSORY) {
            route = RoutingTarget.STORYTELLER;
          } else {
            // CONTINUITY
            route = RoutingTarget.AUTHOR;
          }

          gaps.push(
            createGap(
              this.generateGapId(),
              gapType,
              severity,
              issue,
              route,
              { location: { component: componentKey } }
            )
          );
        }
      }
    }

    // Sort by severity (critical first)
    const severityOrder: Record<GapSeverity, number> = {
      [GapSeverity.CRITICAL]: 0,
      [GapSeverity.MODERATE]: 1,
      [GapSeverity.MINOR]: 2,
    };
    gaps.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    state.gaps = gaps;

    return state;
  }

  /**
   * Generate Trinity perspective assessment (Mia/Miette/Ava8).
   *
   * Each persona provides feedback aligned with their perspective:
   * - Mia 🧠: Structural/logical analysis
   * - Miette 🌸: Emotional/resonance analysis
   * - Ava8 🎨: Atmospheric/sensory analysis
   */
  private generateTrinityAssessment(
    state: CoherenceEngineState
  ): CoherenceEngineState {
    const gaps = state.gaps || [];

    // Component scores
    const flow = state.narrativeFlowScore;
    const character = state.characterConsistencyScore;
    const pacing = state.pacingScore;
    const theme = state.themeSaturationScore;
    const continuity = state.continuityScore;

    // Build Mia's assessment (structural)
    const miaParts: string[] = [];
    if (flow) {
      miaParts.push(`Structure is ${flow.score.toFixed(0)}% sound.`);
      if (flow.issues.length > 0) {
        miaParts.push(`Key structural gap: ${flow.issues[0]}`);
      }
    }
    if (pacing && pacing.score < 70) {
      miaParts.push(`Pacing needs attention (${pacing.score.toFixed(0)}%).`);
      if (pacing.suggestions.length > 0) {
        miaParts.push(pacing.suggestions[0]);
      }
    }
    if (continuity && continuity.score < 80) {
      miaParts.push(
        `Continuity has ${continuity.issues.length} issues to address.`
      );
    }

    const mia =
      miaParts.length > 0
        ? miaParts.join(" ")
        : "Structure analysis unavailable.";

    // Build Miette's assessment (emotional)
    const mietteParts: string[] = [];
    if (character) {
      if (character.score >= 80) {
        mietteParts.push("Character arcs are resonating well.");
      } else {
        mietteParts.push(
          `Character consistency is ${character.score.toFixed(0)}%.`
        );
        if (character.issues.length > 0) {
          mietteParts.push(`The emotional gap: ${character.issues[0]}`);
        }
      }
    }
    if (theme) {
      if (theme.score >= 70) {
        mietteParts.push("Themes are landing with emotional weight.");
      } else {
        mietteParts.push("Themes need stronger emotional anchoring.");
      }
    }
    if (flow?.issues) {
      const jarring = flow.issues.filter((i) => i.includes("Jarring"));
      if (jarring.length > 0) {
        mietteParts.push("Emotional transitions feel abrupt in places.");
      }
    }

    const miette =
      mietteParts.length > 0
        ? mietteParts.join(" ")
        : "Emotional analysis unavailable.";

    // Build Ava8's assessment (atmospheric)
    const ava8Parts: string[] = [];
    const sensoryGaps = gaps.filter((g) => g.gapType === GapType.SENSORY);
    if (sensoryGaps.length > 0) {
      ava8Parts.push(`Found ${sensoryGaps.length} sensory gaps to address.`);
    }

    if (pacing && pacing.score >= 70) {
      ava8Parts.push("Atmospheric rhythm feels balanced.");
    } else {
      ava8Parts.push("Atmosphere could use more grounding moments.");
    }

    // Check for consecutive high-tension (affects atmosphere)
    if (
      pacing?.issues.some((i) => i.includes("consecutive high-tension"))
    ) {
      ava8Parts.push(
        "The dense tension sections may benefit from visual breathing room."
      );
    }

    const ava8 =
      ava8Parts.length > 0
        ? ava8Parts.join(" ")
        : "Atmospheric analysis unavailable.";

    // Determine priorities
    const priorities: string[] = [];
    const criticalGaps = gaps.filter(
      (g) => g.severity === GapSeverity.CRITICAL
    );
    if (criticalGaps.length > 0) {
      priorities.push(...criticalGaps.slice(0, 3).map((g) => g.description));
    } else {
      const moderateGaps = gaps.filter(
        (g) => g.severity === GapSeverity.MODERATE
      );
      if (moderateGaps.length > 0) {
        priorities.push(
          ...moderateGaps.slice(0, 3).map((g) => g.description)
        );
      }
    }

    if (priorities.length === 0) {
      priorities.push("Minor polish items only - narrative is coherent");
    }

    state.trinityAssessment = createTrinityAssessment(
      mia,
      miette,
      ava8,
      priorities
    );

    return state;
  }

  /**
   * Build the final coherence result object.
   */
  private buildCoherenceResult(
    state: CoherenceEngineState
  ): CoherenceEngineState {
    state.coherenceScore = createCoherenceScore(
      state.overallScore || 50.0,
      state.narrativeFlowScore ||
        createComponentScore(50, "warning"),
      state.characterConsistencyScore ||
        createComponentScore(50, "warning"),
      state.pacingScore || createComponentScore(50, "warning"),
      state.themeSaturationScore ||
        createComponentScore(50, "warning"),
      state.continuityScore ||
        createComponentScore(50, "warning")
    );

    return state;
  }

  /**
   * Run the full analysis pipeline and return the raw engine state.
   */
  private runPipeline(
    beats: StoryBeat[],
    characters: CharacterState[],
    themes: ThematicThread[]
  ): CoherenceEngineState {
    let state: CoherenceEngineState = { beats, characters, themes };

    state = this.analyzeNarrativeFlow(state);
    state = this.analyzeCharacterConsistency(state);
    state = this.analyzePacing(state);
    state = this.analyzeThemeSaturation(state);
    state = this.analyzeContinuity(state);
    state = this.calculateOverallScore(state);
    state = this.identifyGaps(state);
    state = this.generateTrinityAssessment(state);
    state = this.buildCoherenceResult(state);

    return state;
  }

  /**
   * Analyze narrative coherence.
   *
   * Returns a stable {@link CoherenceResult} — callers no longer need an
   * `'coherenceScore' in result` guard. For the full internal state, use
   * {@link NarrativeCoherenceEngine.analyzeWithState}.
   *
   * @param beats List of story beats to analyze
   * @param characters Optional list of character states
   * @param themes Optional list of thematic threads
   * @returns CoherenceResult whose `coherenceScore` is a 0-1 number, with the
   *   0-100 breakdown on `coherenceBreakdown`, plus tensions and trinityAssessment
   */
  analyze(
    beats: StoryBeat[],
    characters?: CharacterState[],
    themes?: ThematicThread[]
  ): CoherenceResult;
  /**
   * @deprecated Pass no `includeMetadata` and use {@link analyzeWithState} for
   * the full state. This overload preserves the historical boolean switch.
   */
  analyze(
    beats: StoryBeat[],
    characters: CharacterState[],
    themes: ThematicThread[],
    includeMetadata: true
  ): CoherenceEngineState;
  analyze(
    beats: StoryBeat[],
    characters: CharacterState[],
    themes: ThematicThread[],
    includeMetadata: false
  ): CoherenceResult;
  analyze(
    beats: StoryBeat[],
    characters: CharacterState[] = [],
    themes: ThematicThread[] = [],
    includeMetadata: boolean = false
  ): CoherenceResult | CoherenceEngineState {
    const state = this.runPipeline(beats, characters, themes);

    if (includeMetadata) {
      return state;
    }

    const tensions = state.gaps || [];
    const breakdown = state.coherenceScore!;
    return {
      // Normalize the 0-100 overall to a 0-1 number — the historical, easily
      // comparable contract. The 0-100 detail lives on `coherenceBreakdown`.
      coherenceScore: Math.round((breakdown.overall / 100) * 10000) / 10000,
      coherenceBreakdown: breakdown,
      tensions,
      gaps: tensions,
      trinityAssessment: state.trinityAssessment!,
    };
  }

  /**
   * Analyze narrative coherence and return the full internal engine state
   * (component scores, tensions, trinity assessment, and the assembled
   * coherence score). The forward-named replacement for
   * `analyze(..., includeMetadata: true)`.
   */
  analyzeWithState(
    beats: StoryBeat[],
    characters: CharacterState[] = [],
    themes: ThematicThread[] = []
  ): CoherenceEngineState {
    return this.runPipeline(beats, characters, themes);
  }

  /**
   * Group gaps by their routing target.
   *
   * @param gaps List of identified gaps
   * @returns Dictionary mapping routing target to list of gaps
   */
  getRoutingSuggestions(gaps: Gap[]): Record<RoutingTarget, Gap[]> {
    const routing: Record<RoutingTarget, Gap[]> = {
      [RoutingTarget.STORYTELLER]: [],
      [RoutingTarget.STRUCTURIST]: [],
      [RoutingTarget.ARCHITECT]: [],
      [RoutingTarget.AUTHOR]: [],
    };

    for (const gap of gaps) {
      routing[gap.suggestedRoute].push(gap);
    }

    return routing;
  }
}
