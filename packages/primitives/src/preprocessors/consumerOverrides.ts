import type { PreprocessedTokens, Preprocessor } from "style-dictionary/types";
import { applyOverrides } from "../applyOverrides.ts";

type PlainObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is PlainObject => typeof value === "object" && value !== null && !Array.isArray(value);

/** A node in an override file that describes a token (rather than just grouping children). */
const describesToken = (node: PlainObject) => "$value" in node || "$type" in node || "$extensions" in node;

/**
 * Dot-paths in the override file that do not exist in the dictionary. Only
 * path segments are checked: once a node describes a token, its `$`-keys are
 * token metadata (merged freely, e.g. adding a new `$extensions` entry), not
 * further paths.
 */
function findUnknownPaths(dictionary: PlainObject, overrides: PlainObject, prefix: string[] = []): string[] {
  const unknown: string[] = [];
  for (const [key, value] of Object.entries(overrides)) {
    if (key.startsWith("$") || !isPlainObject(value)) continue;
    const here = [...prefix, key];
    const existing = dictionary[key];
    if (!isPlainObject(existing)) unknown.push(here.join("."));
    else if (!describesToken(value)) unknown.push(...findUnknownPaths(existing, value, here));
  }
  return unknown;
}

/**
 * Applies a consumer's partial token file (ADR-04 amendment) onto the merged
 * token dictionary BEFORE references resolve, so an override of a base or
 * functional token cascades into everything that references it.
 *
 * Why this is a preprocessor and not just another `source` file: Style
 * Dictionary's source merge REPLACES a whole token when two files define the
 * same path, so a consumer overriding only `$value` would silently lose the
 * token's `$type`, `$extensions` (incl. its dark-mode value) and `alpha`.
 * Here the merge is a deep one (`applyOverrides`): override keys win, every
 * key the consumer didn't mention is kept.
 *
 * Overrides may only target tokens that already exist: an unknown path is
 * almost always a typo, and merging it would silently do nothing.
 */
export const consumerOverrides: Preprocessor = {
  name: "consumerOverrides",
  preprocessor: (dictionary: PreprocessedTokens, config) => {
    // Global (non-platform) preprocessors are handed Style Dictionary's top-level
    // `options` object directly, not the whole config.
    const overrides = (config as { consumerOverrides?: PlainObject })?.consumerOverrides;
    if (!overrides || Object.keys(overrides).length === 0) return dictionary;

    const unknown = findUnknownPaths(dictionary as PlainObject, overrides);
    if (unknown.length > 0) {
      throw new Error(`Override refers to token(s) that do not exist: ${unknown.join(", ")}`);
    }
    return applyOverrides(dictionary as PlainObject, overrides) as PreprocessedTokens;
  },
};
