#!/usr/bin/env node
// bench dev | build | generate | check: run from the package whose library is shown, which has a `bench.config.ts` (or name one with BENCH_CONFIG).
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [command = "dev", ...rest] = process.argv.slice(2);
const env = { ...process.env, BENCH_CONFIG: path.resolve(process.env.BENCH_CONFIG ?? "bench.config.ts") };

/** Runs a tool from Bench's own folder (where it is installed), leaving `env` to say which library it is for. */
const run = (tool, args) => {
  const { status } = spawnSync("npx", [tool, ...args], { cwd: here, env, stdio: "inherit" });
  if (status) process.exit(status);
};

const vite = path.join(here, "vite.config.ts");
const vitest = path.join(here, "vitest.config.ts");
const generate = () => run("vite-node", [path.join(here, "src/scripts/generate.ts")]);

switch (command) {
  case "generate":
    generate();
    break;
  case "dev":
    generate();
    run("vite", ["--config", vite, ...rest]);
    break;
  case "check":
    // The checks that read the library itself (every component's model agrees with the compiler's, every example passes accessibility checks, a panel renders for
    // each component): a library runs them from its own package, against its own config.
    generate();
    spawnSync("npx", ["vitest", "run", "--config", vitest, ...rest], { cwd: here, env: { ...env, BENCH_CONFORMANCE: "1" }, stdio: "inherit" });
    break;
  case "build":
    generate();
    run("vite", ["build", "--config", vite, ...rest]);
    break;
  default:
    console.error(`bench: unknown command "${command}" (dev, build, generate, check)`);
    process.exit(1);
}
