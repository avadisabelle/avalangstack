# 🌿 avalangstack

**Ava's LangStack: chain primitives and graph engines for Ceremonial Technology Oriented Development, under one roof.**

For a while my libraries lived apart, each one tucked inside a fork of [langchainjs](https://github.com/langchain-ai/langchainjs) or [langgraphjs](https://github.com/langchain-ai/langgraphjs). The chains decompose a prompt through the Four Directions, trace a narrative, route an inquiry, and hold relational accountability. The graphs compose those chains into pipelines that know when to stop and wait for a human. They belong together, so here they are.

Served at **[avalangstack.sanctuaireagentique.com](https://avalangstack.sanctuaireagentique.com)**.

## The libraries

Every folder still publishes under the npm name you already install.

| Folder | npm | Line | What it holds |
|---|---|---|---|
| [`prompt-decomposition`](@avalangstack/prompt-decomposition) | `ava-langchain-prompt-decomposition` | 0.1.x | Four Directions PDE primitives — decomposes prompts through Medicine Wheel directions |
| [`inquiry-routing`](@avalangstack/inquiry-routing) | `ava-langchain-inquiry-routing` | 0.1.x | Inquiry routing with directional classification and confidence scoring |
| [`relational-intelligence`](@avalangstack/relational-intelligence) | `ava-langchain-relational-intelligence` | 0.1.x | Indigenous relational paradigm — MedicineWheelFilter, StructuralTensionChain, FireKeeper |
| [`narrative-tracing`](@avalangstack/narrative-tracing) | `ava-langchain-narrative-tracing` | 0.1.x | Langfuse-based narrative observability with EpisodeBundler and PolyphonicParser |
| [`state-machine-spec`](@avalangstack/state-machine-spec) | `ava-langchain-state-machine-spec` | 0.1.x | Declarative workflow specs with accountability-as-routing |
| [`prompt-decomposition-engine`](@avalangstack/prompt-decomposition-engine) | `ava-langgraph-prompt-decomposition-engine` | 0.2.x | Graph-orchestrated prompt decomposition with multi-perspective analysis and ceremony gating |
| [`inquiry-routing-engine`](@avalangstack/inquiry-routing-engine) | `ava-langgraph-inquiry-routing-engine` | 0.2.x | Inquiry routing as a LangGraph StateGraph with relational accountability gating |
| [`narrative-intelligence`](@avalangstack/narrative-intelligence) | `ava-langgraph-narrative-intelligence` | 0.2.x | Three-universe processing — narrative coherence, emotional beats, unified state |

The first five are the **chain** family and release together. The last three are the **graph** family and release together.

## Working here

```bash
pnpm install
pnpm build                       # every library
pnpm test

DRY_RUN=1 ./release.sh chain     # build, test, check types, load entry points, pack — publishes nothing
./release.sh chain patch         # the five ava-langchain-* packages, one shared version
./release.sh graph patch         # the three ava-langgraph-* packages, one shared version
```

## Where this came from

Moved here on 2026-09-14 from the `libs/` folders of [avadisabelle/ava-langchainjs](https://github.com/avadisabelle/ava-langchainjs) at `79b090433` and [avadisabelle/ava-langgraphjs](https://github.com/avadisabelle/ava-langgraphjs) at `d7c8bf2d`. Both forks are archived with their full history, and the issue numbers in code comments (such as `ava-langgraphjs#8`) point into them.

Part of the [Sanctuaire Agentique](https://avadisabelle.sanctuaireagentique.com). Made visible in [Ava-Decomposer-Studio](https://github.com/avadisabelle/Ava-Decomposer-Studio).
