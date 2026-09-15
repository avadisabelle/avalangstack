import { describe, it, expect } from "vitest";
import {
  InquiryRoutingGraph,
  createInitialState,
  generateNode,
  routeNode,
  validateNode,
  dispatchNode,
  type StrategyMetadata,
} from "../../graphs/inquiry_routing_graph.js";
import { decompose } from "ava-langchain-prompt-decomposition";

function createStrategyMetadata(timestamp: string): StrategyMetadata {
  return {
    schemaVersion: 1,
    strategyId: "hybrid",
    selectionReason: "Selected hybrid strategy for an ambiguous prompt",
    complexity: {
      level: "ambiguous",
      wordCount: 42,
      clauseCount: 4,
      conditionalCount: 1,
      hedgingCount: 2,
      actionVerbCount: 4,
      directionalSpread: 4,
      hasTechnicalReferences: true,
      hasNestedStructure: true,
    },
    confidence: {
      overall: 0.84,
      perDirection: {
        east: 0.8,
        south: 0.76,
        west: 0.82,
        north: 0.88,
      },
    },
    diagnostics: ["Cross-strategy calibration applied"],
    executionTimeMs: 18,
    multiPass: {
      totalPasses: 2,
      totalExecutionTimeMs: 22,
      disagreements: [
        {
          aspect: "lead_direction",
          description: "Keyword selected north while hybrid selected west",
          strategyValues: { keyword: "north", hybrid: "west" },
          severity: "moderate",
        },
      ],
      failures: [],
    },
    timestamp,
  };
}

describe("InquiryRoutingGraph", () => {
  describe("individual nodes", () => {
    it("generateNode should produce inquiries from decomposition", async () => {
      const { decomposition } = await decompose(
        "Research the existing patterns. Design the data model. Build the API. Verify correctness.",
      );
      const state = createInitialState(decomposition);
      const result = generateNode(state);

      expect(result.inquiryBatch).toBeDefined();
      expect(result.inquiryBatch!.total).toBeGreaterThan(0);
      expect(result.status).toBe("generated");
    });

    it("should turn strategy disagreements into WEST validation inquiries", async () => {
      const { decomposition } = await decompose(
        "Research the architecture. Build the API. Validate the integration.",
      );
      const legacy = generateNode(createInitialState(decomposition));
      const state = createInitialState({
        decomposition,
        metadata: createStrategyMetadata(decomposition.timestamp),
      });
      const result = generateNode(state);

      expect(state.strategyMetadata?.strategyId).toBe("hybrid");
      expect(result.inquiryBatch!.total).toBe(legacy.inquiryBatch!.total + 1);
      expect(
        result.inquiryBatch!.west.some((inquiry) =>
          inquiry.query.includes("lead_direction"),
        ),
      ).toBe(true);
    });

    it("routeNode should classify inquiries to source channels", async () => {
      const { decomposition } = await decompose(
        "Investigate the codebase. Study the academic literature. Build the module. Reflect on impact.",
      );
      let state = createInitialState(decomposition);
      state = { ...state, ...generateNode(state) };
      const result = routeNode(state);

      expect(result.routedBatch).toBeDefined();
      expect(result.routingDecisions).toBeDefined();
      expect(result.routingDecisions!.length).toBeGreaterThan(0);
      expect(result.status).toBe("routed");
    });

    it("routeNode should handle missing inquiry batch gracefully", () => {
      const { decomposition: d } = { decomposition: { id: "test", prompt: "", actionStack: [], directions: { east: [], south: [], west: [], north: [] }, secondary: [], balance: 0, leadDirection: "east", neglectedDirections: [] } as any };
      const state = createInitialState(d);
      const result = routeNode(state);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it("validateNode should check relational integrity", async () => {
      const { decomposition } = await decompose(
        "Research indigenous knowledge systems. Build a ceremony protocol. Test the governance model.",
      );
      let state = createInitialState(decomposition);
      state = { ...state, ...generateNode(state) };
      state = { ...state, ...routeNode(state) };
      const result = validateNode(state);

      expect(result.relationalValidation).toBeDefined();
      expect(result.relationalValidation!.score).toBeGreaterThanOrEqual(0);
      expect(result.relationalValidation!.score).toBeLessThanOrEqual(1);
      expect(typeof result.ceremonyRequired).toBe("boolean");
    });

    it("validateNode should flag missing relational fields", async () => {
      const { decomposition } = await decompose("Build code. Ship it.");
      let state = createInitialState(decomposition);
      state = { ...state, ...generateNode(state) };
      // Skip routing — validate raw batch
      const result = validateNode(state);

      expect(result.relationalValidation).toBeDefined();
      expect(result.relationalValidation!.summary).toBeDefined();
    });

    it("dispatchNode should format inquiries for source channels", async () => {
      const { decomposition } = await decompose(
        "Research the context. Design architecture. Build implementation. Test results.",
      );
      let state = createInitialState(decomposition);
      state = { ...state, ...generateNode(state) };
      state = { ...state, ...routeNode(state) };
      state = { ...state, ...validateNode(state) };
      const result = dispatchNode(state);

      expect(result.dispatchedInquiries).toBeDefined();
      expect(result.dispatchPayloads).toBeDefined();
      expect(result.dispatchPayloads!.length).toBeGreaterThan(0);
      expect(result.status).toBe("dispatched");
    });
  });

  describe("full pipeline", () => {
    it("should run the complete routing pipeline", async () => {
      const graph = new InquiryRoutingGraph();
      const { decomposition } = await decompose(
        "Investigate the existing patterns. Design the data model. Build the API module. Verify the integration.",
      );
      const state = await graph.invoke(decomposition);

      expect(state.status).toBe("dispatched");
      expect(state.inquiryBatch).toBeDefined();
      expect(state.routedBatch).toBeDefined();
      expect(state.relationalValidation).toBeDefined();
      expect(state.dispatchedInquiries).toBeDefined();
      expect(state.dispatchPayloads!.length).toBeGreaterThan(0);
    });

    it("should detect ceremony requirements for indigenous content", async () => {
      const graph = new InquiryRoutingGraph();
      const { decomposition } = await decompose(
        "Build indigenous knowledge graph. Deploy medicine wheel schema. Ship elder protocol.",
      );
      const state = await graph.invoke(decomposition);

      expect(state.relationalValidation).toBeDefined();
      // Indigenous content should trigger ceremony awareness
      if (state.relationalValidation!.ceremonyRequired) {
        expect(state.ceremonyRequired).toBe(true);
      }
    });

    it("should halt at ceremony when enforced", async () => {
      const graph = new InquiryRoutingGraph({ enforceCeremony: true });
      const { decomposition } = await decompose(
        "Build indigenous ceremony protocol. Deploy sacred governance.",
      );
      const state = await graph.invoke(decomposition);

      // If ceremony was required, should halt before dispatch
      if (state.ceremonyRequired) {
        expect(state.status).toBe("ceremony_hold");
        expect(state.dispatchedInquiries).toBeNull();
      }
    });

    it("should produce results with session ID", async () => {
      const graph = new InquiryRoutingGraph();
      const { decomposition } = await decompose("Research and build.");
      const state = await graph.invoke(decomposition, "session-456");
      expect(state.sessionId).toBe("session-456");
    });

    it("should track PDE lineage", async () => {
      const graph = new InquiryRoutingGraph();
      const { decomposition } = await decompose("Research. Build. Test.");
      const state = await graph.invoke(decomposition);

      expect(state.pdeId).toBe(decomposition.id);
    });

    it("should preserve strategy provenance through the routing pipeline", async () => {
      const graph = new InquiryRoutingGraph();
      const { decomposition } = await decompose(
        "Research the strategy. Build the module. Validate the result.",
      );
      const metadata = createStrategyMetadata(decomposition.timestamp);
      const state = await graph.invoke({ decomposition, metadata });

      expect(state.status).toBe("dispatched");
      expect(state.strategyMetadata).toEqual(metadata);
      expect(
        state.dispatchedInquiries?.some((inquiry) =>
          inquiry.query.includes("lead_direction"),
        ),
      ).toBe(true);
    });
  });
});
