# 🌿 avalangstack

**Ava's LangStack: chain primitives and the graph engines that compose them, for Ceremonial Technology Oriented Development.**

For a while my libraries lived apart, each one tucked inside a fork of [langchainjs](https://github.com/langchain-ai/langchainjs) or [langgraphjs](https://github.com/langchain-ai/langgraphjs). The chains decompose a prompt through the Four Directions, trace a narrative, route an inquiry, and hold relational accountability. The graphs compose those chains into pipelines that know when to stop and wait for a human. They belong together, so here they are.

Served at **[avalangstack.sanctuaireagentique.com](https://avalangstack.sanctuaireagentique.com)**.

```
avalangstack/
├── chains/    LangChain.js primitives    ava-langchain-*    0.1.x
└── graphs/    LangGraph.js engines       ava-langgraph-*    0.2.x    consume chains/
```

Every folder still publishes under the npm name you already install.

## Chains — [`chains/`](chains)

| Folder | npm | What it holds |
|---|---|---|
| [`prompt-decomposition`](chains/prompt-decomposition) | `ava-langchain-prompt-decomposition` | Four Directions PDE primitives — decomposes prompts through Medicine Wheel directions |
| [`inquiry-routing`](chains/inquiry-routing) | `ava-langchain-inquiry-routing` | Inquiry routing with directional classification and confidence scoring |
| [`relational-intelligence`](chains/relational-intelligence) | `ava-langchain-relational-intelligence` | Indigenous relational paradigm — MedicineWheelFilter, StructuralTensionChain, FireKeeper |
| [`narrative-tracing`](chains/narrative-tracing) | `ava-langchain-narrative-tracing` | Langfuse-based narrative observability with EpisodeBundler and PolyphonicParser |
| [`state-machine-spec`](chains/state-machine-spec) | `ava-langchain-state-machine-spec` | Declarative workflow specs with accountability-as-routing |

## Graphs — [`graphs/`](graphs)

| Folder | npm | Consumes from `chains/` | What it holds |
|---|---|---|---|
| [`prompt-decomposition-engine`](graphs/prompt-decomposition-engine) | `ava-langgraph-prompt-decomposition-engine` | prompt-decomposition, relational-intelligence | Graph-orchestrated prompt decomposition with multi-perspective analysis and ceremony gating |
| [`inquiry-routing-engine`](graphs/inquiry-routing-engine) | `ava-langgraph-inquiry-routing-engine` | inquiry-routing, prompt-decomposition | Inquiry routing as a LangGraph StateGraph with relational accountability gating |
| [`narrative-intelligence`](graphs/narrative-intelligence) | `ava-langgraph-narrative-intelligence` | — | Three-universe processing — narrative coherence, emotional beats, unified state |

While they live here, graphs never take a chain from npm. `pnpm install` links every `ava-langchain-*` range the local chain satisfies, and `pnpm check:consumption` fails when a graph resolves a chain from anywhere but `chains/`. A graph release builds the chains, runs that check, then builds and tests the graphs against them.

## Working here

```bash
pnpm install
pnpm build                       # chains in dependency order, then graphs
pnpm test
pnpm check:consumption           # every graph -> chain link points into chains/
pnpm docs:dev                    # the documentation site, locally
pnpm llms                        # regenerate llms.txt and llms-full.txt
pnpm llms:check                  # fails when they are stale

DRY_RUN=1 ./release.sh graph     # build chains, check links, build + test graphs, pack — publishes nothing
./release.sh chain patch         # the five ava-langchain-* packages, one shared version
./release.sh graph patch         # the three ava-langgraph-* packages, one shared version
```

## Documentation, specs and lineage

| Where | What |
|---|---|
| [`docs/`](docs) | The VitePress site served at [avalangstack.sanctuaireagentique.com](https://avalangstack.sanctuaireagentique.com): a page per library under [`docs/chains/`](docs/chains) and [`docs/graphs/`](docs/graphs) |
| [`docs/rispecs/`](docs/rispecs) | The RISE specifications, split the way the code is: [`chains/`](docs/rispecs/chains) and [`graphs/`](docs/rispecs/graphs) |
| [`docs/kinship/`](docs/kinship) | The kinship records each family wrote when they lived apart: what each place tends, offers, and depends on |
| [`stc/`](stc) | Structural tension notes carried over from ava-langchainjs |
| [`llms.txt`](llms.txt), [`llms-full.txt`](llms-full.txt) | Written by `pnpm llms` from the libraries themselves, and served at `/llms.txt` and `/llms-full.txt` |

## Where this came from

Moved here on 2026-09-14 from the `libs/` folders of [avadisabelle/ava-langchainjs](https://github.com/avadisabelle/ava-langchainjs) at `79b090433` (now `chains/`) and [avadisabelle/ava-langgraphjs](https://github.com/avadisabelle/ava-langgraphjs) at `d7c8bf2d` (now `graphs/`). Both forks are archived with their full history, and the issue numbers in code comments (such as `ava-langgraphjs#8`) point into them.

Part of the [Sanctuaire Agentique](https://avadisabelle.sanctuaireagentique.com). Made visible in [Ava-Decomposer-Studio](https://github.com/avadisabelle/Ava-Decomposer-Studio).
