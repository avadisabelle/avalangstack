/**
 * Ceremony Gate
 *
 * Graph-level value gate that checks whether a decomposed prompt
 * can proceed to execution or needs ceremonial pause.
 *
 * Integrates MedicineWheelBridge assessment with Three-Universe
 * perspective analysis to make proceed/hold decisions.
 */

import type { DecompositionResult } from "ava-langchain-prompt-decomposition";
import type { ThreeUniversePerspective } from "./perspective_nodes.js";
import { CEREMONY_KEYWORDS } from "../constants.js";

// =============================================================================
// Types
// =============================================================================

export enum GateDecision {
  PROCEED = "proceed",
  CAUTION = "caution",
  HOLD = "hold",
}

export interface CeremonyGateResult {
  decision: GateDecision;
  reasons: string[];
  relationalScore: number; // 0-1
  ceremonyNeeded: boolean;
  humanReviewRequested: boolean;
}

export interface CeremonyGateOptions {
  /** Minimum balance score to proceed without caution (default 0.4) */
  balanceThreshold?: number;
  /** Minimum coherence to proceed (default 0.3) */
  coherenceThreshold?: number;
  /** Whether to enforce ceremony hold (default false — advisory only) */
  enforce?: boolean;
}

// =============================================================================
// CeremonyGate
// =============================================================================

export class CeremonyGate {
  private readonly balanceThreshold: number;
  private readonly coherenceThreshold: number;
  private readonly enforce: boolean;

  constructor(options?: CeremonyGateOptions) {
    this.balanceThreshold = options?.balanceThreshold ?? 0.4;
    this.coherenceThreshold = options?.coherenceThreshold ?? 0.3;
    this.enforce = options?.enforce ?? false;
  }

  /**
   * Evaluate whether a decomposition can proceed to execution.
   */
  evaluate(
    decomposition: DecompositionResult,
    perspective?: ThreeUniversePerspective
  ): CeremonyGateResult {
    const reasons: string[] = [];
    let relationalScore = decomposition.balance;
    let ceremonyNeeded = false;
    let humanReviewRequested = false;

    // Check balance
    if (decomposition.balance < this.balanceThreshold) {
      reasons.push(
        `Balance (${(decomposition.balance * 100).toFixed(0)}%) below threshold (${(this.balanceThreshold * 100).toFixed(0)}%)`
      );
    }

    // Check neglected directions
    if (decomposition.neglectedDirections.length > 0) {
      const dirs = decomposition.neglectedDirections.join(", ");
      reasons.push(`Neglected directions: ${dirs}`);
    }

    // Check for ceremony-domain keywords in prompt
    const lower = decomposition.prompt.toLowerCase();
    const hasCeremonyDomain = CEREMONY_KEYWORDS.some((kw) => lower.includes(kw));

    if (hasCeremonyDomain && decomposition.directions.west?.length === 0) {
      reasons.push("Indigenous/ceremonial domain work without validation/reflection dimension");
      ceremonyNeeded = true;
      humanReviewRequested = true;
    }

    // Check perspective analysis if available
    if (perspective) {
      relationalScore = (decomposition.balance + perspective.coherence) / 2;

      if (perspective.coherence < this.coherenceThreshold) {
        reasons.push(
          `Three-universe coherence (${(perspective.coherence * 100).toFixed(0)}%) below threshold`
        );
      }

      // Check for critical flags
      const criticalFlags = perspective.insights
        .flatMap((i) => i.flags)
        .filter((f) => f.includes("🛑"));

      if (criticalFlags.length > 0) {
        reasons.push(...criticalFlags);
        ceremonyNeeded = true;
        humanReviewRequested = true;
      }

      // Check for warnings
      const warnings = perspective.insights
        .flatMap((i) => i.flags)
        .filter((f) => f.includes("⚠️"));

      if (warnings.length > 0) {
        reasons.push(...warnings);
        ceremonyNeeded = true;
      }
    }

    // Determine decision
    let decision: GateDecision;
    if (humanReviewRequested || (ceremonyNeeded && this.enforce)) {
      decision = GateDecision.HOLD;
    } else if (reasons.length > 0) {
      decision = GateDecision.CAUTION;
    } else {
      decision = GateDecision.PROCEED;
    }

    return {
      decision,
      reasons,
      relationalScore: Math.max(0, Math.min(1, relationalScore)),
      ceremonyNeeded,
      humanReviewRequested,
    };
  }

  /**
   * Quick check: can we proceed?
   */
  canProceed(
    decomposition: DecompositionResult,
    perspective?: ThreeUniversePerspective
  ): boolean {
    const result = this.evaluate(decomposition, perspective);
    return result.decision !== GateDecision.HOLD;
  }
}
