/**
 * Dispatch Formatter
 *
 * Formats validated inquiries for actual dispatch to source channels:
 * - QMD Local: lex/vec/hyde semantic search queries
 * - Deep Search Academic: structured academic retrieval
 * - Workspace Scan: glob/grep patterns for codebase exploration
 *
 * Each formatter produces a channel-specific query structure
 * that downstream consumers can execute directly.
 */

import type { Inquiry } from "ava-langchain-inquiry-routing";
import { DIRECTION_LABELS } from "../constants.js";

// =============================================================================
// Types
// =============================================================================

export interface QmdSearchQuery {
  mode: "lex" | "vec" | "hyde";
  query: string;
  direction: string;
  context?: string;
}

export interface QmdDispatch {
  inquiryId: string;
  searches: QmdSearchQuery[];
  direction: string;
  directionalLabel: string;
}

export interface DeepSearchDispatch {
  inquiryId: string;
  query: string;
  academicContext: string;
  direction: string;
  searchTerms: string[];
  twoEyedSeeing: {
    indigenous?: string;
    western?: string;
  };
}

export interface WorkspaceScanDispatch {
  inquiryId: string;
  globPatterns: string[];
  grepPatterns: string[];
  direction: string;
  scope: string;
}

export type FormattedDispatch = QmdDispatch | DeepSearchDispatch | WorkspaceScanDispatch;

// =============================================================================
// DispatchFormatter
// =============================================================================

export class DispatchFormatter {
  /**
   * Format an inquiry for QMD local semantic search.
   * Produces multiple search strategies (lex, vec, hyde) for coverage.
   */
  formatForQmd(inquiry: Inquiry): QmdDispatch {
    const searches: QmdSearchQuery[] = [];
    const query = inquiry.query;

    // Lexical search — good for exact term matching
    searches.push({
      mode: "lex",
      query,
      direction: inquiry.direction,
      context: inquiry.relational_context || undefined,
    });

    // Vector search — good for semantic similarity
    searches.push({
      mode: "vec",
      query,
      direction: inquiry.direction,
      context: inquiry.relational_context || undefined,
    });

    // HyDE search — good for complex/abstract queries
    if (query.length > 50 || query.includes("?")) {
      searches.push({
        mode: "hyde",
        query,
        direction: inquiry.direction,
        context: inquiry.relational_context || undefined,
      });
    }

    return {
      inquiryId: inquiry.id,
      searches,
      direction: inquiry.direction,
      directionalLabel: DIRECTION_LABELS[inquiry.direction] ?? inquiry.direction,
    };
  }

  /**
   * Format an inquiry for deep-search academic retrieval.
   * Extracts search terms and adds Two-Eyed Seeing context.
   */
  formatForDeepSearch(inquiry: Inquiry): DeepSearchDispatch {
    const searchTerms = this.extractSearchTerms(inquiry.query);

    return {
      inquiryId: inquiry.id,
      query: inquiry.query,
      academicContext: [
        inquiry.relational_context,
        inquiry.accountability,
      ].filter(Boolean).join(" — "),
      direction: inquiry.direction,
      searchTerms,
      twoEyedSeeing: {
        indigenous: inquiry.indigenous_lens || undefined,
        western: inquiry.western_lens || undefined,
      },
    };
  }

  /**
   * Format an inquiry for workspace scanning.
   * Produces glob and grep patterns for codebase exploration.
   */
  formatForWorkspaceScan(inquiry: Inquiry): WorkspaceScanDispatch {
    const terms = this.extractSearchTerms(inquiry.query);
    const globPatterns: string[] = [];
    const grepPatterns: string[] = [];

    // Generate glob patterns from key terms
    for (const term of terms.slice(0, 5)) {
      const sanitized = term.replace(/[^a-zA-Z0-9_-]/g, "");
      if (sanitized.length > 2) {
        globPatterns.push(`**/*${sanitized}*`);
        globPatterns.push(`**/*${sanitized}*.{ts,js,md}`);
      }
    }

    // Generate grep patterns
    for (const term of terms.slice(0, 5)) {
      if (term.length > 2) {
        grepPatterns.push(term);
      }
    }

    // Add compound pattern from query
    if (terms.length >= 2) {
      grepPatterns.push(terms.slice(0, 3).join(".*"));
    }

    return {
      inquiryId: inquiry.id,
      globPatterns: [...new Set(globPatterns)],
      grepPatterns: [...new Set(grepPatterns)],
      direction: inquiry.direction,
      scope: inquiry.pde_id ? `pde:${inquiry.pde_id}` : "workspace",
    };
  }

  /**
   * Route an inquiry to its appropriate formatter based on source.
   */
  formatForSource(inquiry: Inquiry): FormattedDispatch {
    switch (inquiry.source) {
      case "qmd-local":
        return this.formatForQmd(inquiry);
      case "deep-search-academic":
        return this.formatForDeepSearch(inquiry);
      case "workspace-scan":
        return this.formatForWorkspaceScan(inquiry);
      default:
        return this.formatForQmd(inquiry);
    }
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private extractSearchTerms(query: string): string[] {
    const stopWords = new Set([
      "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
      "have", "has", "had", "do", "does", "did", "will", "would", "could",
      "should", "may", "might", "can", "shall", "must", "need", "dare",
      "to", "of", "in", "for", "on", "with", "at", "by", "from", "as",
      "into", "through", "during", "before", "after", "above", "below",
      "between", "out", "off", "over", "under", "again", "further",
      "then", "once", "here", "there", "when", "where", "why", "how",
      "all", "each", "every", "both", "few", "more", "most", "other",
      "some", "such", "no", "not", "only", "same", "so", "than", "too",
      "very", "just", "because", "but", "and", "or", "if", "while",
      "about", "against", "this", "that", "these", "those", "what", "which",
    ]);

    return query
      .toLowerCase()
      .replace(/[^\w\s-]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));
  }
}
