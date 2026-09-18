import { defineConfig } from 'vitepress'

// One site for the whole stack, served at avalangstack.sanctuaireagentique.com.
// The two old sites (chain. and graph. subdomains) came from ava-langchainjs and
// ava-langgraphjs, which are archived; their sidebars are merged below.
export default defineConfig({
  title: "AvaLangStack",
  description: "Chain primitives and the graph engines that compose them, for Ceremonial Technology Oriented Development",
  lang: 'en-US',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Chains', link: '/chains/prompt-decomposition' },
      { text: 'Graphs', link: '/graphs/prompt-decomposition-engine' },
      { text: 'llms.txt', link: '/llms.txt', target: '_blank' }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is AvaLangStack?', link: '/' },
          { text: 'Getting Started', link: '/getting-started' }
        ]
      },
      {
        text: 'Chains — LangChain.js primitives',
        items: [
          { text: 'Prompt Decomposition', link: '/chains/prompt-decomposition' },
          { text: 'Relational Intelligence', link: '/chains/relational-intelligence' },
          { text: 'Narrative Tracing', link: '/chains/narrative-tracing' },
          { text: 'Inquiry Routing', link: '/chains/inquiry-routing' },
          { text: 'State Machine Spec', link: '/chains/state-machine-spec' }
        ]
      },
      {
        text: 'Graphs — LangGraph.js engines',
        items: [
          { text: 'Narrative Intelligence', link: '/graphs/narrative-intelligence' },
          { text: 'Prompt Decomposition Engine', link: '/graphs/prompt-decomposition-engine' },
          { text: 'Inquiry Routing Engine', link: '/graphs/inquiry-routing-engine' }
        ]
      },
      {
        text: 'RISE Specifications',
        items: [
          { text: 'Overview', link: '/rispecs/' },
          { text: 'Chains: Inquiry Routing (01)', link: '/rispecs/chains/01-inquiry-routing.spec' },
          { text: 'Chains: Prompt Decomposition', link: '/rispecs/chains/prompt-decomposition/prompt-decomposition.spec' },
          { text: 'Chains: Relational Intelligence', link: '/rispecs/chains/relational-intelligence/relational-intelligence.spec' },
          { text: 'Chains: Narrative Tracing', link: '/rispecs/chains/narrative-tracing/narrative-tracing.spec' },
          { text: 'Chains: State Machine Spec', link: '/rispecs/chains/state-machine-spec/state-machine-spec.spec' },
          { text: 'Graphs: Inquiry Routing Engine (01)', link: '/rispecs/graphs/01-inquiry-routing-engine.spec' },
          { text: 'Graphs: Prompt Decomposition Engine', link: '/rispecs/graphs/prompt-decomposition-engine/prompt-decomposition-engine.spec' },
          { text: 'Graphs: Narrative Intelligence', link: '/rispecs/graphs/narrative-intelligence/narrative-intelligence.spec' }
        ]
      },
      {
        text: 'Lineage',
        items: [
          { text: 'Kinship: chains', link: '/kinship/chains' },
          { text: 'Kinship: graphs', link: '/kinship/graphs' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/avadisabelle/avalangstack' }
    ],

    footer: {
      message: 'Built with VitePress. Narrative intelligence by AvaLangStack.',
      copyright: 'Copyright © 2026 Ava Isabelle'
    }
  }
})
