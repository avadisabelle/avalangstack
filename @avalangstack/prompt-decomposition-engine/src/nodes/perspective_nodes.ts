/**
 * Perspective Nodes
 *
 * Three-universe perspective analysis of decomposed prompts.
 * Each prompt decomposition is viewed through three lenses:
 *
 * - Mia (Engineer): Technical feasibility, dependencies, architecture
 * - Ava8 (Ceremony): Relational accountability, protocol, governance
 * - Miette (Story Engine): Narrative coherence, emotional arc, meaning
 *
 * These perspectives enrich the PDE decomposition with multi-lens analysis
 * that bridges the Three-Universe Processor from narrative-intelligence.
 */

import { v4 as uuid } from "uuid";
import type { DecompositionResult, Direction } from "ava-langchain-prompt-decomposition";

// =============================================================================
// Types
// =============================================================================

export enum Universe {
  ENGINEER = "engineer",
  CEREMONY = "ceremony",
  STORY_ENGINE = "story_engine",
}

export const UNIVERSE_NAMES: Record<Universe, string> = {
  [Universe.ENGINEER]: "Mia (Engineer)",
  [Universe.CEREMONY]: "Ava8 (Ceremony)",
  [Universe.STORY_ENGINE]: "Miette (Story Engine)",
};

export interface PerspectiveInsight {
  universe: Universe;
  observation: string;
  relevantActions: string[]; // IDs from action stack
  confidence: number;
  flags: string[];
}

export interface ThreeUniversePerspective {
  id: string;
  timestamp: string;
  decompositionId: string;
  insights: PerspectiveInsight[];
  leadUniverse: Universe;
  coherence: number; // How well the three perspectives align (0-1)
  synthesis: string;
}

import { UNIVERSE_KEYWORDS } from "../constants.js";

// =============================================================================
// PerspectiveAnalyzer
// =============================================================================

export class PerspectiveAnalyzer {
  /**
   * Analyze a decomposition result through three universe lenses.
   */
  analyze(decomposition: DecompositionResult): ThreeUniversePerspective {
    const id = uuid();
    const insights: PerspectiveInsight[] = [];

    // Analyze through each universe
    for (const universe of Object.values(Universe)) {
      const insight = this.analyzeFromUniverse(universe, decomposition);
      insights.push(insight);
    }

    // Determine lead universe
    const sorted = [...insights].sort((a, b) => b.confidence - a.confidence);
    const leadUniverse = sorted[0].universe;

    // Calculate coherence (how well they agree on priorities)
    const coherence = this.calculateCoherence(insights, decomposition);

    // Synthesize
    const synthesis = this.synthesize(insights, decomposition);

    return {
      id,
      timestamp: new Date().toISOString(),
      decompositionId: decomposition.id,
      insights,
      leadUniverse,
      coherence,
      synthesis,
    };
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private analyzeFromUniverse(
    universe: Universe,
    decomposition: DecompositionResult
  ): PerspectiveInsight {
    const keywords = UNIVERSE_KEYWORDS[universe];
    const promptLower = decomposition.prompt.toLowerCase();
    const flags: string[] = [];
    const relevantActions: string[] = [];

    // Score keyword presence
    let keywordHits = 0;
    for (const kw of keywords) {
      if (promptLower.includes(kw)) keywordHits++;
    }
    const confidence = Math.min(keywordHits / 5, 1);

    // Find relevant actions
    for (const action of decomposition.actionStack) {
      const actionLower = action.text.toLowerCase();
      for (const kw of keywords) {
        if (actionLower.includes(kw)) {
          relevantActions.push(action.id);
          break;
        }
      }
    }

    // Generate observation and flags based on universe
    let observation: string;

    switch (universe) {
      case Universe.ENGINEER: {
        const hasTests = decomposition.actionStack.some(
          (a) => a.direction === ("west" as Direction)
        );
        const hasDeps = decomposition.secondary.some((s) => s.dependency !== null);
        observation = `Technical scope: ${decomposition.actionStack.length} actions, ${hasDeps ? "with" : "no"} dependency chain.`;
        if (!hasTests) flags.push("No validation/test actions detected");
        if (decomposition.balance < 0.3) flags.push("Unbalanced — may need architectural review");
        break;
      }
      case Universe.CEREMONY: {
        const hasWest = decomposition.directions.west?.length > 0;
        const hasEast = decomposition.directions.east?.length > 0;
        observation = `Relational coverage: EAST(vision)=${decomposition.directions.east?.length ?? 0}, WEST(ceremony)=${decomposition.directions.west?.length ?? 0} insights.`;
        if (!hasWest) flags.push("⚠️ No ceremonial/reflective dimension — pause recommended");
        if (!hasEast) flags.push("Vision unclear — who does this serve?");
        if (promptLower.includes("indigenous") && !hasWest) {
          flags.push("🛑 Indigenous domain work without ceremony context");
        }
        break;
      }
      case Universe.STORY_ENGINE: {
        const hasArc = decomposition.actionStack.length > 3;
        observation = `Narrative shape: ${decomposition.actionStack.length}-step journey, ${decomposition.leadDirection} led.`;
        if (!hasArc) flags.push("Very short arc — may lack narrative depth");
        if (decomposition.neglectedDirections.length > 1) {
          flags.push(`Neglected perspectives: ${decomposition.neglectedDirections.join(", ")}`);
        }
        break;
      }
    }

    return {
      universe,
      observation,
      relevantActions,
      confidence,
      flags,
    };
  }

  private calculateCoherence(
    insights: PerspectiveInsight[],
    decomposition: DecompositionResult
  ): number {
    // Coherence based on: flag overlap (fewer unique flags = more aligned)
    const allFlags = insights.flatMap((i) => i.flags);
    const uniqueFlags = new Set(allFlags).size;
    const flagCoherence = uniqueFlags === 0 ? 1 : Math.max(0, 1 - uniqueFlags / 10);

    // Balance contributes to coherence
    const balanceCoherence = decomposition.balance;

    return (flagCoherence * 0.6 + balanceCoherence * 0.4);
  }

  private synthesize(
    insights: PerspectiveInsight[],
    decomposition: DecompositionResult
  ): string {
    const flags = insights.flatMap((i) => i.flags);
    const hasCritical = flags.some((f) => f.includes("🛑"));
    const hasWarning = flags.some((f) => f.includes("⚠️"));

    if (hasCritical) {
      return "HOLD: Critical flags raised — ceremony or protocol review required before proceeding.";
    }
    if (hasWarning) {
      return `CAUTION: ${flags.filter((f) => f.includes("⚠️")).length} warning(s) raised. Consider addressing before execution.`;
    }
    if (decomposition.balance > 0.5) {
      return "PROCEED: Well-balanced decomposition across all perspectives.";
    }
    return `REVIEW: Decomposition is ${decomposition.leadDirection}-heavy. Consider broadening perspective.`;
  }
}
