import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  NarrativeEventType,
  EVENT_GLYPHS,
  createNarrativeSpan,
  createTraceCorrelation,
  addChildTrace,
  createNarrativeMetrics,
  calculateOverallQuality,
  isThreePerspectiveAnalysisEvent,
  getSpanLeadPerspective,
  getCrossPerspectiveCoherence,
  normalizePerspectiveValue,
} from "../event_types.js";

describe("NarrativeEventType", () => {
  it("should have all expected event types", () => {
    expect(NarrativeEventType.BEAT_CREATED).toBe("narrative.beat.created");
    expect(NarrativeEventType.BEAT_ANALYZED).toBe("narrative.beat.analyzed");
    expect(NarrativeEventType.BEAT_ENRICHED).toBe("narrative.beat.enriched");
    expect(NarrativeEventType.STORY_GENERATION_START).toBe(
      "narrative.story.generation_start"
    );
    expect(NarrativeEventType.THREE_PERSPECTIVE_ANALYSIS).toBe(
      "narrative.three_perspective.analysis"
    );
    expect(NarrativeEventType.PERSPECTIVE_SHIFT).toBe(
      "narrative.three_perspective.shift"
    );
    expect(NarrativeEventType.ROUTING_DECISION).toBe(
      "narrative.routing.decision"
    );
  });

  it("should have glyphs for all event types", () => {
    const eventTypes = Object.values(NarrativeEventType);
    for (const eventType of eventTypes) {
      expect(EVENT_GLYPHS[eventType]).toBeDefined();
      expect(typeof EVENT_GLYPHS[eventType]).toBe("string");
    }
  });

  it("should have meaningful glyphs", () => {
    expect(EVENT_GLYPHS[NarrativeEventType.BEAT_CREATED]).toBe("📝");
    expect(EVENT_GLYPHS[NarrativeEventType.THREE_PERSPECTIVE_ANALYSIS]).toBe("🌌");
    expect(EVENT_GLYPHS[NarrativeEventType.ROUTING_DECISION]).toBe("🚀");
    expect(EVENT_GLYPHS[NarrativeEventType.GAP_REMEDIATED]).toBe("🔧");
  });
});

describe("createNarrativeSpan", () => {
  it("should create a span with required fields", () => {
    const span = createNarrativeSpan({
      spanId: "span_123",
      traceId: "trace_456",
      eventType: NarrativeEventType.BEAT_CREATED,
      storyId: "story_789",
      sessionId: "session_abc",
    });

    expect(span.spanId).toBe("span_123");
    expect(span.traceId).toBe("trace_456");
    expect(span.eventType).toBe(NarrativeEventType.BEAT_CREATED);
    expect(span.storyId).toBe("story_789");
    expect(span.sessionId).toBe("session_abc");
    expect(span.characterIds).toEqual([]);
    expect(span.success).toBe(true);
    expect(span.startTime).toBeDefined();
  });

  it("should allow overriding defaults", () => {
    const span = createNarrativeSpan({
      spanId: "span_123",
      traceId: "trace_456",
      eventType: NarrativeEventType.BEAT_ANALYZED,
      storyId: "story_789",
      sessionId: "session_abc",
      characterIds: ["char_1", "char_2"],
      emotionalTone: "wonder",
      success: false,
    });

    expect(span.characterIds).toEqual(["char_1", "char_2"]);
    expect(span.emotionalTone).toBe("wonder");
    expect(span.success).toBe(false);
  });
});

describe("TraceCorrelation", () => {
  it("should create correlation with initial values", () => {
    const correlation = createTraceCorrelation(
      "trace_123",
      "story_456",
      "session_789"
    );

    expect(correlation.rootTraceId).toBe("trace_123");
    expect(correlation.storyId).toBe("story_456");
    expect(correlation.sessionId).toBe("session_789");
    expect(correlation.correlationPath).toEqual(["langchain"]);
    expect(correlation.childTraceIds.size).toBe(0);
  });

  it("should add child traces correctly", () => {
    const correlation = createTraceCorrelation(
      "trace_123",
      "story_456",
      "session_789"
    );

    addChildTrace(correlation, "child_trace_1", "flowise");
    addChildTrace(correlation, "child_trace_2", "langflow");
    addChildTrace(correlation, "child_trace_3", "flowise"); // Same system

    expect(correlation.childTraceIds.size).toBe(3);
    expect(correlation.childTraceIds.get("child_trace_1")).toBe("flowise");
    expect(correlation.childTraceIds.get("child_trace_2")).toBe("langflow");

    // Should not duplicate systems in path
    expect(correlation.correlationPath).toEqual([
      "langchain",
      "flowise",
      "langflow",
    ]);
  });
});

describe("NarrativeMetrics", () => {
  it("should create empty metrics with defaults", () => {
    const metrics = createNarrativeMetrics();

    expect(metrics.beatsGenerated).toBe(0);
    expect(metrics.enrichmentsApplied).toBe(0);
    expect(metrics.coherenceScore).toBe(0.5);
    expect(metrics.emotionalArcStrength).toBe(0.5);
    expect(metrics.themeClarity).toBe(0.5);
    expect(metrics.crossPerspectiveCoherence).toBe(0.5);
    expect(metrics.characterArcCompletion).toEqual({});
  });

  it("should calculate overall quality correctly", () => {
    const metrics = createNarrativeMetrics();
    metrics.coherenceScore = 0.8;
    metrics.emotionalArcStrength = 0.7;
    metrics.themeClarity = 0.6;
    metrics.crossPerspectiveCoherence = 0.9;
    metrics.characterArcCompletion = {
      char_1: 0.8,
      char_2: 0.6,
    };

    const quality = calculateOverallQuality(metrics);

    // Weighted calculation:
    // 0.8 * 0.25 + 0.7 * 0.2 + 0.6 * 0.15 + 0.9 * 0.2 + 0.7 * 0.2 = 0.75
    expect(quality).toBeCloseTo(0.75, 2);
  });

  it("should handle empty character arcs", () => {
    const metrics = createNarrativeMetrics();
    metrics.coherenceScore = 1.0;
    metrics.emotionalArcStrength = 1.0;
    metrics.themeClarity = 1.0;
    metrics.crossPerspectiveCoherence = 1.0;

    const quality = calculateOverallQuality(metrics);

    // With empty character arcs, uses 0.5 default
    // 1.0 * 0.25 + 1.0 * 0.2 + 1.0 * 0.15 + 1.0 * 0.2 + 0.5 * 0.2 = 0.9
    expect(quality).toBeCloseTo(0.9, 2);
  });
});

describe("Event type coverage", () => {
  it("should have glyphs for beat events", () => {
    expect(EVENT_GLYPHS[NarrativeEventType.BEAT_CREATED]).toBeDefined();
    expect(EVENT_GLYPHS[NarrativeEventType.BEAT_ANALYZED]).toBeDefined();
    expect(EVENT_GLYPHS[NarrativeEventType.BEAT_ENRICHED]).toBeDefined();
  });

  it("should have glyphs for story events", () => {
    expect(EVENT_GLYPHS[NarrativeEventType.STORY_GENERATION_START]).toBeDefined();
    expect(EVENT_GLYPHS[NarrativeEventType.STORY_GENERATION_END]).toBeDefined();
    expect(EVENT_GLYPHS[NarrativeEventType.STORY_QUALITY_METRICS]).toBeDefined();
  });

  it("should have glyphs for three-perspective events", () => {
    expect(EVENT_GLYPHS[NarrativeEventType.THREE_PERSPECTIVE_ANALYSIS]).toBeDefined();
    expect(EVENT_GLYPHS[NarrativeEventType.PERSPECTIVE_SHIFT]).toBeDefined();
  });

  it("should have glyphs for character events", () => {
    expect(EVENT_GLYPHS[NarrativeEventType.CHARACTER_ARC_UPDATED]).toBeDefined();
    expect(EVENT_GLYPHS[NarrativeEventType.CHARACTER_RELATIONSHIP_CHANGED]).toBeDefined();
  });

  it("should have glyphs for routing events", () => {
    expect(EVENT_GLYPHS[NarrativeEventType.ROUTING_DECISION]).toBeDefined();
    expect(EVENT_GLYPHS[NarrativeEventType.FLOW_EXECUTED]).toBeDefined();
  });

  it("should have glyphs for gap events", () => {
    expect(EVENT_GLYPHS[NarrativeEventType.GAP_IDENTIFIED]).toBeDefined();
    expect(EVENT_GLYPHS[NarrativeEventType.GAP_REMEDIATED]).toBeDefined();
  });
});

describe("Legacy perspective names on stored spans and metrics", () => {
  it("keeps the legacy event-type values for readers", () => {
    expect(NarrativeEventType.THREE_UNIVERSE_ANALYSIS).toBe(
      "narrative.three_universe.analysis"
    );
    expect(EVENT_GLYPHS[NarrativeEventType.THREE_UNIVERSE_ANALYSIS]).toBe("🌌");
    expect(EVENT_GLYPHS[NarrativeEventType.UNIVERSE_PERSPECTIVE_SHIFT]).toBeDefined();
  });

  it("treats the current and legacy analysis values as one kind", () => {
    expect(
      isThreePerspectiveAnalysisEvent("narrative.three_perspective.analysis")
    ).toBe(true);
    expect(
      isThreePerspectiveAnalysisEvent("narrative.three_universe.analysis")
    ).toBe(true);
    expect(isThreePerspectiveAnalysisEvent("narrative.beat.created")).toBe(false);
  });

  it("reads the lead from leadPerspective or the legacy leadUniverse key", () => {
    const base = {
      spanId: "s",
      traceId: "t",
      eventType: NarrativeEventType.BEAT_CREATED,
      storyId: "story",
      sessionId: "session",
    };
    expect(
      getSpanLeadPerspective(createNarrativeSpan({ ...base, leadPerspective: "ceremony" }))
    ).toBe("ceremony");
    expect(
      getSpanLeadPerspective({
        ...createNarrativeSpan(base),
        leadUniverse: "engineer",
      })
    ).toBe("engineer");
  });

  it("writes leadPerspective when a span is created from the legacy key", () => {
    const span = createNarrativeSpan({
      spanId: "s",
      traceId: "t",
      eventType: NarrativeEventType.BEAT_CREATED,
      storyId: "story",
      sessionId: "session",
      leadUniverse: "story_engine",
    });
    expect(span.leadPerspective).toBe("story_engine");
    expect("leadUniverse" in span).toBe(false);
  });

  it("maps legacy -world values to the bare values", () => {
    expect(normalizePerspectiveValue("engineer-world")).toBe("engineer");
    expect(normalizePerspectiveValue("ceremony-world")).toBe("ceremony");
    expect(normalizePerspectiveValue("story-engine-world")).toBe("story_engine");
    expect(normalizePerspectiveValue("story_engine")).toBe("story_engine");
  });

  it("reads cross-perspective coherence from the legacy metrics key", () => {
    const { crossPerspectiveCoherence: _dropped, ...rest } = createNarrativeMetrics();
    const legacy = { ...rest, crossUniverseCoherence: 0.9 } as unknown as ReturnType<
      typeof createNarrativeMetrics
    >;
    expect(getCrossPerspectiveCoherence(legacy)).toBe(0.9);
  });
});
