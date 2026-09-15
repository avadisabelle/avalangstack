import { describe, it, expect } from "vitest";
import { decompose } from "ava-langchain-prompt-decomposition";
import { createInquiryRoutingStateGraph } from "../../graphs/state_graph_factory.js";

describe("createInquiryRoutingStateGraph (@langchain/langgraph)", () => {
  it("compiles and runs generate → route → validate → dispatch", async () => {
    const { decomposition } = await decompose(
      "Research the existing patterns. Design the data model. Build the API. Verify correctness.",
    );
    const graph = await createInquiryRoutingStateGraph();
    const result = await graph.compile().invoke({
      decomposition,
      pdeId: decomposition.id,
      sessionId: "factory-test",
    });

    expect(result.inquiryBatch.total).toBeGreaterThan(0);
    expect(result.dispatchedInquiries.length).toBeGreaterThan(0);
    expect(result.status).toBe("dispatched");
    expect(result.errors).toEqual([]);
  });
});
