/**
 * ava-langgraph-inquiry-routing-engine
 *
 * Graph-level orchestration for the Inquiry Routing pipeline.
 * Built on top of ava-langchain-inquiry-routing primitives,
 * this package provides:
 *
 * - InquiryRoutingGraph: State-based graph running Generate→Route→Validate→Dispatch
 * - RelationalValidator: Relational accountability gating for inquiry batches
 * - DispatchFormatter: Multi-channel formatting (QMD/deep-search/workspace-scan)
 *
 * @example
 * ```typescript
 * import {
 *   InquiryRoutingGraph,
 *   RelationalValidator,
 *   DispatchFormatter,
 * } from "ava-langgraph-inquiry-routing-engine";
 *
 * const graph = new InquiryRoutingGraph();
 * const validator = new RelationalValidator();
 * const formatter = new DispatchFormatter();
 *
 * // Run the full pipeline with a DecompositionResult
 * const state = await graph.invoke(decomposition);
 *
 * // Check relational validation
 * if (state.relationalValidation) {
 *   console.log("Relational score:", state.relationalValidation.score);
 *   if (state.relationalValidation.ceremonyRequired) {
 *     console.log("Ceremony needed:", state.relationalValidation.flags);
 *   }
 * }
 *
 * // Access dispatch payloads
 * if (state.dispatchPayloads) {
 *   for (const payload of state.dispatchPayloads) {
 *     console.log("Dispatch:", payload);
 *   }
 * }
 * ```
 */

export const VERSION = "0.1.3";

// Graphs
export {
  StrategyMetadata,
  DecompositionWithProvenance,
  InquiryRoutingInput,
  InquiryRoutingState,
  createInitialState,
  generateNode,
  routeNode,
  validateNode,
  dispatchNode,
  InquiryRoutingGraphOptions,
  InquiryRoutingGraph,
  StateGraphFactoryOptions,
  createInquiryRoutingStateGraph,
} from "./graphs/index.js";

// Nodes
export {
  RelationalFlag,
  RelationalValidationResult,
  RelationalValidatorOptions,
  RelationalValidator,
  QmdSearchQuery,
  QmdDispatch,
  DeepSearchDispatch,
  WorkspaceScanDispatch,
  FormattedDispatch,
  DispatchFormatter,
} from "./nodes/index.js";

// Re-export core primitives from ava-langchain-inquiry-routing
export {
  InquirySource,
  InquiryStatus,
  InquiryGenerator,
  InquiryRouter,
  InquiryFormatter,
  RelationalEnricher,
  type Inquiry,
  type InquiryBatch,
  type InquiryRoutingConfig,
  type RoutingDecision,
  type RoutedInquiryBatch,
  type InquiryGeneratorOptions,
  type RelationalEnricherOptions,
  type QmdQuery,
  type DeepSearchQuery,
} from "ava-langchain-inquiry-routing";

// Re-export DecompositionResult from PDE for convenience
export {
  type DecompositionResult,
  type DirectionalAnalysis,
} from "ava-langchain-prompt-decomposition";

// =============================================================================
// Inline type definitions for DTS safety
// =============================================================================

/** Stored inquiry routing session (parallel to StoredDecomposition in PDE engine) */
export interface StoredInquiryRoutingSession {
  id: string;
  timestamp: string;
  pdeId: string;
  decomposition: import("ava-langchain-prompt-decomposition").DecompositionResult;
  inquiryBatch: import("ava-langchain-inquiry-routing").InquiryBatch;
  routingDecisions: import("ava-langchain-inquiry-routing").RoutingDecision[];
}
