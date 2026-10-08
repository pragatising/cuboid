#!/usr/bin/env node
/**
 * Standalone token schema validator — decoupled from the real build
 * (scripts/buildTokens.ts), matching Primer's real
 * scripts/validateTokenJson.ts pattern (confirmed by reading their live
 * source): Style Dictionary's build does NOT call any Zod schema at all
 * — `designToken` (src/schemas/designToken.ts) was real and complete but
 * entirely unused until this script. This is deliberate separation, not
 * an oversight: a broken token should fail validation with a clear
 * path/message, not surface as a silent substituted value deep inside a
 * Style Dictionary transform (the exact failure mode
 * primitives-pipeline-tracker.md's "one thing to understand about this
 * pipeline" warns about).
 *
 * Unlike Primer's version (report-only by default, --failOnErrors to
 * exit 1), this one fails by default: cuboid has no CI workflow calling
 * this script a different way yet, so the direct `npm run
 * validate:tokens` invocation IS the primary use case, not a secondary
 * one — it should fail loudly without needing a flag.
 *
 * Usage: node scripts/validateTokens.ts [--silent]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSON5 from "json5";
import { z } from "zod";
import { designToken } from "../src/schemas/designToken.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const dirFlagIndex = process.argv.indexOf("--dir");
// --dir override exists for this script's own test (a real token-content
// bug can't be reproduced against src/tokens/ without editing real
// source) as well as any future use case that wants to validate a token
// tree living outside this package.
const TOKENS_DIR = dirFlagIndex !== -1 ? path.resolve(process.argv[dirFlagIndex + 1]) : path.join(ROOT, "src", "tokens");

const silent = process.argv.includes("--silent");

function log(...args: unknown[]) {
  if (!silent) console.log(...args);
}

function findJson5Files(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) findJson5Files(entryPath, acc);
    else if (entry.name.endsWith(".json5")) acc.push(entryPath);
  }
  return acc;
}

type FileResult = { file: string; ok: true } | { file: string; ok: false; message: string };

function validateFile(filePath: string): FileResult {
  const relativePath = path.relative(ROOT, filePath);
  const raw = fs.readFileSync(filePath, "utf8");

  let parsed: unknown;
  try {
    parsed = JSON5.parse(raw);
  } catch (error) {
    return { file: relativePath, ok: false, message: `Invalid JSON5: ${(error as Error).message}` };
  }

  const result = designToken.safeParse(parsed);
  if (result.success) return { file: relativePath, ok: true };

  return { file: relativePath, ok: false, message: z.prettifyError(result.error) };
}

function main() {
  const files = findJson5Files(TOKENS_DIR);
  const results = files.map(validateFile);
  const failures = results.filter((result): result is FileResult & { ok: false } => !result.ok);

  for (const result of results) {
    if (result.ok) log(`✅ ${result.file}`);
    else log(`❌ ${result.file}\n${result.message.split("\n").map((line) => `   ${line}`).join("\n")}`);
  }

  log(`\n${results.length - failures.length}/${results.length} token files valid.`);

  if (failures.length > 0) {
    console.error(`\n${failures.length} token file(s) failed schema validation.`);
    process.exit(1);
  }
}

main();
