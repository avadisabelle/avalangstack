/**
 * Tests for three_universe_processor.ts
 */

import { describe, it, expect } from "vitest";
import {
  Universe,
} from "../schemas/unified_state_bridge.js";
import {
  EventType,
  ThreeUniverseProcessor,
  analyzeEngineerPerspective,
  analyzeCeremonyPerspective,
  analyzeStoryEnginePerspective,
  synthesizePerspectives,
  engineerIntentKeywords,
  ceremonyIntentKeywords,
  storyEngineIntentKeywords,
} from "../graphs/three_universe_processor.js";

describe("EventType enum", () => {
  it("should have all event types", () => {
    expect(EventType.GITHUB_PUSH).toBe("github.push");
    expect(EventType.GITHUB_ISSUE).toBe("github.issue");
    expect(EventType.GITHUB_PR).toBe("github.pull_request");
    expect(EventType.USER_INPUT).toBe("user.input");
  });
});

describe("Intent keywords", () => {
  it("engineerIntentKeywords should include technical terms", () => {
    const keywords = engineerIntentKeywords();
    expect(keywords.feature_implementation).toContain("feat:");
    expect(keywords.bug_fix).toContain("fix:");
    expect(keywords.security).toContain("security");
  });

  it("ceremonyIntentKeywords should include relational terms", () => {
    const keywords = ceremonyIntentKeywords();
    expect(keywords.co_creation).toContain("together");
    expect(keywords.gratitude_expression).toContain("thanks");
    expect(keywords.witnessing).toContain("acknowledge");
  });

  it("storyEngineIntentKeywords should include narrative terms", () => {
    const keywords = storyEngineIntentKeywords();
    expect(keywords.inciting_incident).toContain("begin");
    expect(keywords.climax).toContain("complete");
    expect(keywords.resolution).toContain("fix");
  });
});

describe("analyzeEngineerPerspective", () => {
  it("should detect feature implementation", () => {
    const state = {
      event: { content: "feat: add new feature" },
      eventType: "github.push",
    };

    const result = analyzeEngineerPerspective(state);

    expect(result.engineerPerspective).toBeDefined();
    expect(result.engineerPerspective!.universe).toBe(Universe.ENGINEER);
    expect(result.engineerPerspective!.intent).toBe("feature_implementation");
    expect(result.engineerPerspective!.confidence).toBeGreaterThan(0.5);
  });

  it("should detect bug fixes", () => {
    const state = {
      event: { content: "fix: resolve critical bug" },
      eventType: "github.push",
    };

    const result = analyzeEngineerPerspective(state);

    expect(result.engineerPerspective!.intent).toBe("bug_fix");
  });

  it("should extract content from GitHub payload", () => {
    const state = {
      event: {
        payload: {
          commits: [
            { message: "refactor: cleanup code" },
            { message: "chore: restructure files" },
          ],
        },
      },
      eventType: "github.push",
    };

    const result = analyzeEngineerPerspective(state);

    expect(result.engineerPerspective!.intent).toBe("refactor");
  });
});

describe("analyzeCeremonyPerspective", () => {
  it("should detect co-creation with multiple contributors", () => {
    const state = {
      event: {
        sender: "alice",
        payload: {
          commits: [
            { author: { name: "alice" } },
            { author: { name: "bob" } },
          ],
        },
      },
      eventType: "github.push",
    };

    const result = analyzeCeremonyPerspective(state);

    expect(result.ceremonyPerspective).toBeDefined();
    expect(result.ceremonyPerspective!.universe).toBe(Universe.CEREMONY);
    expect(result.ceremonyPerspective!.intent).toBe("co_creation");
    expect(result.ceremonyPerspective!.context.isCollaborative).toBe(true);
  });

  it("should detect gratitude expression", () => {
    const state = {
      event: { content: "Thank you so much for your help!" },
      eventType: "user.input",
    };

    const result = analyzeCeremonyPerspective(state);

    expect(result.ceremonyPerspective!.intent).toBe("gratitude_expression");
  });

  it("should assess energy levels", () => {
    const state = {
      event: { content: "URGENT: Critical fix needed ASAP!" },
      eventType: "user.input",
    };

    const result = analyzeCeremonyPerspective(state);

    expect(result.ceremonyPerspective!.context.senderEnergy).toBe("urgent_flow");
  });
});

describe("analyzeStoryEnginePerspective", () => {
  it("should detect inciting incident", () => {
    const state = {
      event: { content: "init: start new project" },
      eventType: "github.push",
    };

    const result = analyzeStoryEnginePerspective(state);

    expect(result.storyEnginePerspective).toBeDefined();
    expect(result.storyEnginePerspective!.universe).toBe(Universe.STORY_ENGINE);
    expect(result.storyEnginePerspective!.intent).toBe("inciting_incident");
    expect(result.storyEnginePerspective!.context.act).toBe(1);
  });

  it("should detect crisis with high dramatic tension", () => {
    const state = {
      event: { content: "critical: breaking change emergency" },
      eventType: "github.push",
    };

    const result = analyzeStoryEnginePerspective(state);

    expect(result.storyEnginePerspective!.intent).toBe("crisis");
    expect(
      (result.storyEnginePerspective!.context.dramaticTension as number)
    ).toBeGreaterThan(0.8);
  });

  it("should suggest appropriate next beat", () => {
    const state = {
      event: { content: "complete: final release" },
      eventType: "github.push",
    };

    const result = analyzeStoryEnginePerspective(state);

    expect(result.storyEnginePerspective!.intent).toBe("climax");
    expect(result.storyEnginePerspective!.context.suggestedNextBeat).toBe(
      "resolution"
    );
  });
});

describe("synthesizePerspectives", () => {
  it("should combine all perspectives into analysis", () => {
    let state = {
      event: { content: "feat: add new feature together with team" },
      eventType: "github.push",
    };

    state = analyzeEngineerPerspective(state);
    state = analyzeCeremonyPerspective(state);
    state = analyzeStoryEnginePerspective(state);
    const result = synthesizePerspectives(state);

    expect(result.analysis).toBeDefined();
    expect(result.leadUniverse).toBeDefined();
    expect(result.coherenceScore).toBeDefined();
    expect(result.coherenceScore).toBeGreaterThan(0);
    expect(result.coherenceScore).toBeLessThanOrEqual(1);
  });

  it("should error if perspectives are missing", () => {
    const state = {
      event: { content: "test" },
      eventType: "test",
      engineerPerspective: undefined,
    };

    const result = synthesizePerspectives(state);

    expect(result.error).toBeDefined();
    expect(result.error).toContain("Missing one or more perspectives");
  });
});

describe("ThreeUniverseProcessor", () => {
  it("should process an event through all universes", () => {
    const processor = new ThreeUniverseProcessor();

    const analysis = processor.process(
      { content: "feat: implement new feature" },
      "github.push"
    );

    expect(analysis).toBeDefined();
    expect(analysis.engineer).toBeDefined();
    expect(analysis.ceremony).toBeDefined();
    expect(analysis.storyEngine).toBeDefined();
    expect(analysis.leadUniverse).toBeDefined();
    expect(analysis.coherenceScore).toBeGreaterThan(0);
  });

  it("should call tracing callback when configured", () => {
    const calls: unknown[] = [];
    const callback = (...args: unknown[]) => {
      calls.push(args);
    };

    const processor = new ThreeUniverseProcessor({ tracingCallback: callback });

    processor.process({ content: "test" }, "test");

    expect(calls).toHaveLength(1);
    expect(calls[0]).toHaveLength(7); // eventId, content, 3 results, lead, coherence
  });

  it("processWebhook should detect event type from payload", () => {
    const processor = new ThreeUniverseProcessor();

    const analysis = processor.processWebhook({
      payload: {
        issue: {
          title: "Bug report",
          body: "Something is broken",
        },
      },
    });

    expect(analysis).toBeDefined();
    // Should have detected as github.issue
    expect(analysis.storyEngine.context.act).toBeDefined();
  });

  it("createBeatFromAnalysis should create proper beat", () => {
    const processor = new ThreeUniverseProcessor();

    const event = { content: "Complete the final feature" };
    const analysis = processor.process(event, "github.push");

    const beat = processor.createBeatFromAnalysis(event, analysis, 5);

    expect(beat.id).toContain("beat_");
    expect(beat.sequence).toBe(5);
    expect(beat.content).toBe("Complete the final feature");
    expect(beat.universeAnalysis).toBe(analysis);
    expect(beat.leadUniverse).toBe(analysis.leadUniverse);
  });

  it("should determine lead universe correctly", () => {
    const processor = new ThreeUniverseProcessor();

    // Security issue should lead to ENGINEER
    const securityAnalysis = processor.process(
      { content: "security: fix vulnerability" },
      "github.push"
    );
    expect(securityAnalysis.leadUniverse).toBe(Universe.ENGINEER);

    // Collaborative work should lead to CEREMONY
    const collaborativeAnalysis = processor.process(
      {
        sender: "alice",
        payload: {
          commits: [
            { message: "work together", author: { name: "alice" } },
            { message: "team effort", author: { name: "bob" } },
          ],
        },
      },
      "github.push"
    );
    expect(collaborativeAnalysis.leadUniverse).toBe(Universe.CEREMONY);
  });
});
