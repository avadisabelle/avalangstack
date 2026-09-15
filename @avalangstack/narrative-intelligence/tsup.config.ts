import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "schemas/index": "src/schemas/index.ts",
    "graphs/index": "src/graphs/index.ts",
    "nodes/index": "src/nodes/index.ts",
    "integrations/index": "src/integrations/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
});
