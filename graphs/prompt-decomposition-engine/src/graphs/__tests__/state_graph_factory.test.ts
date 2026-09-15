import { describe, it, expect } from "vitest";
import { createDecompositionStateGraph } from "../../graphs/state_graph_factory.js";

describe("createDecompositionStateGraph (@langchain/langgraph)", () => {
  it("compiles and runs EAST → SOUTH → WEST → NORTH", async () => {
    const graph = await createDecompositionStateGraph();
    const result = await graph.compile().invoke({
      prompt:
        "Research the existing patterns. Design the data model. Build the API. Verify correctness.",
      sessionId: "factory-test",
    });

    expect(result.directionalAnalysis).toBeTruthy();
    expect(result.intentResult).toBeTruthy();
    expect(result.decomposition).toBeTruthy();
    expect(result.status).toBe("complete");
    expect(result.errors).toEqual([]);
  });
});
