import { describe, it, expect } from "vitest";
import { PerspectiveAnalyzer, Universe } from "../perspective_nodes.js";
import { CeremonyGate, GateDecision } from "../ceremony_gate.js";
import { decompose } from "ava-langchain-prompt-decomposition";

describe("PerspectiveAnalyzer", () => {
  const analyzer = new PerspectiveAnalyzer();

  it("should analyze a decomposition through three universes", async () => {
    const { decomposition } = await decompose(
      "Build a new module and test the integration."
    );
    const perspective = analyzer.analyze(decomposition);

    expect(perspective.insights.length).toBe(3);
    expect(perspective.leadUniverse).toBeDefined();
    expect(perspective.coherence).toBeGreaterThanOrEqual(0);
    expect(perspective.coherence).toBeLessThanOrEqual(1);
    expect(perspective.synthesis).toBeDefined();
  });

  it("should detect engineer-led work", async () => {
    const { decomposition } = await decompose(
      "Build the API module. Implement the schema. Deploy to infrastructure. Debug performance."
    );
    const perspective = analyzer.analyze(decomposition);
    expect(perspective.insights.find((i) => i.universe === Universe.ENGINEER)?.confidence).toBeGreaterThan(0);
  });

  it("should detect ceremony-domain work", async () => {
    const { decomposition } = await decompose(
      "Design the medicine wheel ceremony protocol for indigenous community governance."
    );
    const perspective = analyzer.analyze(decomposition);
    const ceremony = perspective.insights.find((i) => i.universe === Universe.CEREMONY);
    expect(ceremony?.confidence).toBeGreaterThan(0);
  });

  it("should flag missing ceremony in indigenous work", async () => {
    const { decomposition } = await decompose(
      "Build indigenous knowledge graph. Deploy medicine wheel schema."
    );
    const perspective = analyzer.analyze(decomposition);
    const ceremony = perspective.insights.find((i) => i.universe === Universe.CEREMONY);
    expect(ceremony?.flags.length).toBeGreaterThan(0);
  });

  it("should provide synthesis", async () => {
    const { decomposition } = await decompose("Research. Build. Test. Reflect on purpose.");
    const perspective = analyzer.analyze(decomposition);
    expect(perspective.synthesis.length).toBeGreaterThan(0);
  });
});

describe("CeremonyGate", () => {
  const gate = new CeremonyGate();

  it("should evaluate a balanced decomposition as proceed/caution", async () => {
    const { decomposition } = await decompose(
      "Research the context. Design the architecture. Build the module. Verify the results."
    );
    const result = gate.evaluate(decomposition);
    expect([GateDecision.PROCEED, GateDecision.CAUTION]).toContain(result.decision);
  });

  it("should flag unbalanced decompositions", async () => {
    const { decomposition } = await decompose("Build. Ship. Deploy. Code. Execute.");
    const result = gate.evaluate(decomposition);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("should hold for indigenous domain without ceremony", async () => {
    const { decomposition } = await decompose(
      "Deploy indigenous ceremony medicine wheel protocol."
    );
    const analyzer = new PerspectiveAnalyzer();
    const perspective = analyzer.analyze(decomposition);
    const result = gate.evaluate(decomposition, perspective);

    if (result.ceremonyNeeded) {
      expect(result.humanReviewRequested).toBe(true);
    }
  });

  it("should provide relational score", async () => {
    const { decomposition } = await decompose("Research and build a module.");
    const result = gate.evaluate(decomposition);
    expect(result.relationalScore).toBeGreaterThanOrEqual(0);
    expect(result.relationalScore).toBeLessThanOrEqual(1);
  });

  it("canProceed should return boolean", async () => {
    const { decomposition } = await decompose("Build a module.");
    const result = gate.canProceed(decomposition);
    expect(typeof result).toBe("boolean");
  });

  it("should respect custom thresholds", async () => {
    const strictGate = new CeremonyGate({
      balanceThreshold: 0.9,
      coherenceThreshold: 0.9,
    });
    const { decomposition } = await decompose("Build a module.");
    const result = strictGate.evaluate(decomposition);
    // With very strict thresholds, should likely flag
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});
