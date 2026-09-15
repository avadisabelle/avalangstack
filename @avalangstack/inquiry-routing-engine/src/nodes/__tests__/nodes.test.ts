import { describe, it, expect } from "vitest";
import { RelationalValidator } from "../relational_validator.js";
import { DispatchFormatter } from "../dispatch_formatter.js";
import type { Inquiry, InquiryBatch } from "ava-langchain-inquiry-routing";
import { v4 as uuid } from "uuid";

// =============================================================================
// Helpers
// =============================================================================

function makeInquiry(overrides: Partial<Inquiry> = {}): Inquiry {
  return {
    id: uuid(),
    timestamp: new Date().toISOString(),
    direction: "east",
    source: "qmd-local",
    query: "What patterns exist in the codebase?",
    status: "pending",
    relational_context: "This inquiry serves the engineering team.",
    accountability: "Accountable to codebase integrity.",
    pde_id: "pde-001",
    confidence: 0.8,
    ...overrides,
  };
}

function makeBatch(inquiries: Partial<Inquiry>[] = []): InquiryBatch {
  const east = inquiries
    .filter((i) => (i.direction ?? "east") === "east")
    .map((i) => makeInquiry({ direction: "east", ...i }));
  const south = inquiries
    .filter((i) => i.direction === "south")
    .map((i) => makeInquiry(i));
  const west = inquiries
    .filter((i) => i.direction === "west")
    .map((i) => makeInquiry(i));
  const north = inquiries
    .filter((i) => i.direction === "north")
    .map((i) => makeInquiry(i));

  return {
    id: uuid(),
    timestamp: new Date().toISOString(),
    pde_id: "pde-001",
    east: east.length > 0 ? east : [makeInquiry({ direction: "east" })],
    south,
    west,
    north,
    total: east.length + south.length + west.length + north.length || 1,
  };
}

// =============================================================================
// RelationalValidator
// =============================================================================

describe("RelationalValidator", () => {
  const validator = new RelationalValidator();

  it("should validate a well-formed batch", () => {
    const batch = makeBatch([
      { direction: "east", relational_context: "Serves the team.", accountability: "To quality." },
    ]);
    const result = validator.validate(batch);

    expect(result.valid).toBe(true);
    expect(result.score).toBeGreaterThan(0);
    expect(result.summary).toContain("PROCEED");
  });

  it("should flag missing relational_context", () => {
    const batch = makeBatch([
      { direction: "east", relational_context: "", accountability: "To quality." },
    ]);
    const result = validator.validate(batch);

    expect(result.flags.length).toBeGreaterThan(0);
    expect(result.flags.some((f) => f.field === "relational_context")).toBe(true);
  });

  it("should flag missing accountability", () => {
    const batch = makeBatch([
      { direction: "east", relational_context: "Serves the team.", accountability: "" },
    ]);
    const result = validator.validate(batch);

    expect(result.flags.some((f) => f.field === "accountability")).toBe(true);
  });

  it("should hold for indigenous content without indigenous_lens", () => {
    const batch = makeBatch([
      {
        direction: "east",
        query: "How do indigenous knowledge systems inform this design?",
        relational_context: "Serves community.",
        accountability: "To elders.",
        indigenous_lens: "",
      },
    ]);
    const result = validator.validate(batch);

    expect(result.ceremonyRequired).toBe(true);
    expect(result.flags.some((f) => f.severity === "hold")).toBe(true);
  });

  it("should accept indigenous content with indigenous_lens", () => {
    const batch = makeBatch([
      {
        direction: "east",
        query: "How do indigenous knowledge systems inform this design?",
        relational_context: "Serves community.",
        accountability: "To elders.",
        indigenous_lens: "Relational epistemology grounded in place-based knowing.",
      },
    ]);
    const result = validator.validate(batch);

    const indigenousHolds = result.flags.filter(
      (f) => f.field === "indigenous_lens" && f.severity === "hold",
    );
    expect(indigenousHolds.length).toBe(0);
  });

  it("should flag WEST inquiries without ceremonial_intent", () => {
    const batch = makeBatch([
      {
        direction: "west",
        query: "Validate the reflection patterns.",
        relational_context: "Serves integrity.",
        accountability: "To process.",
        ceremonial_intent: "",
      },
    ]);
    const result = validator.validate(batch);

    expect(result.flags.some((f) => f.field === "ceremonial_intent")).toBe(true);
  });

  it("should respect custom thresholds", () => {
    const strictValidator = new RelationalValidator({ minScore: 0.99 });
    const batch = makeBatch([
      { direction: "east", relational_context: "OK.", accountability: "" },
    ]);
    const result = strictValidator.validate(batch);
    expect(result.valid).toBe(false);
  });

  it("should calculate score between 0 and 1", () => {
    const batch = makeBatch([
      { direction: "east" },
      { direction: "south", relational_context: "", accountability: "" },
    ]);
    const result = validator.validate(batch);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});

// =============================================================================
// DispatchFormatter
// =============================================================================

describe("DispatchFormatter", () => {
  const formatter = new DispatchFormatter();

  it("should format inquiry for QMD with lex and vec searches", () => {
    const inquiry = makeInquiry({ source: "qmd-local", query: "Short query" });
    const result = formatter.formatForQmd(inquiry);

    expect(result.inquiryId).toBe(inquiry.id);
    expect(result.searches.length).toBeGreaterThanOrEqual(2);
    expect(result.searches.some((s) => s.mode === "lex")).toBe(true);
    expect(result.searches.some((s) => s.mode === "vec")).toBe(true);
  });

  it("should add HyDE search for complex queries", () => {
    const inquiry = makeInquiry({
      source: "qmd-local",
      query: "What are the relational accountability patterns used in indigenous knowledge governance systems?",
    });
    const result = formatter.formatForQmd(inquiry);

    expect(result.searches.some((s) => s.mode === "hyde")).toBe(true);
  });

  it("should format inquiry for deep-search with search terms", () => {
    const inquiry = makeInquiry({
      source: "deep-search-academic",
      direction: "south",
      query: "Two-Eyed Seeing in computational frameworks",
      indigenous_lens: "Etuaptmumk",
      western_lens: "Systems theory",
    });
    const result = formatter.formatForDeepSearch(inquiry);

    expect(result.inquiryId).toBe(inquiry.id);
    expect(result.searchTerms.length).toBeGreaterThan(0);
    expect(result.twoEyedSeeing.indigenous).toBe("Etuaptmumk");
    expect(result.twoEyedSeeing.western).toBe("Systems theory");
  });

  it("should format inquiry for workspace scan with patterns", () => {
    const inquiry = makeInquiry({
      source: "workspace-scan",
      direction: "north",
      query: "Find the InquiryRouter implementation",
    });
    const result = formatter.formatForWorkspaceScan(inquiry);

    expect(result.inquiryId).toBe(inquiry.id);
    expect(result.globPatterns.length).toBeGreaterThan(0);
    expect(result.grepPatterns.length).toBeGreaterThan(0);
  });

  it("should route to correct formatter based on source", () => {
    const qmdInquiry = makeInquiry({ source: "qmd-local" });
    const deepInquiry = makeInquiry({ source: "deep-search-academic" });
    const scanInquiry = makeInquiry({ source: "workspace-scan" });

    const qmdResult = formatter.formatForSource(qmdInquiry);
    const deepResult = formatter.formatForSource(deepInquiry);
    const scanResult = formatter.formatForSource(scanInquiry);

    expect("searches" in qmdResult).toBe(true);
    expect("searchTerms" in deepResult).toBe(true);
    expect("globPatterns" in scanResult).toBe(true);
  });

  it("should include directional labels", () => {
    const inquiry = makeInquiry({ source: "qmd-local", direction: "east" });
    const result = formatter.formatForQmd(inquiry);
    expect(result.directionalLabel).toContain("Waabinong");
  });
});
