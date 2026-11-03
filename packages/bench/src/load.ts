import path from "node:path";
import { loadConfigFromFile } from "vite";
import type { BenchConfig } from "./config";

/** The config a run is for: `BENCH_CONFIG` (a path), or `bench.config.ts` in the folder it is run from. */
export async function loadBench(file = process.env.BENCH_CONFIG ?? "bench.config.ts"): Promise<{ config: BenchConfig; base: string; file: string }> {
  const found = path.resolve(file);
  const loaded = await loadConfigFromFile({ command: "serve", mode: "development" }, found);
  if (!loaded) throw new Error(`Bench: no config at ${found}`);
  return { config: loaded.config as unknown as BenchConfig, base: path.dirname(found), file: found };
}

/** Where what is generated is written: `.bench` beside the config, unless it says otherwise. */
export const outOf = (config: BenchConfig, base: string) => path.resolve(base, config.out ?? ".bench");
