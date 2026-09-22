/**
 * Narrative Trace Formatter
 *
 * Formats narrative traces for human understanding, not just machine parsing.
 * Transforms generic spans into narrative-aware displays.
 */

import {
  NarrativeEventType,
  EVENT_GLYPHS,
  NarrativeMetrics,
  NarrativeSpan,
  createNarrativeMetrics,
  getCrossPerspectiveCoherence,
  getSpanLeadPerspective,
  isThreePerspectiveAnalysisEvent,
} from "./event_types.js";
import { CompletedTrace } from "./orchestrator.js";

/**
 * A span formatted for human display
 */
export interface FormattedSpan {
  displayName: string;
  details: string[];
  children: FormattedSpan[];
  indentLevel: number;
}

/**
 * Convert FormattedSpan to string representation
 */
export function formattedSpanToString(
  span: FormattedSpan,
  indent: number = 0
): string {
  const prefix = "│  ".repeat(indent);
  const connector = indent > 0 ? "├─ " : "";

  const lines = [`${prefix}${connector}${span.displayName}`];

  for (const detail of span.details) {
    lines.push(`${prefix}│  └─ ${detail}`);
  }

  for (let i = 0; i < span.children.length; i++) {
    lines.push(formattedSpanToString(span.children[i], indent + 1));
  }

  return lines.join("\n");
}

/**
 * Visualization of story arc progression
 */
export interface StoryArcVisualization {
  characterArcs: Record<string, number[]>;
  emotionalBeats: string[];
  themeMentions: Record<string, number>;
}

/**
 * Generate ASCII chart for character arc
 */
export function arcToAsciiChart(
  visualization: StoryArcVisualization,
  characterId: string,
  width: number = 50
): string {
  if (!(characterId in visualization.characterArcs)) {
    return `No arc data for ${characterId}`;
  }

  const positions = visualization.characterArcs[characterId];
  if (!positions || positions.length === 0) {
    return "Empty arc";
  }

  const chartHeight = 10;
  const lines: string[] = [];

  for (let row = chartHeight; row >= 0; row--) {
    let line = "";
    const threshold = row / chartHeight;
    for (const pos of positions) {
      line += pos >= threshold ? "█" : "·";
    }
    lines.push(`${(row / chartHeight).toFixed(1)} │${line}`);
  }

  lines.push("    └" + "─".repeat(positions.length));
  lines.push(
    "      " + positions.map((_, i) => (i % 10).toString()).join("")
  );

  return lines.join("\n");
}

/**
 * Formats narrative traces for human understanding.
 */
export class NarrativeTraceFormatter {
  // ===========================================================================
  // DISPLAY FORMATTING
  // ===========================================================================

  /**
   * Generate human-readable trace with narrative structure
   */
  formatForDisplay(trace: CompletedTrace): string {
    const lines: string[] = [];

    // Header
    lines.push(`📖 Story Generation: ${trace.storyId}`);
    lines.push(`   Session: ${trace.sessionId}`);
    lines.push(`   Duration: ${trace.durationMs.toFixed(0)}ms`);
    lines.push("");

    // Group spans by beat
    const beats: Record<string, NarrativeSpan[]> = {};
    const otherSpans: NarrativeSpan[] = [];

    for (const span of trace.spans) {
      if (span.beatId) {
        if (!beats[span.beatId]) {
          beats[span.beatId] = [];
        }
        beats[span.beatId].push(span);
      } else {
        otherSpans.push(span);
      }
    }

    // Format beats
    for (const [beatId, beatSpans] of Object.entries(beats)) {
      const creationSpan = beatSpans.find(
        (s) => s.eventType === NarrativeEventType.BEAT_CREATED
      );

      if (creationSpan) {
        const emotionalTone = creationSpan.emotionalTone || "neutral";
        lines.push(`├─ 📝 Beat: ${beatId} (${emotionalTone})`);

        for (const span of beatSpans) {
          if (span.spanId !== creationSpan.spanId) {
            const glyph = EVENT_GLYPHS[span.eventType] || "⚙️";
            const eventName = span.eventType
              .split(".")
              .pop()
              ?.replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase());
            lines.push(`│  ├─ ${glyph} ${eventName}`);

            if (span.outputData) {
              for (const [key, value] of Object.entries(span.outputData)) {
                if (
                  typeof value === "number" ||
                  typeof value === "string" ||
                  typeof value === "boolean"
                ) {
                  lines.push(`│  │  └─ ${key}: ${value}`);
                }
              }
            }
          }
        }
      }
    }

    // Format other spans
    if (otherSpans.length > 0) {
      lines.push("│");
      for (const span of otherSpans) {
        const glyph = EVENT_GLYPHS[span.eventType] || "⚙️";
        const eventName = span.eventType
          .split(".")
          .pop()
          ?.replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        const leadPerspective = getSpanLeadPerspective(span);
        const context = leadPerspective ? ` (lead: ${leadPerspective})` : "";
        lines.push(`├─ ${glyph} ${eventName}${context}`);
      }
    }

    // Final metrics
    if (trace.metrics) {
      lines.push("│");
      lines.push(`└─ 📊 Final Metrics`);
      lines.push(`   ├─ coherence: ${trace.metrics.coherenceScore.toFixed(2)}`);
      lines.push(
        `   ├─ emotional_arc: ${trace.metrics.emotionalArcStrength.toFixed(2)}`
      );
      lines.push(
        `   ├─ theme_clarity: ${trace.metrics.themeClarity.toFixed(2)}`
      );
      lines.push(`   ├─ beats_generated: ${trace.metrics.beatsGenerated}`);
      lines.push(
        `   └─ overall_quality: ${this.calculateOverallQuality(
          trace.metrics
        ).toFixed(2)}`
      );
    }

    return lines.join("\n");
  }

  /**
   * Generate chronological beat sequence view
   */
  formatAsTimeline(trace: CompletedTrace): string {
    const lines: string[] = [];
    lines.push(`📅 Timeline: ${trace.storyId}`);
    lines.push(`   ${trace.startTime} → ${trace.endTime}`);
    lines.push("");

    // Sort spans by start time
    const sortedSpans = [...trace.spans].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

    for (let i = 0; i < sortedSpans.length; i++) {
      const span = sortedSpans[i];
      const glyph = EVENT_GLYPHS[span.eventType] || "⚙️";
      const eventName = span.eventType
        .split(".")
        .pop()
        ?.replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

      let timeStr: string;
      try {
        const dt = new Date(span.startTime);
        timeStr = dt.toISOString().substring(11, 23);
      } catch {
        timeStr = "??:??:??";
      }

      const connector = i === sortedSpans.length - 1 ? "└─" : "├─";
      lines.push(`${timeStr} ${connector} ${glyph} ${eventName}`);

      if (span.beatId) {
        lines.push(`          │   beat: ${span.beatId}`);
      }
      if (span.emotionalTone) {
        lines.push(`          │   emotion: ${span.emotionalTone}`);
      }
      const leadPerspective = getSpanLeadPerspective(span);
      if (leadPerspective) {
        lines.push(`          │   perspective: ${leadPerspective}`);
      }
    }

    return lines.join("\n");
  }

  /**
   * Generate character-centric arc view
   */
  formatAsArcGraph(trace: CompletedTrace): string {
    const lines: string[] = [];
    lines.push(`🎭 Character Arcs: ${trace.storyId}`);
    lines.push("");

    const arcData = this.extractCharacterArcs(trace);

    if (Object.keys(arcData.characterArcs).length === 0) {
      lines.push("No character arc data found");
      return lines.join("\n");
    }

    for (const [characterId, positions] of Object.entries(
      arcData.characterArcs
    )) {
      lines.push(`Character: ${characterId}`);
      lines.push(arcToAsciiChart(arcData, characterId, 40));
      lines.push("");
    }

    if (arcData.emotionalBeats.length > 0) {
      lines.push("Emotional Journey:");
      for (let i = 0; i < arcData.emotionalBeats.length; i++) {
        lines.push(`  ${i + 1}. ${arcData.emotionalBeats[i]}`);
      }
    }

    return lines.join("\n");
  }

  /**
   * Generate documentation-ready markdown format
   */
  exportAsMarkdown(trace: CompletedTrace): string {
    const lines: string[] = [];

    // Title
    lines.push(`# Story Generation Trace: ${trace.storyId}`);
    lines.push("");

    // Metadata
    lines.push("## Metadata");
    lines.push("");
    lines.push(`- **Story ID**: ${trace.storyId}`);
    lines.push(`- **Session ID**: ${trace.sessionId}`);
    lines.push(`- **Duration**: ${trace.durationMs.toFixed(0)}ms`);
    lines.push(`- **Beats Generated**: ${trace.beatCount}`);
    lines.push("");

    // Metrics
    if (trace.metrics) {
      lines.push("## Quality Metrics");
      lines.push("");
      lines.push("| Metric | Value |");
      lines.push("|--------|-------|");
      lines.push(`| Coherence | ${trace.metrics.coherenceScore.toFixed(2)} |`);
      lines.push(
        `| Emotional Arc | ${trace.metrics.emotionalArcStrength.toFixed(2)} |`
      );
      lines.push(
        `| Theme Clarity | ${trace.metrics.themeClarity.toFixed(2)} |`
      );
      lines.push(
        `| Cross-Perspective Coherence | ${getCrossPerspectiveCoherence(
          trace.metrics
        ).toFixed(2)} |`
      );
      lines.push(
        `| Overall Quality | ${this.calculateOverallQuality(
          trace.metrics
        ).toFixed(2)} |`
      );
      lines.push("");
    }

    // Beat breakdown
    lines.push("## Beat Breakdown");
    lines.push("");

    const beatSpans = trace.spans.filter(
      (s) => s.eventType === NarrativeEventType.BEAT_CREATED
    );
    for (const span of beatSpans) {
      lines.push(`### Beat: ${span.beatId}`);
      lines.push("");
      if (span.emotionalTone) {
        lines.push(`- **Emotional Tone**: ${span.emotionalTone}`);
      }
      if (span.characterIds.length > 0) {
        lines.push(`- **Characters**: ${span.characterIds.join(", ")}`);
      }
      const leadPerspective = getSpanLeadPerspective(span);
      if (leadPerspective) {
        lines.push(`- **Lead Perspective**: ${leadPerspective}`);
      }
      lines.push("");
    }

    // Correlation path
    if (trace.correlation && trace.correlation.correlationPath.length > 0) {
      lines.push("## System Correlation");
      lines.push("");
      lines.push(`Path: ${trace.correlation.correlationPath.join(" → ")}`);
      lines.push("");
    }

    // Story preview
    if (trace.storyContent) {
      lines.push("## Story Preview");
      lines.push("");
      lines.push("```");
      const preview =
        trace.storyContent.length > 1000
          ? trace.storyContent.substring(0, 1000) + "..."
          : trace.storyContent;
      lines.push(preview);
      lines.push("```");
    }

    return lines.join("\n");
  }

  // ===========================================================================
  // METRICS EXTRACTION
  // ===========================================================================

  /**
   * Extract narrative metrics from a completed trace
   */
  extractStoryMetrics(trace: CompletedTrace): NarrativeMetrics {
    if (trace.metrics) {
      return trace.metrics;
    }

    const metrics = createNarrativeMetrics();

    // Count beats
    metrics.beatsGenerated = trace.spans.filter(
      (s) => s.eventType === NarrativeEventType.BEAT_CREATED
    ).length;

    // Count enrichments
    metrics.enrichmentsApplied = trace.spans.filter(
      (s) => s.eventType === NarrativeEventType.BEAT_ENRICHED
    ).length;

    // Count gaps
    metrics.gapsRemediated = trace.spans.filter(
      (s) => s.eventType === NarrativeEventType.GAP_REMEDIATED
    ).length;

    // Count routing decisions
    metrics.routingDecisions = trace.spans.filter(
      (s) => s.eventType === NarrativeEventType.ROUTING_DECISION
    ).length;

    // Calculate average coherence from three-perspective analyses
    // (current and legacy event-type values)
    const perspectiveSpans = trace.spans.filter((s) =>
      isThreePerspectiveAnalysisEvent(s.eventType)
    );
    if (perspectiveSpans.length > 0) {
      const coherences = perspectiveSpans
        .filter((s) => s.outputData)
        .map((s) => (s.outputData as any)?.coherence_score ?? 0.5);
      if (coherences.length > 0) {
        metrics.crossPerspectiveCoherence =
          coherences.reduce((a, b) => a + b, 0) / coherences.length;
      }
    }

    // Timing
    metrics.totalGenerationTimeMs = trace.durationMs;
    if (metrics.beatsGenerated > 0) {
      metrics.averageBeatTimeMs = trace.durationMs / metrics.beatsGenerated;
    }

    return metrics;
  }

  /**
   * Extract character arc data from trace
   */
  private extractCharacterArcs(trace: CompletedTrace): StoryArcVisualization {
    const viz: StoryArcVisualization = {
      characterArcs: {},
      emotionalBeats: [],
      themeMentions: {},
    };

    // Find character arc update spans
    const arcSpans = trace.spans.filter(
      (s) => s.eventType === NarrativeEventType.CHARACTER_ARC_UPDATED
    );

    for (const span of arcSpans) {
      if (span.characterIds.length > 0) {
        const charId = span.characterIds[0];
        if (!(charId in viz.characterArcs)) {
          viz.characterArcs[charId] = [];
        }

        if (span.outputData && "arc_position_after" in span.outputData) {
          viz.characterArcs[charId].push(
            span.outputData.arc_position_after as number
          );
        }
      }
    }

    // Extract emotional beats
    const beatSpans = trace.spans.filter(
      (s) =>
        s.eventType === NarrativeEventType.BEAT_CREATED && s.emotionalTone
    );
    viz.emotionalBeats = beatSpans
      .map((s) => s.emotionalTone!)
      .filter((t) => t !== undefined);

    return viz;
  }

  // ===========================================================================
  // IMPROVEMENT SUGGESTIONS
  // ===========================================================================

  /**
   * Generate suggestions for narrative improvement based on metrics
   */
  generateImprovementSuggestions(metrics: NarrativeMetrics): string[] {
    const suggestions: string[] = [];

    // Coherence suggestions
    if (metrics.coherenceScore < 0.6) {
      suggestions.push(
        "🔍 Low coherence detected. Consider adding transition beats " +
          "to improve flow between scenes."
      );
    }

    // Emotional arc suggestions
    if (metrics.emotionalArcStrength < 0.5) {
      suggestions.push(
        "💓 Emotional arc is weak. Try adding beats with stronger " +
          "emotional contrast or character reactions."
      );
    }

    // Theme clarity suggestions
    if (metrics.themeClarity < 0.6) {
      suggestions.push(
        "🎨 Themes are unclear. Consider reinforcing thematic elements " +
          "through dialogue or symbolic actions."
      );
    }

    // Cross-perspective coherence suggestions
    if (getCrossPerspectiveCoherence(metrics) < 0.5) {
      suggestions.push(
        "🌌 Three-perspective alignment is low. Review if Engineer, Ceremony, " +
          "and Story Engine perspectives are all represented."
      );
    }

    // Enrichment suggestions
    if (metrics.enrichmentsApplied < metrics.beatsGenerated * 0.3) {
      suggestions.push(
        "✨ Few beats were enriched. Consider running more beats through " +
          "specialized flows for quality improvement."
      );
    }

    // Character arc suggestions
    const incompleteArcs = Object.entries(metrics.characterArcCompletion)
      .filter(([_, completion]) => completion < 0.6)
      .map(([charId, _]) => charId);

    if (incompleteArcs.length > 0) {
      suggestions.push(
        `🎭 Characters with incomplete arcs: ${incompleteArcs.join(", ")}. ` +
          "Add beats that advance their personal journeys."
      );
    }

    // Performance suggestions
    if (metrics.averageBeatTimeMs > 5000) {
      suggestions.push(
        "⚡ Beat generation is slow. Consider optimizing prompts or " +
          "using faster model variants for initial drafts."
      );
    }

    // If everything looks good
    if (suggestions.length === 0) {
      suggestions.push(
        "✅ Narrative metrics look healthy! The story maintains good " +
          "coherence, emotional arc, and thematic clarity."
      );
    }

    return suggestions;
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private calculateOverallQuality(metrics: NarrativeMetrics): number {
    const weights = {
      coherence: 0.25,
      emotionalArc: 0.2,
      themeClarity: 0.15,
      crossPerspective: 0.2,
      characterArc: 0.2,
    };

    const arcValues = Object.values(metrics.characterArcCompletion);
    const avgCharacterArc =
      arcValues.length > 0
        ? arcValues.reduce((a, b) => a + b, 0) / arcValues.length
        : 0.5;

    return (
      metrics.coherenceScore * weights.coherence +
      metrics.emotionalArcStrength * weights.emotionalArc +
      metrics.themeClarity * weights.themeClarity +
      getCrossPerspectiveCoherence(metrics) * weights.crossPerspective +
      avgCharacterArc * weights.characterArc
    );
  }
}
