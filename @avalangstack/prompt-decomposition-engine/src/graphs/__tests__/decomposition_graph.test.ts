import { describe, it, expect, vi } from "vitest";
import {
  DecompositionGraph,
  createInitialState,
  eastNode,
  southNode,
  westNode,
  northNode,
} from "../../graphs/decomposition_graph.js";

vi.mock("ava-langchain-prompt-decomposition", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("ava-langchain-prompt-decomposition")
  >();

  return {
    ...actual,
    strategicDecompose: async (
      prompt: string,
      options?: { preferences?: { alwaysMultiPass?: boolean } }
    ) => {
      const directionalAnalysis = new actual.DirectionalDecomposer().decompose(prompt);
      const intents = await new actual.IntentExtractor().extract(prompt);
      const mapper = new actual.DependencyMapper();
      const dependencyGraph = mapper.buildGraph(intents.secondary);
      const executionOrder = mapper.computeExecutionOrder(dependencyGraph);
      const decomposition = new actual.ActionStackBuilder().build(
        directionalAnalysis,
        intents,
        executionOrder
      );
      const wheelEnriched = new actual.MedicineWheelBridge().enrich(
        directionalAnalysis
      );
      const strategyResult = {
        strategyId: "keyword",
        directionalAnalysis,
        intents,
        decomposition,
        wheelEnriched,
        confidence: 0.82,
        directionConfidence: {
          east: 0.8,
          south: 0.75,
          west: 0.7,
          north: 0.85,
        },
        executionTimeMs: 4,
        diagnostics: ["Calibrated: test fixture"],
      };

      return {
        result: strategyResult,
        selectionReason: "Selected keyword strategy for deterministic execution",
        signals: {
          wordCount: prompt.split(/\s+/).length,
          clauseCount: 2,
          conditionalCount: 0,
          hedgingCount: 0,
          actionVerbCount: 3,
          directionalSpread: 3,
          hasTechnicalReferences: false,
          hasNestedStructure: false,
          complexity: "moderate",
        },
        multiPass: options?.preferences?.alwaysMultiPass
          ? {
              best: strategyResult,
              allResults: [strategyResult, { ...strategyResult, strategyId: "hybrid" }],
              failures: [],
              signals: {},
              disagreements: [
                {
                  aspect: "lead_direction",
                  description: "Strategies selected different lead directions",
                  strategyValues: { keyword: "north", hybrid: "west" },
                  severity: "moderate",
                },
              ],
              totalExecutionTimeMs: 8,
            }
          : undefined,
      };
    },
    extractStrategyMetadata: (strategic: {
      result: {
        strategyId: string;
        decomposition: { timestamp: string };
        confidence: number;
        directionConfidence: Record<string, number>;
        diagnostics: string[];
        executionTimeMs: number;
      };
      selectionReason: string;
      signals: Record<string, unknown> & { complexity: string };
      multiPass?: {
        allResults: unknown[];
        disagreements: unknown[];
        failures: unknown[];
        totalExecutionTimeMs: number;
      };
    }) => ({
      schemaVersion: 1,
      strategyId: strategic.result.strategyId,
      selectionReason: strategic.selectionReason,
      complexity: {
        level: strategic.signals.complexity,
        wordCount: strategic.signals.wordCount,
        clauseCount: strategic.signals.clauseCount,
        conditionalCount: strategic.signals.conditionalCount,
        hedgingCount: strategic.signals.hedgingCount,
        actionVerbCount: strategic.signals.actionVerbCount,
        directionalSpread: strategic.signals.directionalSpread,
        hasTechnicalReferences: strategic.signals.hasTechnicalReferences,
        hasNestedStructure: strategic.signals.hasNestedStructure,
      },
      confidence: {
        overall: strategic.result.confidence,
        perDirection: strategic.result.directionConfidence,
      },
      diagnostics: strategic.result.diagnostics,
      executionTimeMs: strategic.result.executionTimeMs,
      multiPass: strategic.multiPass
        ? {
            totalPasses: strategic.multiPass.allResults.length,
            totalExecutionTimeMs: strategic.multiPass.totalExecutionTimeMs,
            disagreements: strategic.multiPass.disagreements,
            failures: strategic.multiPass.failures,
          }
        : undefined,
      timestamp: strategic.result.decomposition.timestamp,
    }),
  };
});

describe("DecompositionGraph", () => {
  describe("individual nodes", () => {
    it("eastNode should extract intents and directions", async () => {
      const state = createInitialState("Research the codebase and build a new module.");
      const result = await eastNode(state);

      expect(result.directionalAnalysis).toBeDefined();
      expect(result.intentResult).toBeDefined();
      expect(result.status).toBe("east_complete");
    });

    it("southNode should build dependency graph", async () => {
      let state = createInitialState("Investigate patterns. Create implementation. Test results.");
      state = { ...state, ...await eastNode(state) };
      const result = southNode(state);

      expect(result.dependencyGraph).toBeDefined();
      expect(result.executionOrder).toBeDefined();
      expect(result.status).toBe("south_complete");
    });

    it("southNode should handle missing EAST gracefully", () => {
      const state = createInitialState("test");
      const result = southNode(state);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it("westNode should assess ceremony requirements", async () => {
      let state = createInitialState("Build code and deploy immediately.");
      state = { ...state, ...await eastNode(state) };
      const result = westNode(state);

      expect(result.wheelEnriched).toBeDefined();
      expect(result.relationalGuidance).toBeDefined();
      expect(typeof result.ceremonyRequired).toBe("boolean");
    });

    it("northNode should build action stack", async () => {
      let state = createInitialState("Research. Build. Test.");
      state = { ...state, ...await eastNode(state) };
      state = { ...state, ...southNode(state) };
      const result = northNode(state);

      expect(result.decomposition).toBeDefined();
      expect(result.status).toBe("complete");
    });
  });

  describe("full pipeline", () => {
    it("should run the complete pipeline", async () => {
      const graph = new DecompositionGraph();
      const state = await graph.invoke(
        "Investigate the existing codebase. Design the architecture. Build the implementation. Test everything."
      );

      expect(state.status).toBe("complete");
      expect(state.directionalAnalysis).toBeDefined();
      expect(state.intentResult).toBeDefined();
      expect(state.decomposition).toBeDefined();
      expect(state.decomposition!.actionStack.length).toBeGreaterThan(0);
      expect(state.strategyMetadata).toBeNull();
      expect(state.decompositionWithProvenance).toBeNull();
    });

    it("should detect ceremony requirements", async () => {
      const graph = new DecompositionGraph();
      const state = await graph.invoke(
        "Build code. Deploy code. Ship it. Execute now."
      );

      // Should have relational guidance
      expect(state.relationalGuidance).toBeDefined();
    });

    it("should halt at ceremony when enforced", async () => {
      const graph = new DecompositionGraph({ enforceCeremony: true });
      const state = await graph.invoke(
        "Build code. Ship immediately. Deploy now. Execute."
      );

      // If ceremony is required, should be in ceremony_hold
      if (state.ceremonyRequired) {
        expect(state.status).toBe("ceremony_hold");
        expect(state.decomposition).toBeNull();
      }
    });

    it("should still accept the legacy enforeCeremony option", async () => {
      const graph = new DecompositionGraph({ enforeCeremony: true });
      const state = await graph.invoke(
        "Build code. Ship immediately. Deploy now. Execute."
      );

      if (state.ceremonyRequired) {
        expect(state.status).toBe("ceremony_hold");
      }
    });

    it("should produce results with session ID", async () => {
      const graph = new DecompositionGraph();
      const state = await graph.invoke("Research and build.", "session-123");
      expect(state.sessionId).toBe("session-123");
    });

    it("should expose strategic provenance for downstream engines", async () => {
      const graph = new DecompositionGraph({
        strategy: {
          enabled: true,
          preferences: { alwaysMultiPass: true },
        },
      });
      const state = await graph.invoke(
        "Research the architecture, build the module, and validate the result."
      );

      expect(state.status).toBe("complete");
      expect(state.decomposition).toBeDefined();
      expect(state.strategyMetadata).toEqual(
        expect.objectContaining({
          schemaVersion: 1,
          strategyId: "keyword",
          selectionReason: expect.any(String),
        })
      );
      expect(state.strategyMetadata?.multiPass?.disagreements).toHaveLength(1);
      expect(state.decompositionWithProvenance).toEqual({
        decomposition: state.decomposition,
        metadata: state.strategyMetadata,
        wheelEnriched: state.wheelEnriched,
      });
    });
  });
});
