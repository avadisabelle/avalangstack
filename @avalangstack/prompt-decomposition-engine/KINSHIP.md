# KINSHIP — prompt-decomposition-engine (LangGraph.js)

## Relationship to miadi-code PDE

`miadi-code` (`/src/Miadi/miadi-code/src/pde/`) builds on this package as a dependency and extends it with:

- **LLM-enhanced intent extraction** (`llm-intent-extractor.ts`) — uses miadi-code's multi-engine runner (claude, gemini, copilot, ollama) for semantic Layer 1 extraction instead of keyword matching
- **`decomposePromptWithLLM()`** — async decomposition that uses LLM for Layer 1, then feeds into the same deterministic Layers 2-5

### Extraction Path (future)

When the LLM-enhanced pattern is proven in miadi-code, the intent is to:
1. Extract a generic `LLMIntentExtractor` into `ava-langchain-prompt-decomposition` as an optional LLM-backed alternative
2. Wire it into this package's `eastNode()` as a configurable option
3. Keep the keyword extractors as deterministic fallback

### Shared Types

This package's `DecompositionState`, `DirectionalAnalysis`, `IntentExtractionResult` types align with miadi-code's `pde-types.ts`. Convergence target: single source of truth in this package.

## Related

- `/src/mcp-pde` — MCP server wrapping the LLM decomposition prompt (proven system prompt in `prompts.ts`)
- `/src/mcp-pde-gemini` — Independent gemini-cli executor pattern
- `/workspace/repos/jgwill/medicine-wheel/src/prompt-decomposition/` — Medicine Wheel Developer Suite variant
