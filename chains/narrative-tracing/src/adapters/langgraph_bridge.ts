/**
 * LangGraph Bridge Adapter
 *
 * Wires the LangGraph ThreePerspectiveProcessor to narrative-tracing,
 * so every three-perspective analysis automatically logs to Langfuse.
 */

import { NarrativeTracingHandler } from "../handler.js";
import { normalizePerspectiveValue } from "../event_types.js";

/**
 * Simplified reading from a single perspective (the structural form of
 * narrative-intelligence's `PerspectiveReading`)
 */
export interface PerspectiveReadingLike {
  intent: string;
  confidence: number;
  suggestedFlows: string[];
  context: Record<string, unknown>;
}

/**
 * @deprecated use PerspectiveReadingLike
 */
export type UniverseResult = PerspectiveReadingLike;

/**
 * Protocol matching LangGraph's ThreePerspectiveAnalysis. Accepts the lead as
 * `leadPerspective` or, from analyses made before the perspective rename,
 * as `leadUniverse`.
 */
export interface ThreePerspectiveAnalysisLike {
  engineer: { intent: string; confidence: number };
  ceremony: { intent: string; confidence: number };
  storyEngine: { intent: string; confidence: number };
  leadPerspective?: string | { value: string };
  /** @deprecated use leadPerspective */
  leadUniverse?: string | { value: string };
  coherenceScore: number;
}

/**
 * @deprecated use ThreePerspectiveAnalysisLike
 */
export type ThreeUniverseAnalysisLike = ThreePerspectiveAnalysisLike;

/**
 * Lead perspective of an analysis as a bare string. Accepts `leadPerspective`
 * or the legacy `leadUniverse`, as a string or an enum-like `{ value }`.
 */
function leadOf(analysis: ThreePerspectiveAnalysisLike): string | undefined {
  const lead = analysis.leadPerspective ?? analysis.leadUniverse;
  const value = typeof lead === "object" && lead !== null ? lead.value : lead;
  return normalizePerspectiveValue(value);
}

/**
 * Context object for trace_analysis context manager pattern
 */
export interface AnalysisContext {
  eventId: string;
  eventContent: string;
  engineerResult?: Record<string, unknown>;
  ceremonyResult?: Record<string, unknown>;
  storyEngineResult?: Record<string, unknown>;
  leadPerspective: string;
  coherenceScore: number;
  parentSpanId?: string;
}

export interface LangGraphBridgeOptions {
  autoFlush?: boolean;
}

const VALID_PERSPECTIVES = new Set(["engineer", "ceremony", "story_engine"]);

/**
 * Wire LangGraph three-perspective processing to narrative tracing.
 *
 * @example
 * ```typescript
 * const handler = new NarrativeTracingHandler({ storyId: 'story_123' });
 * const bridge = new LangGraphBridge(handler);
 *
 * // Get callback for manual injection
 * const callback = bridge.createThreePerspectiveCallback();
 *
 * // After processing an event
 * callback({
 *   eventId: 'evt_123',
 *   eventContent: 'feat: add three-perspective processing',
 *   engineerResult: { intent: 'feature_implementation', confidence: 0.8 },
 *   ceremonyResult: { intent: 'co_creation', confidence: 0.7 },
 *   storyEngineResult: { intent: 'rising_action', confidence: 0.85 },
 *   leadPerspective: 'story_engine',
 *   coherenceScore: 0.82
 * });
 * ```
 */
export class LangGraphBridge {
  private handler: NarrativeTracingHandler;
  private autoFlush: boolean;
  private _analysisCount: number = 0;

  constructor(
    handler: NarrativeTracingHandler,
    options: LangGraphBridgeOptions = {}
  ) {
    this.handler = handler;
    this.autoFlush = options.autoFlush ?? false;
  }

  // ===========================================================================
  // CALLBACK APPROACH
  // ===========================================================================

  /**
   * Create callback function for logging three-perspective analysis
   */
  createThreePerspectiveCallback(parentSpanId?: string): (params: {
    eventId: string;
    eventContent: string;
    engineerResult: Record<string, unknown>;
    ceremonyResult: Record<string, unknown>;
    storyEngineResult: Record<string, unknown>;
    leadPerspective?: string;
    /** @deprecated use leadPerspective */
    leadUniverse?: string;
    coherenceScore: number;
  }) => string {
    return (params) => {
      this.validateCoherenceScore(params.coherenceScore);
      const leadPerspective = normalizePerspectiveValue(
        params.leadPerspective ?? params.leadUniverse
      );
      this.validateLeadPerspective(leadPerspective);

      const spanId = this.handler.logThreePerspectiveAnalysis({
        eventId: params.eventId,
        engineerIntent: (params.engineerResult.intent as string) || "unknown",
        engineerConfidence:
          (params.engineerResult.confidence as number) || 0.0,
        ceremonyIntent: (params.ceremonyResult.intent as string) || "unknown",
        ceremonyConfidence:
          (params.ceremonyResult.confidence as number) || 0.0,
        storyEngineIntent:
          (params.storyEngineResult.intent as string) || "unknown",
        storyEngineConfidence:
          (params.storyEngineResult.confidence as number) || 0.0,
        leadPerspective,
        coherenceScore: params.coherenceScore,
        parentSpanId,
      });

      this._analysisCount += 1;

      if (this.autoFlush) {
        this.handler.flush();
      }

      return spanId;
    };
  }

  /**
   * @deprecated use createThreePerspectiveCallback
   */
  createThreeUniverseCallback(
    parentSpanId?: string
  ): ReturnType<LangGraphBridge["createThreePerspectiveCallback"]> {
    return this.createThreePerspectiveCallback(parentSpanId);
  }

  // ===========================================================================
  // ANALYSIS OBJECT APPROACH
  // ===========================================================================

  /**
   * Log a ThreePerspectiveAnalysis object directly
   */
  logAnalysis(
    eventId: string,
    analysis: ThreePerspectiveAnalysisLike,
    options: {
      eventContent?: string;
      parentSpanId?: string;
    } = {}
  ): string {
    return this.handler.logThreePerspectiveAnalysis({
      eventId,
      engineerIntent: analysis.engineer.intent,
      engineerConfidence: analysis.engineer.confidence,
      ceremonyIntent: analysis.ceremony.intent,
      ceremonyConfidence: analysis.ceremony.confidence,
      storyEngineIntent: analysis.storyEngine.intent,
      storyEngineConfidence: analysis.storyEngine.confidence,
      leadPerspective: leadOf(analysis),
      coherenceScore: analysis.coherenceScore,
      parentSpanId: options.parentSpanId,
    });
  }

  // ===========================================================================
  // DECORATOR/WRAPPER APPROACH
  // ===========================================================================

  /**
   * Wrap a function that takes an event and returns a ThreePerspectiveAnalysis
   */
  traceProcessor<T extends ThreePerspectiveAnalysisLike>(
    fn: (event: Record<string, unknown>) => T | Promise<T>,
    eventIdExtractor?: (event: Record<string, unknown>) => string
  ): (event: Record<string, unknown>) => Promise<T> {
    return async (event: Record<string, unknown>) => {
      const eventId = eventIdExtractor
        ? eventIdExtractor(event)
        : (event.eventId as string) || `evt_${this._analysisCount}`;

      const result = await fn(event);

      if (
        result &&
        ("leadPerspective" in result || "leadUniverse" in result) &&
        "coherenceScore" in result
      ) {
        this.logAnalysis(eventId, result, {
          eventContent: event.content as string | undefined,
        });
      }

      return result;
    };
  }

  // ===========================================================================
  // BEAT CREATION TRACKING
  // ===========================================================================

  /**
   * Log creation of a story beat from three-perspective analysis
   */
  logBeatCreation(
    beatId: string,
    content: string,
    sequence: number,
    narrativeFunction: string,
    options: {
      analysis?: ThreePerspectiveAnalysisLike;
      emotionalTone?: string;
      parentSpanId?: string;
    } = {}
  ): string {
    let source = "three_perspective_processor";
    if (options.analysis) {
      source = `${leadOf(options.analysis)}_led`;
    }

    return this.handler.logBeatCreation(beatId, content, sequence, narrativeFunction, {
      source,
      emotionalTone: options.emotionalTone,
      parentSpanId: options.parentSpanId,
    });
  }

  // ===========================================================================
  // VALIDATION HELPERS
  // ===========================================================================

  private validateCoherenceScore(score: number): void {
    if (score < 0.0 || score > 1.0) {
      throw new Error(
        `coherence_score must be between 0.0 and 1.0, got ${score}`
      );
    }
  }

  private validateLeadPerspective(perspective: string | undefined): void {
    if (perspective === undefined || !VALID_PERSPECTIVES.has(perspective)) {
      // The message keeps its pre-rename wording until the remove release,
      // because callers may match on it.
      throw new Error(
        `lead_universe must be one of ${[...VALID_PERSPECTIVES].join(", ")}, got '${perspective}'`
      );
    }
  }

  // ===========================================================================
  // STATISTICS
  // ===========================================================================

  get analysisCount(): number {
    return this._analysisCount;
  }

  resetCount(): void {
    this._analysisCount = 0;
  }
}
