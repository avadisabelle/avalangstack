# Getting Started with AvaLangStack

AvaLangStack is two families of libraries. The **chains** are LangChain.js primitives: they decompose a prompt through the Four Directions, route an inquiry, trace a narrative, hold relational accountability, and declare a workflow. The **graphs** compose those chains into LangGraph.js state machines that gate on ceremony and stop when human presence is needed.

Every package keeps the npm name it has always had.

## Install

Chains:

```bash
npm install ava-langchain-prompt-decomposition
npm install ava-langchain-relational-intelligence
npm install ava-langchain-narrative-tracing
npm install ava-langchain-inquiry-routing
npm install ava-langchain-state-machine-spec
```

Graphs (they expect the chains they compose as peers, plus `@langchain/langgraph`):

```bash
npm install ava-langgraph-prompt-decomposition-engine
npm install ava-langgraph-inquiry-routing-engine
npm install ava-langgraph-narrative-intelligence
```

`pnpm add` and `yarn add` work the same way.

## Which package do I start with?

| You want to | Start at |
|---|---|
| Turn a prompt into structured intents through the Four Directions | [Prompt Decomposition](/chains/prompt-decomposition) |
| Take a decomposition and route inquiries by direction | [Inquiry Routing](/chains/inquiry-routing) |
| Filter, weigh and gate work with relational accountability | [Relational Intelligence](/chains/relational-intelligence) |
| See what your system did, as a narrative | [Narrative Tracing](/chains/narrative-tracing) |
| Declare a workflow and validate it as a graph | [State Machine Spec](/chains/state-machine-spec) |
| Run decomposition as an orchestrated state machine | [Prompt Decomposition Engine](/graphs/prompt-decomposition-engine) |
| Run inquiry routing as a gated LangGraph StateGraph | [Inquiry Routing Engine](/graphs/inquiry-routing-engine) |
| Process events through Engineer, Ceremony and Story perspectives | [Narrative Intelligence](/graphs/narrative-intelligence) |

Each page documents that package's own API and examples. The [RISE specifications](/rispecs/) say what each package is meant to create, and why.

## Working in this repository

```bash
git clone https://github.com/avadisabelle/avalangstack
cd avalangstack
pnpm install
pnpm build                # chains in dependency order, then graphs
pnpm test
pnpm check:consumption    # every graph resolves its chains from chains/
pnpm docs:dev             # this site, locally
```

Releases move one family at a time, each on its own version line:

```bash
DRY_RUN=1 ./release.sh graph    # build chains, check links, build and test graphs, pack
./release.sh chain patch
./release.sh graph patch
```

## For agents

`llms.txt` and `llms-full.txt` sit at the repository root and are served at [/llms.txt](/llms.txt) and [/llms-full.txt](/llms-full.txt). Regenerate them with `pnpm llms` after changing a package README, and `pnpm llms:check` fails when they are stale.
