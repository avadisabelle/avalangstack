/**
 * Tests for coherence_engine.ts
 */

import { describe, it, expect } from "vitest";
import {
  GapType,
  GapSeverity,
  RoutingTarget,
  NarrativeCoherenceEngine,
  createGap,
  createComponentScore,
  createCoherenceScore,
  createTrinityAssessment,
} from "../graphs/coherence_engine.js";
import {
  NarrativeFunction,
  createStoryBeat,
  createCharacterState,
  createThematicThread,
  Universe,
} from "../schemas/unified_state_bridge.js";

describe("Enums", () => {
  it("GapType should have all types", () => {
    expect(GapType.STRUCTURAL).toBe("structural");
    expect(GapType.THEMATIC).toBe("thematic");
    expect(GapType.CHARACTER).toBe("character");
    expect(GapType.SENSORY).toBe("sensory");
    expect(GapType.CONTINUITY).toBe("continuity");
  });

  it("GapSeverity should have severity levels", () => {
    expect(GapSeverity.CRITICAL).toBe("critical");
    expect(GapSeverity.MODERATE).toBe("moderate");
    expect(GapSeverity.MINOR).toBe("minor");
  });

  it("RoutingTarget should have all targets", () => {
    expect(RoutingTarget.STORYTELLER).toBe("storyteller");
    expect(RoutingTarget.STRUCTURIST).toBe("structurist");
    expect(RoutingTarget.ARCHITECT).toBe("architect");
    expect(RoutingTarget.AUTHOR).toBe("author");
  });
});

describe("Factory functions", () => {
  it("createGap should create a gap with defaults", () => {
    const gap = createGap(
      "gap_1",
      GapType.STRUCTURAL,
      GapSeverity.MODERATE,
      "Missing setup beat",
      RoutingTarget.STRUCTURIST
    );

    expect(gap.id).toBe("gap_1");
    expect(gap.gapType).toBe(GapType.STRUCTURAL);
    expect(gap.severity).toBe(GapSeverity.MODERATE);
    expect(gap.description).toBe("Missing setup beat");
    expect(gap.suggestedRoute).toBe(RoutingTarget.STRUCTURIST);
    expect(gap.resolved).toBe(false);
    expect(gap.location).toEqual({});
  });

  it("createComponentScore should create a score", () => {
    const score = createComponentScore(85, "good", {
      issues: ["Minor issue"],
      suggestions: ["Try this"],
    });

    expect(score.score).toBe(85);
    expect(score.status).toBe("good");
    expect(score.issues).toEqual(["Minor issue"]);
    expect(score.suggestions).toEqual(["Try this"]);
  });

  it("createTrinityAssessment should create assessment", () => {
    const assessment = createTrinityAssessment(
      "Structure is sound",
      "Emotions resonate",
      "Atmosphere is balanced",
      ["Fix pacing"]
    );

    expect(assessment.mia).toBe("Structure is sound");
    expect(assessment.miette).toBe("Emotions resonate");
    expect(assessment.ava8).toBe("Atmosphere is balanced");
    expect(assessment.priorities).toEqual(["Fix pacing"]);
  });
});

describe("NarrativeCoherenceEngine", () => {
  const createTestBeats = () => {
    return [
      createStoryBeat("beat_1", 1, "Setup", NarrativeFunction.INCITING_INCIDENT, 1, {
        emotionalTone: "neutral",
      }),
      createStoryBeat("beat_2", 2, "Rising", NarrativeFunction.RISING_ACTION, 2, {
        emotionalTone: "tense",
      }),
      createStoryBeat("beat_3", 3, "Turning", NarrativeFunction.TURNING_POINT, 2, {
        emotionalTone: "hopeful",
      }),
      createStoryBeat("beat_4", 4, "Crisis", NarrativeFunction.CRISIS, 2, {
        emotionalTone: "fearful",
      }),
      createStoryBeat("beat_5", 5, "Climax", NarrativeFunction.CLIMAX, 3, {
        emotionalTone: "triumphant",
      }),
      createStoryBeat("beat_6", 6, "Resolution", NarrativeFunction.RESOLUTION, 3, {
        emotionalTone: "peaceful",
      }),
    ];
  };

  const createTestCharacters = () => {
    return [
      createCharacterState("char_1", "Hero", "protagonist", Universe.STORY_ENGINE, {
        arcPosition: 0.5,
      }),
      createCharacterState("char_2", "Mentor", "guide", Universe.CEREMONY, {
        arcPosition: 0.3,
      }),
    ];
  };

  const createTestThemes = () => {
    return [
      createThematicThread("theme_1", "Redemption", "Journey of redemption", {
        strength: 0.7,
      }),
      createThematicThread("theme_2", "Sacrifice", "The cost of victory", {
        strength: 0.5,
      }),
    ];
  };

  it("should analyze coherence of a complete narrative", () => {
    const engine = new NarrativeCoherenceEngine();
    const beats = createTestBeats();
    const characters = createTestCharacters();
    const themes = createTestThemes();

    const result = engine.analyze(beats, characters, themes);

    expect(result).toBeDefined();
    // coherenceScore is a 0-1 number; the 0-100 detail is on coherenceBreakdown
    expect(typeof result.coherenceScore).toBe("number");
    expect(result.coherenceScore).toBeGreaterThanOrEqual(0);
    expect(result.coherenceScore).toBeLessThanOrEqual(1);
    expect(result.coherenceBreakdown.overall).toBeGreaterThan(0);
    expect(result.tensions).toBeDefined();
    expect(result.gaps).toBeDefined();
    expect(result.trinityAssessment).toBeDefined();
  });

  it("should detect narrative flow issues", () => {
    const engine = new NarrativeCoherenceEngine();

    // Create beats with jarring emotional transitions
    const beats = [
      createStoryBeat("beat_1", 1, "Tragedy", NarrativeFunction.BEAT, 1, {
        emotionalTone: "devastating",
      }),
      createStoryBeat("beat_2", 2, "Joy", NarrativeFunction.BEAT, 1, {
        emotionalTone: "joyful",
      }),
    ];

    const result = engine.analyze(beats);

    expect(result.coherenceBreakdown.narrativeFlow.score).toBeLessThan(85);
    expect(result.coherenceBreakdown.narrativeFlow.issues.length).toBeGreaterThan(0);
  });

  it("should detect missing climax", () => {
    const engine = new NarrativeCoherenceEngine();

    // Create beats without a climax
    const beats = [
      createStoryBeat("beat_1", 1, "Setup", NarrativeFunction.INCITING_INCIDENT, 1),
      createStoryBeat("beat_2", 2, "Rising", NarrativeFunction.RISING_ACTION, 2),
      createStoryBeat("beat_3", 3, "More rising", NarrativeFunction.RISING_ACTION, 2),
    ];

    const result = engine.analyze(beats);

    const pacingIssues = result.coherenceBreakdown.pacing.issues;
    expect(pacingIssues.some((i) => i.includes("climax"))).toBe(true);
  });

  it("should detect character disappearances", () => {
    const engine = new NarrativeCoherenceEngine();

    const beats = [];
    for (let i = 1; i <= 10; i++) {
      beats.push(
        createStoryBeat(`beat_${i}`, i, `Beat ${i}`, NarrativeFunction.BEAT, 2, {
          characterId: i === 1 || i === 9 ? "hero" : undefined,
        })
      );
    }

    const characters = [
      createCharacterState("hero", "Hero", "protagonist", Universe.STORY_ENGINE),
    ];

    const result = engine.analyze(beats, characters);

    const charIssues = result.coherenceBreakdown.characterConsistency.issues;
    expect(charIssues.some((i) => i.includes("disappears"))).toBe(true);
  });

  it("should detect sequence ordering issues", () => {
    const engine = new NarrativeCoherenceEngine();

    const beats = [
      createStoryBeat("beat_1", 3, "Third", NarrativeFunction.BEAT, 1),
      createStoryBeat("beat_2", 1, "First", NarrativeFunction.BEAT, 1),
      createStoryBeat("beat_3", 2, "Second", NarrativeFunction.BEAT, 1),
    ];

    const result = engine.analyze(beats);

    const continuityIssues = result.coherenceBreakdown.continuity.issues;
    expect(continuityIssues.some((i) => i.includes("not in order"))).toBe(true);
  });

  it("should generate Trinity assessment", () => {
    const engine = new NarrativeCoherenceEngine();
    const beats = createTestBeats();

    const result = engine.analyze(beats);

    expect(result.trinityAssessment.mia).toBeDefined();
    expect(result.trinityAssessment.miette).toBeDefined();
    expect(result.trinityAssessment.ava8).toBeDefined();
    expect(result.trinityAssessment.priorities).toBeDefined();
  });

  it("should route gaps to appropriate targets", () => {
    const engine = new NarrativeCoherenceEngine();

    const gaps = [
      createGap("gap_1", GapType.STRUCTURAL, GapSeverity.MODERATE, "Test", RoutingTarget.STRUCTURIST),
      createGap("gap_2", GapType.CHARACTER, GapSeverity.MINOR, "Test", RoutingTarget.STORYTELLER),
      createGap("gap_3", GapType.CONTINUITY, GapSeverity.CRITICAL, "Test", RoutingTarget.AUTHOR),
    ];

    const routing = engine.getRoutingSuggestions(gaps);

    expect(routing[RoutingTarget.STRUCTURIST]).toHaveLength(1);
    expect(routing[RoutingTarget.STORYTELLER]).toHaveLength(1);
    expect(routing[RoutingTarget.AUTHOR]).toHaveLength(1);
  });

  it("should handle minimal input gracefully", () => {
    const engine = new NarrativeCoherenceEngine();

    const result = engine.analyze([]);

    expect(result.coherenceScore).toBeDefined();
    expect(result.coherenceBreakdown.overall).toBeGreaterThan(0);
  });

  it("should include metadata when requested", () => {
    const engine = new NarrativeCoherenceEngine();
    const beats = createTestBeats();

    const result = engine.analyze(beats, [], [], true);

    expect((result as Record<string, unknown>).narrativeFlowScore).toBeDefined();
    expect((result as Record<string, unknown>).pacingScore).toBeDefined();
    expect((result as Record<string, unknown>).overallScore).toBeDefined();
  });
});
