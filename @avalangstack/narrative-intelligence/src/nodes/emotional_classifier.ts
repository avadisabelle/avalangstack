/**
 * Emotional Beat Classifier Node
 *
 * A node that classifies the emotional tone of story beats.
 */

import type { NCPStoryBeat } from "../schemas/ncp.js";

/**
 * Predefined emotional tone categories.
 */
export enum EmotionalTone {
  DEVASTATING = "Devastating",
  HOPEFUL = "Hopeful",
  TENSE = "Tense",
  JOYFUL = "Joyful",
  MELANCHOLIC = "Melancholic",
  TRIUMPHANT = "Triumphant",
  FEARFUL = "Fearful",
  PEACEFUL = "Peaceful",
  CONFLICTED = "Conflicted",
  RESIGNED = "Resigned",
  /**
   * No keyword matched. A detectable absence — distinct from confidently
   * naming a tone. Consumers can branch on this instead of trusting a default.
   */
  UNKNOWN = "Unknown",
}

/**
 * Classification result.
 */
export interface ClassificationResult {
  classification: string;
  confidence: number;
  method: string;
  prompt?: string;
}

/**
 * State for emotional classification.
 */
export interface EmotionalClassificationState {
  ncpData?: {
    storybeats: NCPStoryBeat[];
    getStorybeat?: (id: string) => NCPStoryBeat | undefined;
  };
  storybeatId?: string;
  emotionalClassification?: string;
  confidenceScore?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Keyword mappings for emotional tones.
 */
export const TONE_KEYWORDS: Record<
  Exclude<EmotionalTone, EmotionalTone.UNKNOWN>,
  string[]
> = {
  [EmotionalTone.DEVASTATING]: ["destroy", "loss", "death", "tragedy", "grief", "devastat"],
  [EmotionalTone.HOPEFUL]: ["hope", "bright", "promise", "future", "optimis", "dream"],
  [EmotionalTone.TENSE]: ["tense", "anxious", "nervous", "edge", "suspense", "uncertain"],
  [EmotionalTone.JOYFUL]: ["joy", "happy", "celebrate", "triumph", "delight", "elat"],
  [EmotionalTone.MELANCHOLIC]: ["sad", "melanchol", "wistful", "longing", "regret", "sorrow"],
  [EmotionalTone.TRIUMPHANT]: ["victory", "triumph", "succeed", "conquer", "win", "achieve"],
  [EmotionalTone.FEARFUL]: ["fear", "terror", "dread", "frighten", "horror", "panic"],
  [EmotionalTone.PEACEFUL]: ["peace", "calm", "serene", "tranquil", "quiet", "still"],
  [EmotionalTone.CONFLICTED]: ["conflict", "torn", "struggle", "dilemma", "uncertain", "doubt"],
  [EmotionalTone.RESIGNED]: ["resign", "accept", "inevitable", "surrender", "fate", "give up"],
};

/**
 * Classifies the emotional tone of story beats.
 *
 * This node enriches the narrative graph with emotional metadata,
 * enabling new forms of analysis and visualization.
 *
 * @example
 * const classifier = new EmotionalBeatClassifierNode();
 * const result = classifier.classifyBeat({
 *   storybeatId: "beat_1",
 *   title: "The Final Goodbye",
 *   description: "She said goodbye for the last time, grief overwhelming her."
 * });
 * console.log(result.classification); // "Devastating"
 */
export class EmotionalBeatClassifierNode {
  private useLLM: boolean;
  private modelName?: string;
  private categories: string[];

  constructor(options: {
    useLLM?: boolean;
    modelName?: string;
    customCategories?: string[];
  } = {}) {
    this.useLLM = options.useLLM ?? true;
    this.modelName = options.modelName;
    this.categories = options.customCategories ?? Object.values(EmotionalTone);
  }

  /**
   * Classify the emotional tone of a story beat.
   *
   * @param storybeat The story beat to classify
   * @param context Optional additional context for classification
   * @returns Classification result with confidence score
   */
  classifyBeat(
    storybeat: NCPStoryBeat,
    context?: string
  ): ClassificationResult {
    // If beat already has emotional_weight, use it as baseline
    if (storybeat.emotionalWeight) {
      return {
        classification: storybeat.emotionalWeight,
        confidence: 1.0,
        method: "existing",
      };
    }

    if (this.useLLM) {
      return this.classifyWithLLM(storybeat, context);
    } else {
      return this.classifyRuleBased(storybeat);
    }
  }

  /**
   * Classify using an LLM (placeholder implementation).
   */
  private classifyWithLLM(
    storybeat: NCPStoryBeat,
    context?: string
  ): ClassificationResult {
    // Build prompt for future LLM integration
    const prompt = this.buildClassificationPrompt(storybeat, context);

    // For now, fall back to rule-based
    const ruleBasedResult = this.classifyRuleBased(storybeat);

    // Do not inflate confidence for a result the rule-based path could not
    // actually determine — a placeholder must not manufacture certainty.
    if (ruleBasedResult.classification === EmotionalTone.UNKNOWN) {
      return { ...ruleBasedResult, prompt };
    }

    return {
      classification: ruleBasedResult.classification,
      confidence: 0.8,
      method: "llm_placeholder",
      prompt,
    };
  }

  /**
   * Build the LLM classification prompt.
   */
  private buildClassificationPrompt(
    storybeat: NCPStoryBeat,
    context?: string
  ): string {
    const categoriesStr = this.categories.join(", ");

    let prompt = `Classify the emotional tone of this story beat.

Story Beat: ${storybeat.title}
Description: ${storybeat.description}

Available categories: ${categoriesStr}

Analyze the emotional weight and tone of this beat. Consider:
1. The language and imagery used
2. The actions and events described
3. The overall mood conveyed

Respond with:
1. The most appropriate emotional category
2. A confidence score (0.0-1.0)
3. A brief explanation of your classification

Classification:`;

    if (context) {
      prompt = `${prompt}\n\nAdditional Context:\n${context}\n`;
    }

    return prompt;
  }

  /**
   * Simple rule-based classification using keyword matching.
   */
  classifyRuleBased(storybeat: NCPStoryBeat): ClassificationResult {
    const text = `${storybeat.title} ${storybeat.description}`.toLowerCase();

    // Score each tone based on keyword matches
    const scores: Record<string, number> = {};

    for (const [tone, keywords] of Object.entries(TONE_KEYWORDS)) {
      const score = keywords.filter((keyword) => text.includes(keyword)).length;
      if (score > 0) {
        scores[tone] = score;
      }
    }

    if (Object.keys(scores).length > 0) {
      // Return the tone with highest score
      const [bestTone, bestScore] = Object.entries(scores).reduce((a, b) =>
        a[1] > b[1] ? a : b
      );
      const confidence = Math.min(bestScore / 3.0, 1.0); // Cap at 1.0

      return {
        classification: bestTone,
        confidence,
        method: "rule_based",
      };
    } else {
      // Nothing matched. Report the absence honestly rather than naming a tone
      // the text never earned — a consumer can detect Unknown, but cannot detect
      // a confident default.
      return {
        classification: EmotionalTone.UNKNOWN,
        confidence: 0.0,
        method: "no_match",
      };
    }
  }

  /**
   * Node callable for LangGraph-style state processing.
   */
  call(state: EmotionalClassificationState): EmotionalClassificationState {
    if (!state.ncpData) {
      return {
        ...state,
        error: "No NCP data loaded. Run NCPLoaderNode first.",
      };
    }

    const ncpData = state.ncpData;
    const storybeatId = state.storybeatId;

    if (!storybeatId) {
      return {
        ...state,
        error: "No storybeatId provided for classification.",
      };
    }

    try {
      const storybeat = ncpData.getStorybeat?.(storybeatId) ??
        ncpData.storybeats.find((sb) => sb.storybeatId === storybeatId);

      if (!storybeat) {
        return {
          ...state,
          error: `Story beat not found: ${storybeatId}`,
        };
      }

      // Get context from metadata if available
      const context = state.metadata?.classificationContext as string | undefined;

      // Perform classification
      const result = this.classifyBeat(storybeat, context);

      return {
        ...state,
        emotionalClassification: result.classification,
        confidenceScore: result.confidence,
        error: undefined,
        metadata: {
          ...state.metadata,
          classificationMethod: result.method,
        },
      };
    } catch (e) {
      return {
        ...state,
        error: `Classification error: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }
}

/**
 * Classify a single text snippet for emotional tone.
 * Convenience function for quick classification without NCP data.
 */
export function classifyEmotionalTone(text: string): ClassificationResult {
  const classifier = new EmotionalBeatClassifierNode({ useLLM: false });
  return classifier.classifyRuleBased({
    storybeatId: "temp",
    title: "",
    description: text,
    moments: [],
    relatedPlayers: [],
    relatedStorypoints: [],
    metadata: {},
  });
}
