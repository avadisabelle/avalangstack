/**
 * Relational Validator
 *
 * Validates relational integrity of inquiry batches before dispatch.
 * Ensures that inquiries carry proper relational context, accountability,
 * and ceremonial markers where required.
 *
 * Grounded in Wilson's (2008) axiological commitment:
 * every inquiry exists within a web of relations and must carry
 * evidence of that awareness.
 */

import type { Inquiry, InquiryBatch } from "ava-langchain-inquiry-routing";
import {
  RELATIONAL_KEYWORDS,
  CEREMONY_HOLD_KEYWORDS,
  MIN_RELATIONAL_SCORE,
  RELATIONAL_WEIGHT,
  ACCOUNTABILITY_WEIGHT,
} from "../constants.js";

// =============================================================================
// Types
// =============================================================================

export interface RelationalFlag {
  inquiryId: string;
  field: string;
  severity: "warning" | "hold";
  message: string;
}

export interface RelationalValidationResult {
  valid: boolean;
  score: number; // 0–1
  flags: RelationalFlag[];
  ceremonyRequired: boolean;
  summary: string;
}

export interface RelationalValidatorOptions {
  /** Minimum relational score to pass validation (default 0.5) */
  minScore?: number;
  /** Whether to flag inquiries touching Indigenous content without indigenous_lens (default true) */
  requireIndigenousLens?: boolean;
  /** Whether to require ceremonial_intent on WEST-direction inquiries (default true) */
  requireCeremonialIntentForWest?: boolean;
}

// =============================================================================
// RelationalValidator
// =============================================================================

export class RelationalValidator {
  private readonly minScore: number;
  private readonly requireIndigenousLens: boolean;
  private readonly requireCeremonialIntentForWest: boolean;

  constructor(options?: RelationalValidatorOptions) {
    this.minScore = options?.minScore ?? MIN_RELATIONAL_SCORE;
    this.requireIndigenousLens = options?.requireIndigenousLens ?? true;
    this.requireCeremonialIntentForWest = options?.requireCeremonialIntentForWest ?? true;
  }

  /**
   * Validate relational integrity of an entire inquiry batch.
   */
  validate(batch: InquiryBatch): RelationalValidationResult {
    const allInquiries = this.flatten(batch);
    const flags: RelationalFlag[] = [];

    for (const inquiry of allInquiries) {
      flags.push(...this.validateInquiry(inquiry));
    }

    const score = this.calculateScore(allInquiries, flags);
    const ceremonyRequired = this.detectCeremonyRequired(allInquiries, flags);

    const holdCount = flags.filter((f) => f.severity === "hold").length;
    const warningCount = flags.filter((f) => f.severity === "warning").length;
    const valid = score >= this.minScore && holdCount === 0;

    let summary: string;
    if (holdCount > 0) {
      summary = `HOLD: ${holdCount} critical relational flag(s) — ceremony or human review required before dispatch.`;
    } else if (warningCount > 0) {
      summary = `CAUTION: ${warningCount} relational warning(s). Score: ${(score * 100).toFixed(0)}%.`;
    } else {
      summary = `PROCEED: Relational integrity confirmed. Score: ${(score * 100).toFixed(0)}%.`;
    }

    return { valid, score, flags, ceremonyRequired, summary };
  }

  /**
   * Validate a single inquiry's relational fields.
   */
  validateInquiry(inquiry: Inquiry): RelationalFlag[] {
    const flags: RelationalFlag[] = [];

    // Check relational_context
    if (!inquiry.relational_context || inquiry.relational_context.trim() === "") {
      flags.push({
        inquiryId: inquiry.id,
        field: "relational_context",
        severity: "warning",
        message: "Missing relational_context — inquiry lacks relational grounding.",
      });
    }

    // Check accountability
    if (!inquiry.accountability || inquiry.accountability.trim() === "") {
      flags.push({
        inquiryId: inquiry.id,
        field: "accountability",
        severity: "warning",
        message: "Missing accountability — no relational obligation stated.",
      });
    }

    // Check Indigenous content without indigenous_lens
    if (this.requireIndigenousLens && this.touchesIndigenousContent(inquiry)) {
      if (!inquiry.indigenous_lens || inquiry.indigenous_lens.trim() === "") {
        flags.push({
          inquiryId: inquiry.id,
          field: "indigenous_lens",
          severity: "hold",
          message: "🛑 Indigenous domain content without indigenous_lens — Two-Eyed Seeing marker required.",
        });
      }
    }

    // Check WEST-direction ceremonial intent
    if (
      this.requireCeremonialIntentForWest &&
      inquiry.direction === "west" &&
      (!inquiry.ceremonial_intent || inquiry.ceremonial_intent.trim() === "")
    ) {
      flags.push({
        inquiryId: inquiry.id,
        field: "ceremonial_intent",
        severity: "warning",
        message: "WEST inquiry without ceremonial_intent — reflective grounding recommended.",
      });
    }

    // Check ceremony-hold keywords in query
    if (this.touchesCeremonyHoldContent(inquiry)) {
      if (!inquiry.ceremonial_intent || inquiry.ceremonial_intent.trim() === "") {
        flags.push({
          inquiryId: inquiry.id,
          field: "ceremonial_intent",
          severity: "hold",
          message: "🛑 Ceremonial domain content requires explicit ceremonial_intent.",
        });
      }
    }

    return flags;
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private touchesIndigenousContent(inquiry: Inquiry): boolean {
    const lower = inquiry.query.toLowerCase();
    const indigenousKeywords = ["indigenous", "first nations", "treaty", "elder", "medicine wheel"];
    return indigenousKeywords.some((kw) => lower.includes(kw));
  }

  private touchesCeremonyHoldContent(inquiry: Inquiry): boolean {
    const lower = inquiry.query.toLowerCase();
    return CEREMONY_HOLD_KEYWORDS.some((kw) => lower.includes(kw));
  }

  private calculateScore(inquiries: Inquiry[], flags: RelationalFlag[]): number {
    if (inquiries.length === 0) return 1;

    let relationalComplete = 0;
    let accountabilityComplete = 0;

    for (const inquiry of inquiries) {
      if (inquiry.relational_context && inquiry.relational_context.trim() !== "") {
        relationalComplete++;
      }
      if (inquiry.accountability && inquiry.accountability.trim() !== "") {
        accountabilityComplete++;
      }
    }

    const relationalRatio = relationalComplete / inquiries.length;
    const accountabilityRatio = accountabilityComplete / inquiries.length;

    // Weighted score
    let score = relationalRatio * RELATIONAL_WEIGHT + accountabilityRatio * ACCOUNTABILITY_WEIGHT;

    // Penalty for hold-level flags
    const holdCount = flags.filter((f) => f.severity === "hold").length;
    score = Math.max(0, score - holdCount * 0.2);

    return Math.min(1, score);
  }

  private detectCeremonyRequired(inquiries: Inquiry[], flags: RelationalFlag[]): boolean {
    // Any hold-level flag triggers ceremony
    if (flags.some((f) => f.severity === "hold")) return true;

    // Indigenous content triggers ceremony review only when relational markers
    // (indigenous_lens) are missing or empty — if the inquiry already carries
    // proper Two-Eyed Seeing markers, ceremony gating is not needed.
    return inquiries.some(
      (inquiry) =>
        this.touchesIndigenousContent(inquiry) &&
        (!inquiry.indigenous_lens || inquiry.indigenous_lens.trim() === ""),
    );
  }

  private flatten(batch: InquiryBatch): Inquiry[] {
    return [...batch.east, ...batch.south, ...batch.west, ...batch.north];
  }
}
