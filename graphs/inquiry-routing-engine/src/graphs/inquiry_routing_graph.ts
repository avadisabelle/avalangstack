/**
 * Inquiry Routing Graph
 *
 * A state-based graph that orchestrates the PDE-to-Inquiry pipeline:
 * 1. EAST node (Generate): Produce inquiries from decomposition
 * 2. SOUTH node (Route): Classify and route each inquiry to source channels
 * 3. WEST node (Validate): Relational validation — check accountability, ceremonial fields
 * 4. NORTH node (Dispatch): Format inquiries for dispatch to QMD/deep-search/workspace
 *
 * Canonical direction mapping: East=Vision, South=Action, West=Synthesis, North=Structure
 * (mcp-pde variant: WEST=Validation, NORTH=Action — see inquiry-router.md for canonical source)
 *
 * This graph consumes a DecompositionResult from ava-langchain-prompt-decomposition
 * and produces dispatch-ready inquiries routed through Four Directions
 * with relational accountability gating.
 *
 * Designed to be consumed as a subgraph in larger LangGraph workflows,
 * typically downstream of a DecompositionGraph.
 */

import { v4 as uuid } from "uuid";
import type { DecompositionResult } from "ava-langchain-prompt-decomposition";
import {
  InquiryGenerator,
  InquiryRouter,
  RelationalEnricher,
  InquirySource,
  InquiryStatus,
  type Inquiry,
  type InquiryBatch,
  type RoutingDecision,
  type RoutedInquiryBatch,
} from "ava-langchain-inquiry-routing";

import {
  RelationalValidator,
  type RelationalValidationResult,
} from "../nodes/relational_validator.js";
import {
  DispatchFormatter,
  type FormattedDispatch,
} from "../nodes/dispatch_formatter.js";

// =============================================================================
// State
// =============================================================================

export interface StrategyMetadata {
  schemaVersion: number;
  strategyId: string;
  selectionReason: string;
  complexity: {
    level: "simple" | "moderate" | "complex" | "ambiguous";
    wordCount: number;
    clauseCount: number;
    conditionalCount: number;
    hedgingCount: number;
    actionVerbCount: number;
    directionalSpread: number;
    hasTechnicalReferences: boolean;
    hasNestedStructure: boolean;
  };
  confidence: {
    overall: number;
    perDirection: Record<string, number>;
  };
  diagnostics: string[];
  executionTimeMs: number;
  multiPass?: {
    totalPasses: number;
    totalExecutionTimeMs: number;
    disagreements: Array<{
      aspect: string;
      description: string;
      strategyValues: Record<string, string>;
      severity: "low" | "moderate" | "high";
    }>;
    failures: Array<{ strategyId: string; error: string }>;
  };
  timestamp: string;
}

export interface DecompositionWithProvenance {
  decomposition: DecompositionResult;
  metadata: StrategyMetadata;
}

export type InquiryRoutingInput =
  | DecompositionResult
  | DecompositionWithProvenance;

export interface InquiryRoutingState {
  /** The decomposition result from PDE */
  decomposition: DecompositionResult;

  /** PDE ID for traceability */
  pdeId: string;

  /** Session ID for tracking */
  sessionId: string;

  /** Strategy provenance supplied by an upstream strategic decomposition */
  strategyMetadata: StrategyMetadata | null;

  /** EAST: Generated inquiry batch */
  inquiryBatch: InquiryBatch | null;

  /** SOUTH: Routing decisions for each inquiry */
  routingDecisions: RoutingDecision[] | null;

  /** SOUTH: Batch with routing applied */
  routedBatch: RoutedInquiryBatch | null;

  /** WEST: Relational validation result */
  relationalValidation: RelationalValidationResult | null;

  /** WEST: Whether ceremony is required before dispatch */
  ceremonyRequired: boolean;

  /** NORTH: Dispatched inquiries formatted for their source channels */
  dispatchedInquiries: Inquiry[] | null;

  /** NORTH: Formatted dispatch payloads by source */
  dispatchPayloads: FormattedDispatch[] | null;

  /** Processing status */
  status: "pending" | "generated" | "routed" | "validated" | "dispatched" | "ceremony_hold";

  /** Errors encountered */
  errors: string[];
}

export function createInitialState(
  input: InquiryRoutingInput,
  sessionId?: string,
): InquiryRoutingState {
  const enriched = isDecompositionWithProvenance(input);
  const decomposition = enriched ? input.decomposition : input;

  return {
    decomposition,
    pdeId: decomposition.id,
    sessionId: sessionId ?? uuid(),
    strategyMetadata: enriched ? input.metadata : null,
    inquiryBatch: null,
    routingDecisions: null,
    routedBatch: null,
    relationalValidation: null,
    ceremonyRequired: false,
    dispatchedInquiries: null,
    dispatchPayloads: null,
    status: "pending",
    errors: [],
  };
}

// =============================================================================
// Node Functions
// =============================================================================

/**
 * EAST node: Generate — Produce inquiries from decomposition.
 * "What questions arise from this decomposition?"
 */
export function generateNode(state: InquiryRoutingState): Partial<InquiryRoutingState> {
  try {
    const generator = new InquiryGenerator();
    const generated = generator.generate(state.decomposition);
    const disagreementInquiries = createDisagreementInquiries(state);
    const inquiryBatch =
      disagreementInquiries.length > 0
        ? {
            ...generated,
            west: [...generated.west, ...disagreementInquiries],
            total: generated.total + disagreementInquiries.length,
          }
        : generated;

    return {
      inquiryBatch,
      status: "generated",
    };
  } catch (e) {
    return {
      errors: [...state.errors, `EAST/Generate: ${(e as Error).message}`],
      status: "generated",
    };
  }
}

/**
 * SOUTH node: Route — Classify and route each inquiry to source channels.
 * "Where should each question be directed?"
 */
export function routeNode(state: InquiryRoutingState): Partial<InquiryRoutingState> {
  if (!state.inquiryBatch) {
    return {
      errors: [...state.errors, "SOUTH/Route: No inquiry batch from EAST"],
      status: "routed",
    };
  }

  try {
    const router = new InquiryRouter();
    const routedBatch = router.routeAll(state.inquiryBatch);

    return {
      routingDecisions: routedBatch.decisions,
      routedBatch,
      status: "routed",
    };
  } catch (e) {
    return {
      errors: [...state.errors, `SOUTH/Route: ${(e as Error).message}`],
      status: "routed",
    };
  }
}

/**
 * WEST node: Validate — Relational validation of inquiry batch.
 * "Are these questions relationally grounded?"
 */
export function validateNode(state: InquiryRoutingState): Partial<InquiryRoutingState> {
  const batch = state.routedBatch ?? state.inquiryBatch;
  if (!batch) {
    return {
      errors: [...state.errors, "WEST/Validate: No inquiry batch to validate"],
      status: "validated",
    };
  }

  try {
    // Enrich with relational fields before validation.
    // NOTE (M7): Enrichment is intentionally placed here (during validation, not before routing)
    // because relational markers inform the validation scoring — enrichment must precede
    // the RelationalValidator call, and placing it earlier (between generate and route) would
    // couple the routing stage to enrichment output it does not consume.
    const enricher = new RelationalEnricher();
    const enrichedBatch = enricher.enrichBatch(batch);

    const validator = new RelationalValidator();
    const relationalValidation = validator.validate(enrichedBatch);

    // Merge enriched inquiries back into the routed batch while preserving
    // RoutedInquiryBatch-specific fields (decisions, routing_timestamp).
    const updatedBatch = state.routedBatch
      ? {
          ...state.routedBatch,
          east: enrichedBatch.east,
          south: enrichedBatch.south,
          west: enrichedBatch.west,
          north: enrichedBatch.north,
          total: enrichedBatch.total,
        }
      : null;

    return {
      routedBatch: updatedBatch ?? state.routedBatch,
      relationalValidation,
      ceremonyRequired: relationalValidation.ceremonyRequired,
      status: relationalValidation.ceremonyRequired ? "ceremony_hold" : "validated",
    };
  } catch (e) {
    return {
      errors: [...state.errors, `WEST/Validate: ${(e as Error).message}`],
      status: "validated",
    };
  }
}

/**
 * NORTH node: Dispatch — Format inquiries for their target source channels.
 * "How do these questions become actionable queries?"
 */
export function dispatchNode(state: InquiryRoutingState): Partial<InquiryRoutingState> {
  const batch = state.routedBatch ?? state.inquiryBatch;
  if (!batch) {
    return {
      errors: [...state.errors, "NORTH/Dispatch: No inquiry batch to dispatch"],
      status: "dispatched",
    };
  }

  try {
    const formatter = new DispatchFormatter();
    const allInquiries = [...batch.east, ...batch.south, ...batch.west, ...batch.north];
    const dispatchPayloads: FormattedDispatch[] = [];

    // Format each inquiry for its assigned source channel
    for (const inquiry of allInquiries) {
      const payload = formatter.formatForSource(inquiry);
      dispatchPayloads.push(payload);
    }

    // Mark all inquiries as routed
    const dispatchedInquiries = allInquiries.map((inquiry) => ({
      ...inquiry,
      status: InquiryStatus.ROUTED,
    }));

    return {
      dispatchedInquiries,
      dispatchPayloads,
      status: "dispatched",
    };
  } catch (e) {
    return {
      errors: [...state.errors, `NORTH/Dispatch: ${(e as Error).message}`],
      status: "dispatched",
    };
  }
}

// =============================================================================
// InquiryRoutingGraph (orchestrator)
// =============================================================================

export interface InquiryRoutingGraphOptions {
  /** If true, halt at ceremony_hold instead of continuing to dispatch (default false) */
  enforceCeremony?: boolean;
}

/**
 * InquiryRoutingGraph orchestrates the four directional nodes
 * in sequence: EAST(Generate) → SOUTH(Route) → WEST(Validate) → NORTH(Dispatch).
 *
 * This is a pure-function graph that doesn't require LangGraph runtime,
 * making it usable standalone or as a subgraph.
 */
export class InquiryRoutingGraph {
  private readonly enforceCeremony: boolean;

  constructor(options?: InquiryRoutingGraphOptions) {
    this.enforceCeremony = options?.enforceCeremony ?? false;
  }

  /**
   * Run the full inquiry routing pipeline.
   */
  async invoke(
    decomposition: InquiryRoutingInput,
    sessionId?: string,
  ): Promise<InquiryRoutingState> {
    let state = createInitialState(decomposition, sessionId);

    // EAST: Generate inquiries
    state = this.mergeState(state, generateNode(state));

    // SOUTH: Route inquiries
    state = this.mergeState(state, routeNode(state));

    // WEST: Validate relational integrity
    state = this.mergeState(state, validateNode(state));

    // Check ceremony hold
    if (state.status === "ceremony_hold" && this.enforceCeremony) {
      return state;
    }

    // NORTH: Dispatch
    state = this.mergeState(state, dispatchNode(state));

    return state;
  }

  /**
   * Run individual directions for fine-grained control.
   */
  async invokeGenerate(state: InquiryRoutingState): Promise<InquiryRoutingState> {
    return this.mergeState(state, generateNode(state));
  }

  async invokeRoute(state: InquiryRoutingState): Promise<InquiryRoutingState> {
    return this.mergeState(state, routeNode(state));
  }

  async invokeValidate(state: InquiryRoutingState): Promise<InquiryRoutingState> {
    return this.mergeState(state, validateNode(state));
  }

  async invokeDispatch(state: InquiryRoutingState): Promise<InquiryRoutingState> {
    return this.mergeState(state, dispatchNode(state));
  }

  private mergeState(
    current: InquiryRoutingState,
    updates: Partial<InquiryRoutingState>,
  ): InquiryRoutingState {
    return { ...current, ...updates };
  }
}

function isDecompositionWithProvenance(
  input: InquiryRoutingInput,
): input is DecompositionWithProvenance {
  return (
    "decomposition" in input &&
    "metadata" in input &&
    typeof input.metadata === "object" &&
    input.metadata !== null
  );
}

function createDisagreementInquiries(
  state: InquiryRoutingState,
): Inquiry[] {
  const disagreements = state.strategyMetadata?.multiPass?.disagreements ?? [];

  return disagreements.map((disagreement) => ({
    id: uuid(),
    timestamp: new Date().toISOString(),
    direction: "west",
    source: InquirySource.QMD_LOCAL,
    query: `Validate strategy disagreement "${disagreement.aspect}": ${disagreement.description}`,
    status: InquiryStatus.PENDING,
    relational_context:
      "Cross-strategy disagreement from prompt decomposition provenance.",
    accountability:
      "Resolve or explicitly accept this disagreement before relying on the action plan.",
    pde_id: state.pdeId,
    confidence:
      disagreement.severity === "high"
        ? 0.95
        : disagreement.severity === "moderate"
          ? 0.8
          : 0.65,
  }));
}
