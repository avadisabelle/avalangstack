# SPEC - Strategy-Aware Inquiry Routing

> Package: `ava-langgraph-inquiry-routing-engine`
> Upstream contract: `DecompositionWithProvenance`
> Status: implemented in package source

## Desired Outcome

Inquiry routing accepts both the stable legacy `DecompositionResult` contract
and the enriched strategic handoff produced by the prompt decomposition graph.
Strategy provenance remains available throughout routing, and multi-pass
disagreements become explicit validation work.

## Specification

WHEN a legacy `DecompositionResult` is supplied
THE SYSTEM SHALL preserve existing generation, routing, validation, and dispatch behavior.

WHEN a `DecompositionWithProvenance` is supplied
THE SYSTEM SHALL preserve its strategy metadata in `InquiryRoutingState`.

WHEN strategy metadata contains multi-pass disagreements
THE SYSTEM SHALL generate one WEST validation inquiry per disagreement and include those inquiries in routing, relational validation, and dispatch.

WHEN a disagreement is generated
THE SYSTEM SHALL retain PDE traceability, use QMD local validation as its initial source, and scale confidence by disagreement severity.

## Acceptance

- Legacy routing tests remain unchanged and pass.
- Enriched input preserves strategy metadata.
- Multi-pass disagreements increase the inquiry total and appear in WEST.
- Generated validation inquiries survive the complete dispatch pipeline.
