import path from "node:path";
import { readLibrary } from "../scripts/readLibrary.mjs";
import { buildApi } from "../engine/api";
import type { ComponentApi } from "../engine/api";
import { extractLibrary } from "../engine/extract/extractLibrary";

/**
 * A fixture library (`test/libraries/<name>`) read the way `bench generate` reads a real one, and its API built from what was read: the same facts a
 * view is given from `api.json`, for a library written for the tests, so a test of Bench needs no real library.
 */
export function apiOf(name: string, resolveDefault?: Parameters<typeof buildApi>[1]): Record<string, ComponentApi> {
  const root = path.resolve(__dirname, "../../test/libraries", name);
  const entry = path.join(root, "src/index.ts");
  const { components } = readLibrary({ entries: [entry], root, packageRoots: [root] });
  const library = extractLibrary(entry, root);
  const models = {
    exports: Object.fromEntries(Object.entries(library.components).map(([id, { model }]) => [id, model.declared])),
    models: Object.fromEntries(Object.entries(library.all).map(([id, { model }]) => [id, model])),
  };
  return buildApi({ components, models }, resolveDefault);
}
