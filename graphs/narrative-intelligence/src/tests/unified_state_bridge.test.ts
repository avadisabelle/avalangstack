/**
 * Tests for unified_state_bridge.ts
 */

import { describe, it, expect } from "vitest";
import {
  Universe,
  NarrativePhase,
  NarrativeFunction,
  createUniversePerspective,
  createThreeUniverseAnalysis,
  createNarrativePosition,
  createStoryBeat,
  createCharacterState,
  createThematicThread,
  createRoutingDecision,
  createUnifiedNarrativeState,
  addBeat,
  addRoutingDecision,
  updateCharacterArc,
  updateThemeStrength,
  getLastNBeats,
  calculateCoherence,
  shouldCreateNewEpisode,
  startNewEpisode,
  getDefaultCharacters,
  getDefaultThemes,
  RedisKeys,
  serializeState,
  deserializeState,
} from "../schemas/unified_state_bridge.js";

describe("Universe enum", () => {
  it("should have three universes", () => {
    expect(Universe.ENGINEER).toBe("engineer");
    expect(Universe.CEREMONY).toBe("ceremony");
    expect(Universe.STORY_ENGINE).toBe("story_engine");
  });
});

describe("NarrativePhase enum", () => {
  it("should have three phases (three-act structure)", () => {
    expect(NarrativePhase.SETUP).toBe("setup");
    expect(NarrativePhase.CONFRONTATION).toBe("confrontation");
    expect(NarrativePhase.RESOLUTION).toBe("resolution");
  });
});

describe("NarrativeFunction enum", () => {
  it("should have all narrative functions", () => {
    expect(NarrativeFunction.INCITING_INCIDENT).toBe("inciting_incident");
    expect(NarrativeFunction.RISING_ACTION).toBe("rising_action");
    expect(NarrativeFunction.CLIMAX).toBe("climax");
    expect(NarrativeFunction.RESOLUTION).toBe("resolution");
  });
});

describe("createUniversePerspective", () => {
  it("should create a perspective with required fields", () => {
    const perspective = createUniversePerspective(
      Universe.ENGINEER,
      "feature_implementation",
      0.85
    );

    expect(perspective.universe).toBe(Universe.ENGINEER);
    expect(perspective.intent).toBe("feature_implementation");
    expect(perspective.confidence).toBe(0.85);
    expect(perspective.suggestedFlows).toEqual([]);
    expect(perspective.context).toEqual({});
  });

  it("should accept optional fields", () => {
    const perspective = createUniversePerspective(
      Universe.CEREMONY,
      "co_creation",
      0.9,
      {
        suggestedFlows: ["witness_collaboration", "honor_contributions"],
        context: { isCollaborative: true },
      }
    );

    expect(perspective.suggestedFlows).toEqual([
      "witness_collaboration",
      "honor_contributions",
    ]);
    expect(perspective.context).toEqual({ isCollaborative: true });
  });
});

describe("createThreeUniverseAnalysis", () => {
  it("should combine three perspectives", () => {
    const engineer = createUniversePerspective(Universe.ENGINEER, "bug_fix", 0.8);
    const ceremony = createUniversePerspective(Universe.CEREMONY, "healing", 0.6);
    const storyEngine = createUniversePerspective(
      Universe.STORY_ENGINE,
      "resolution",
      0.7
    );

    const analysis = createThreeUniverseAnalysis(
      engineer,
      ceremony,
      storyEngine,
      Universe.ENGINEER,
      0.75
    );

    expect(analysis.engineer).toBe(engineer);
    expect(analysis.ceremony).toBe(ceremony);
    expect(analysis.storyEngine).toBe(storyEngine);
    expect(analysis.leadUniverse).toBe(Universe.ENGINEER);
    expect(analysis.coherenceScore).toBe(0.75);
    expect(analysis.timestamp).toBeDefined();
  });
});

describe("createStoryBeat", () => {
  it("should create a beat with required fields", () => {
    const beat = createStoryBeat(
      "beat_1",
      1,
      "The hero makes a decision",
      NarrativeFunction.TURNING_POINT,
      2
    );

    expect(beat.id).toBe("beat_1");
    expect(beat.sequence).toBe(1);
    expect(beat.content).toBe("The hero makes a decision");
    expect(beat.narrativeFunction).toBe(NarrativeFunction.TURNING_POINT);
    expect(beat.act).toBe(2);
    expect(beat.leadUniverse).toBe(Universe.STORY_ENGINE);
    expect(beat.emotionalTone).toBe("neutral");
    expect(beat.thematicTags).toEqual([]);
    expect(beat.qualityScore).toBe(0.5);
  });

  it("should accept optional fields", () => {
    const beat = createStoryBeat(
      "beat_2",
      2,
      "Final confrontation",
      NarrativeFunction.CLIMAX,
      3,
      {
        emotionalTone: "triumphant",
        thematicTags: ["victory", "transformation"],
        characterId: "hero-1",
        characterArcImpact: 0.9,
      }
    );

    expect(beat.emotionalTone).toBe("triumphant");
    expect(beat.thematicTags).toEqual(["victory", "transformation"]);
    expect(beat.characterId).toBe("hero-1");
    expect(beat.characterArcImpact).toBe(0.9);
  });
});

describe("createUnifiedNarrativeState", () => {
  it("should create state with default characters and themes", () => {
    const state = createUnifiedNarrativeState("story_1", "session_1");

    expect(state.storyId).toBe("story_1");
    expect(state.sessionId).toBe("session_1");
    expect(state.beats).toEqual([]);
    expect(state.position.act).toBe(1);
    expect(state.position.phase).toBe(NarrativePhase.SETUP);

    // Check default characters
    expect(Object.keys(state.characters)).toContain("the-builder");
    expect(Object.keys(state.characters)).toContain("the-keeper");
    expect(Object.keys(state.characters)).toContain("the-weaver");

    // Check default themes
    expect(Object.keys(state.themes)).toContain("integration");
    expect(Object.keys(state.themes)).toContain("collaboration");
    expect(Object.keys(state.themes)).toContain("coherence");
  });

  it("should create state without defaults when specified", () => {
    const state = createUnifiedNarrativeState("story_1", "session_1", {
      includeDefaultCharacters: false,
      includeDefaultThemes: false,
    });

    expect(Object.keys(state.characters)).toEqual([]);
    expect(Object.keys(state.themes)).toEqual([]);
  });
});

describe("State manipulation functions", () => {
  it("addBeat should add beat and update position", () => {
    const state = createUnifiedNarrativeState("story_1", "session_1");

    const beat = createStoryBeat(
      "beat_1",
      1,
      "Opening scene",
      NarrativeFunction.INCITING_INCIDENT,
      1
    );

    addBeat(state, beat);

    expect(state.beats).toHaveLength(1);
    expect(state.position.beatCount).toBe(1);
    expect(state.position.currentBeatId).toBe("beat_1");
    expect(state.episodeBeatsCount).toBe(1);
  });

  it("addBeat should update act/phase for special functions", () => {
    const state = createUnifiedNarrativeState("story_1", "session_1");

    const climaxBeat = createStoryBeat(
      "beat_climax",
      10,
      "The climax",
      NarrativeFunction.CLIMAX,
      3
    );

    addBeat(state, climaxBeat);

    expect(state.position.act).toBe(3);
    expect(state.position.phase).toBe(NarrativePhase.RESOLUTION);
  });

  it("updateCharacterArc should update character growth", () => {
    const state = createUnifiedNarrativeState("story_1", "session_1");

    updateCharacterArc(state, "the-builder", 0.1, "Learned empathy");

    const builder = state.characters["the-builder"];
    expect(builder.arcPosition).toBeCloseTo(0.1);
    expect(builder.growthPoints).toHaveLength(1);
    expect(builder.growthPoints[0].description).toBe("Learned empathy");
  });

  it("updateThemeStrength should update theme", () => {
    const state = createUnifiedNarrativeState("story_1", "session_1");

    const initialStrength = state.themes["integration"].strength;
    updateThemeStrength(state, "integration", 0.2);

    expect(state.themes["integration"].strength).toBeCloseTo(
      initialStrength + 0.2
    );
  });

  it("getLastNBeats should return recent beats", () => {
    const state = createUnifiedNarrativeState("story_1", "session_1");

    for (let i = 1; i <= 10; i++) {
      const beat = createStoryBeat(
        `beat_${i}`,
        i,
        `Beat ${i}`,
        NarrativeFunction.BEAT,
        2
      );
      addBeat(state, beat);
    }

    const lastThree = getLastNBeats(state, 3);
    expect(lastThree).toHaveLength(3);
    expect(lastThree[0].id).toBe("beat_8");
    expect(lastThree[2].id).toBe("beat_10");
  });

  it("shouldCreateNewEpisode should return true after 12 beats", () => {
    const state = createUnifiedNarrativeState("story_1", "session_1");

    for (let i = 1; i <= 12; i++) {
      const beat = createStoryBeat(
        `beat_${i}`,
        i,
        `Beat ${i}`,
        NarrativeFunction.BEAT,
        2
      );
      addBeat(state, beat);
    }

    expect(shouldCreateNewEpisode(state)).toBe(true);
  });

  it("startNewEpisode should reset episode counter", () => {
    const state = createUnifiedNarrativeState("story_1", "session_1");
    state.episodeBeatsCount = 10;

    startNewEpisode(state, "episode_2");

    expect(state.currentEpisodeId).toBe("episode_2");
    expect(state.episodeBeatsCount).toBe(0);
  });
});

describe("Default characters and themes", () => {
  it("getDefaultCharacters should return Mia, Ava8, Miette", () => {
    const characters = getDefaultCharacters();

    expect(characters["the-builder"].name).toBe("Mia");
    expect(characters["the-builder"].archetype).toBe("The Builder");
    expect(characters["the-builder"].universe).toBe(Universe.ENGINEER);

    expect(characters["the-keeper"].name).toBe("Ava8");
    expect(characters["the-keeper"].archetype).toBe("The Keeper");
    expect(characters["the-keeper"].universe).toBe(Universe.CEREMONY);

    expect(characters["the-weaver"].name).toBe("Miette");
    expect(characters["the-weaver"].archetype).toBe("The Weaver");
    expect(characters["the-weaver"].universe).toBe(Universe.STORY_ENGINE);
  });

  it("getDefaultThemes should return standard themes", () => {
    const themes = getDefaultThemes();

    expect(themes["integration"].name).toBe("Integration Without Extraction");
    expect(themes["collaboration"].name).toBe("Cross-Universe Collaboration");
    expect(themes["coherence"].name).toBe("Narrative Coherence");
  });
});

describe("Redis keys", () => {
  it("should generate correct key patterns", () => {
    expect(RedisKeys.state("session_1")).toBe("ncp:state:session_1");
    expect(RedisKeys.currentState()).toBe("ncp:state:current");
    expect(RedisKeys.beats("session_1")).toBe("ncp:beats:session_1");
    expect(RedisKeys.beat("beat_1")).toBe("ncp:beat:beat_1");
    expect(RedisKeys.eventAnalysis("event_1")).toBe("ncp:event:event_1");
    expect(RedisKeys.routingHistory("session_1")).toBe("ncp:routing:session_1");
    expect(RedisKeys.episode("ep_1")).toBe("ncp:episode:ep_1");
  });
});

describe("Serialization", () => {
  it("should serialize and deserialize state", () => {
    const state = createUnifiedNarrativeState("story_1", "session_1");

    const beat = createStoryBeat(
      "beat_1",
      1,
      "Test beat",
      NarrativeFunction.BEAT,
      1
    );
    addBeat(state, beat);

    const json = serializeState(state);
    const restored = deserializeState(json);

    expect(restored.storyId).toBe(state.storyId);
    expect(restored.sessionId).toBe(state.sessionId);
    expect(restored.beats).toHaveLength(1);
    expect(restored.beats[0].id).toBe("beat_1");
  });
});
