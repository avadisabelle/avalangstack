/**
 * LangGraph StateGraph Factory for PDE
 *
 * Creates a proper LangGraph StateGraph that can be compiled and used
 * as a subgraph in larger graph workflows.
 *
 * Requires @langchain/langgraph as a peer dependency.
 *
 * @example
 * ```typescript
 * import { createDecompositionGraph } from "ava-langgraph-prompt-decomposition-engine/graphs";
 *
 * // Create and compile the graph
 * const graph = createDecompositionGraph();
 * const compiled = graph.compile();
 *
 * // Invoke
 * const result = await compiled.invoke({ prompt: "Build a knowledge graph..." });
 *
 * // Use as a subgraph
 * const parentGraph = new StateGraph({ ... })
 *   .addNode("decompose", compiled)
 *   .addEdge(START, "decompose");
 * ```
 */

import type { DecompositionState } from "./decomposition_graph.js";
import {
  createInitialState,
  eastNode,
  southNode,
  westNode,
  northNode,
} from "./decomposition_graph.js";

export interface StateGraphFactoryOptions {
  /** If true, halt at ceremony_hold instead of continuing */
  enforceCeremony?: boolean;
}

/**
 * Creates a LangGraph StateGraph for the PDE pipeline.
 *
 * Returns a configured StateGraph that can be compiled. Requires
 * @langchain/langgraph to be installed.
 *
 * The graph follows EAST → SOUTH → WEST → (ceremony check) → NORTH flow.
 */
export async function createDecompositionStateGraph(options?: StateGraphFactoryOptions) {
  // Dynamic import — use literal string with @vite-ignore to prevent Vite from resolving during build
  let StateGraph: any, END: any, START: any;
  try {
    const mod = await import(/* @vite-ignore */ "@langchain/langgraph");
    StateGraph = mod.StateGraph;
    END = mod.END;
    START = mod.START;
  } catch {
    throw new Error(
      "createDecompositionStateGraph requires @langchain/langgraph. " +
      "Install it with: npm install @langchain/langgraph"
    );
  }

  const enforceCeremony = options?.enforceCeremony ?? false;

  // Define state channels — using plain object since Annotation is dynamically imported
  const channels: Record<string, any> = {
    prompt: { default: () => "" },
    sessionId: { default: () => "" },
    directionalAnalysis: { default: () => null },
    intentResult: { default: () => null },
    dependencyGraph: { default: () => null },
    executionOrder: { default: () => null },
    wheelEnriched: { default: () => null },
    ceremonyRequired: { default: () => false },
    relationalGuidance: {
      default: () => [] as string[],
      // Accumulate across nodes rather than last-write-wins.
      // Fixes: avadisabelle/ava-langgraphjs#8
      value: (prev: string[], next: string[]) => [...prev, ...next],
    },
    decomposition: { default: () => null },
    strategyMetadata: { default: () => null },
    decompositionWithProvenance: { default: () => null },
    stored: { default: () => null },
    status: { default: () => "pending" },
    errors: {
      default: () => [] as string[],
      // Accumulate across nodes rather than last-write-wins.
      // Fixes: avadisabelle/ava-langgraphjs#8
      value: (prev: string[], next: string[]) => [...prev, ...next],
    },
  };

  const graph = new StateGraph({ channels })
    .addNode("east", async (state: any) => {
      return await eastNode(state);
    })
    .addNode("south", (state: any) => {
      return southNode(state);
    })
    .addNode("west", (state: any) => {
      return westNode(state);
    })
    .addNode("north", (state: any) => {
      return northNode(state);
    })
    .addEdge(START, "east")
    .addEdge("east", "south")
    .addEdge("south", "west")
    .addConditionalEdges("west", (state: any) => {
      if (state.status === "ceremony_hold" && enforceCeremony) {
        return END;
      }
      return "north";
    })
    .addEdge("north", END);

  return graph;
}
