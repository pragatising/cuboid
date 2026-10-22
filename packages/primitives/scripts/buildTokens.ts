#!/usr/bin/env node
/**
 * Token build entry point — a thin wrapper over src/build.ts, which holds
 * the real logic (Style Dictionary does the merge / reference-resolution /
 * transform / emit work; see DESIGN.md §3). Writes into this package's
 * dist/ (never across the workspace boundary into packages/react).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "../src/build.ts";

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");

build({ outDir }).catch((error) => {
  console.error("Token build failed:", error);
  process.exit(1);
});
