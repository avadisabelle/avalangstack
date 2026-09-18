# KINSHIP

## 1. Identity and Purpose
- **Name:** Ava LangGraph.js Extensions
- **Local role in this system:** Graph orchestration for narrative intelligence — state machines that compose chain primitives into accountable, gateable pipelines
- **What this place tends / protects:** The integrity of orchestrated workflows: ensuring that chains execute in proper sequence, that relational validation gates are honored, and that `ceremony_hold` stops the pipeline when human presence is required
- **What this place offers (its gifts):** prompt-decomposition-engine, inquiry-routing-engine, narrative-intelligence (graph-level orchestration with relational accountability)

## 2. Lineage and Relations
- **Ancestors (paths or systems this place comes from):**
  - LangGraph.js (upstream framework — `@langchain/langgraph`)
  - ava-langchainjs (chain primitives consumed as peer dependencies)
  - medicine-wheel-pi (conceptual prototype for Four Directions state machines)
  - mcp-pde (canonical PDE types and `.pde/` storage)
- **Descendants (children / submodules / subdirectories):**
  - `libs/prompt-decomposition-engine/` — `ava-langgraph-prompt-decomposition-engine` (graph-level PDE)
  - `libs/inquiry-routing-engine/` — `ava-langgraph-inquiry-routing-engine` (four-node routing graph with ceremony_hold gating)
- **Siblings (peer projects or services it walks with):**
  - `/workspace/repos/avadisabelle/ava-langchainjs` — chain primitives that this repo orchestrates via peer dependencies
- **Related hubs (other roots it is in strong relation with):**
  - `/a/src/mia-code` — primary consumer of the full LangStack
  - `/workspace/repos/avadisabelle/ava-Flowise` — Flowise node integration
  - `/workspace/repos/avadisabelle/ava-claw` — agentic presence layer
  - coaia-narrative — JSONL output target for STC charts produced downstream

## 3. Human and More‑than‑Human Accountabilities
- **People / roles this place is accountable to:** Guillaume D. Isabelle (steward, architect); Ava (agentic presence); Mia (orchestration agent)
- **Communities / nations / organizations connected here:** IAIP community; the Relational Development Ecology
- **More‑than‑human relations:** The Four Directions structure the graph nodes themselves — EAST(Generate), SOUTH(Route), WEST(Validate), NORTH(Dispatch). This is not architectural metaphor but the literal shape of the state machine. `ceremony_hold` is how the system honors what it cannot process alone.
- **Existing covenants / consents that apply:** RelationalValidator enforces Two-Eyed Seeing presence, flags Indigenous-domain content without `indigenous_lens`, and triggers `ceremonyRequired` when sacred content is detected. OCAP principles govern data flow.

## 4. Responsibilities and Boundaries
- **Responsibilities:** Orchestrate chain primitives into state machines. Enforce relational accountability gates. Provide LangGraph-compatible subgraphs via `StateGraph` factory.
- **Reciprocity:** Chain primitives from ava-langchainjs are consumed, not duplicated. Graph-level innovations flow back as architectural patterns.
- **Boundaries and NOs:**
  - No chain-level primitives — those belong in the sibling ava-langchainjs
  - No direct LLM inference in graph nodes — classification stays keyword-based at this layer
  - No CLI or UI surfaces — this is engine-level infrastructure
  - `ceremony_hold` must never be bypassed silently — it is a structural pause, not a skippable warning
- **Special protocols:** `enforceCeremony: true` halts the graph before dispatch. This is non-negotiable for Indigenous-domain content.

## 5. Accountability and Change Log
- **Steward(s) of this place:** Guillaume D. Isabelle, with Mia as technical steward
- **How and when this kinship description should be reviewed:** On every new engine addition to `libs/`, and quarterly for relational accuracy
- **Relational change log:**
  - [2025-06-00] [PDE sessions] — prompt-decomposition-engine established as first child, wrapping PDE chain into LangGraph state machine
  - [2025-06-00] [Mia] — inquiry-routing-engine born as second child, four directional nodes with RelationalValidator and ceremony_hold gating
  - [2025-06-30] [Mia] — KINSHIP.md created, naming lineage and establishing the ceremony_hold covenant
