# Inquiry Routing Engine

inquiry-routing-engine: A graph-level orchestration engine that wraps ava-langchain-inquiry-routing primitives into a four-directional state machine (Generate, Route, Validate, Dispatch), adding relational accountability gating and LangGraph StateGraph integration.

---

## Discover on npm

[View `inquiry-routing-engine` on npmjs.com](https://www.npmjs.com/package/inquiry-routing-engine)

---

## Desired Outcome

A graph-level orchestration engine that wraps the `ava-langchain-inquiry-routing` chain primitives into a state machine with four directional nodes — EAST(Generate) → SOUTH(Route) → WEST(Validate) → NORTH(Dispatch) — adding relational accountability gating (`ceremony_hold`), multi-channel dispatch formatting, and LangGraph `StateGraph` integration as a compilable subgraph.
Consumers invoke `InquiryRoutingGraph.invoke(decomposition)` and receive a fully processed `InquiryRoutingState` with dispatch-ready payloads for QMD, deep-search, and workspace-scan channels.

## Structural Tension

Chain primitives produce *components*; agentic workflows need *orchestrated state machines* with accountability gates. The tension between primitive flexibility and pipeline safety resolves through a four-node graph with `ceremony_hold` as a structural pause — the system stops itself when relational integrity requires human presence.
