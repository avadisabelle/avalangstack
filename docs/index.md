---
layout: home

title: AvaLangStack Documentation
titleTemplate: Chains and graphs, one relational stack

hero:
  name: AvaLangStack
  text: Chains and the graphs that compose them
  tagline: Indigenous relational paradigms for LLM-powered applications
  actions:
    - theme: brand
      text: Get Started →
      link: /getting-started
    - theme: alt
      text: Chains
      link: /chains/prompt-decomposition
    - theme: alt
      text: Graphs
      link: /graphs/prompt-decomposition-engine
    - theme: alt
      text: View on GitHub
      link: https://github.com/avadisabelle/avalangstack

features:
  - icon: 🌿
    title: Indigenous relational paradigms
    details: Medicine Wheel ontology, relational accountability, epistemic spiral tracking, and Fire Keeper coordination as working code, not decoration.
  - icon: ✨
    title: Structural tension as workflow
    details: Current reality and desired outcome held together, with the action steps between them carried through decomposition, routing and validation.
  - icon: 🔗
    title: Five chains, three graphs, one home
    details: The chains are LangChain.js primitives. The graphs compose them into LangGraph.js state machines that know when to stop and wait for a human.
  - icon: 📖
    title: Narrative you can trace
    details: Events carry their story across systems, with semantic tracing, emotional beat classification and narrative coherence analysis.
---

## Where this came from

The chains lived in a fork of langchainjs and the graphs in a fork of langgraphjs. Both forks are archived. The libraries now share one repository, [avadisabelle/avalangstack](https://github.com/avadisabelle/avalangstack), and publish under the same npm names they always had.

While they live together, the graphs are built and tested against the chains in this repository, not against copies from npm. `pnpm check:consumption` fails if a graph resolves a chain from anywhere else.
