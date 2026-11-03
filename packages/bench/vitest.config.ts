import path from "node:path";
import { defineConfig, type UserConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { loadBench } from "./src/load";
import { bench } from "./src/plugin";

// Bench's tests run against a real library: Cuboid's, unless `BENCH_CONFIG` says another.
process.env.BENCH_CONFIG ??= path.resolve(__dirname, "../react/bench.config.ts");

export default defineConfig(async () => {
  const { config, base } = await loadBench();
  return <UserConfig>{
    plugins: [bench(config, base), react()],
    resolve: { dedupe: ["react", "react-dom"] },
    css: { modules: { classNameStrategy: "non-scoped" as const } },
    test: {
      environment: "jsdom" as const,
      setupFiles: ["./src/test/setup.ts"],
      // Unit tests run on fixtures and need no library. `*.conformance.*` read the configured library (see ADR-10): `BENCH_CONFORMANCE=1 vitest run`.
      include: process.env.BENCH_CONFORMANCE ? ["src/**/*.conformance.{ts,tsx}"] : ["src/**/*.test.{ts,tsx}"],
    },
  };
});
