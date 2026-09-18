# RISE Specifications

RISE is **Reverse Engineering, Intent, Specifications, Exportation**: read the thing that exists, name the intent it serves, write the specification that intent implies, then export it so others can build from it. These specifications describe what each library is meant to create, not only what its code currently does.

They arrived here with their libraries when ava-langchainjs and ava-langgraphjs were folded into this repository, and they keep the split the code keeps: chains and graphs.

## Chains

| Specification | Library |
|---|---|
| [Prompt Decomposition](/rispecs/chains/prompt-decomposition/prompt-decomposition.spec) | `ava-langchain-prompt-decomposition` |
| [miaco PDE tree lineage](/rispecs/chains/prompt-decomposition/miaco-pde-tree-lineage.spec) | `ava-langchain-prompt-decomposition` |
| [Relational Intelligence](/rispecs/chains/relational-intelligence/relational-intelligence.spec) | `ava-langchain-relational-intelligence` |
| [Narrative Tracing](/rispecs/chains/narrative-tracing/narrative-tracing.spec) | `ava-langchain-narrative-tracing` |
| [Inquiry Routing (01)](/rispecs/chains/01-inquiry-routing.spec) | `ava-langchain-inquiry-routing` |
| [QMD inquiry execution](/rispecs/chains/inquiry-routing/qmd-inquiry-execution.spec) | `ava-langchain-inquiry-routing` |
| [State Machine Spec](/rispecs/chains/state-machine-spec/state-machine-spec.spec) | `ava-langchain-state-machine-spec` |

## Graphs

| Specification | Library |
|---|---|
| [Prompt Decomposition Engine](/rispecs/graphs/prompt-decomposition-engine/prompt-decomposition-engine.spec) | `ava-langgraph-prompt-decomposition-engine` |
| [miaco PDE tree storage](/rispecs/graphs/prompt-decomposition-engine/miaco-pde-tree-storage.spec) | `ava-langgraph-prompt-decomposition-engine` |
| [Inquiry Routing Engine (01)](/rispecs/graphs/01-inquiry-routing-engine.spec) | `ava-langgraph-inquiry-routing-engine` |
| [Strategy-aware routing](/rispecs/graphs/inquiry-routing-engine/strategy-aware-routing.spec) | `ava-langgraph-inquiry-routing-engine` |
| [QMD inquiry execution engine](/rispecs/graphs/inquiry-routing-engine/qmd-inquiry-execution-engine.spec) | `ava-langgraph-inquiry-routing-engine` |
| [Narrative Intelligence](/rispecs/graphs/narrative-intelligence/narrative-intelligence.spec) | `ava-langgraph-narrative-intelligence` |

## Kinship

Each family also carries a kinship record, written when the libraries lived apart: [chains](/kinship/chains) and [graphs](/kinship/graphs). They name what each place tends, what it offers, and which relations it depends on.
