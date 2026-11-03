import type { ComponentModel } from "../Interfaces/ComponentModel/ComponentModel";
import { builtOn, hostElement } from "./builtOn";
import { callerApi } from "./callerApi";
import type { ComponentApi } from "./callerApi";
import type { ComponentJson, PropInfo } from "./types";

/** What the readers give: the library's components with their props (`readLibrary`), and what is written in their functions (`extractLibrary`). */
export type LibraryFacts = {
  components: Record<string, ComponentJson>;
  models: { exports: Record<string, string>; models: Record<string, ComponentModel> };
};

/**
 * The caller API of every component and every part, by public id (`Menu`, `Menu.Item`). One pure function over what was read: it names nothing, and the view
 * reads its answer instead of joining the readers by name.
 */
export function buildApi(facts: LibraryFacts, resolveDefault?: (expression: string, prop: PropInfo) => string | undefined): Record<string, ComponentApi> {
  const { exports, models } = facts.models;
  const resolve = (declared: string) => models[declared];
  const out: Record<string, ComponentApi> = {};
  const add = (id: string, entry: ComponentJson, model: ComponentModel | undefined) => {
    out[id] = callerApi({ id, facts: entry, model, built: builtOn(model), element: hostElement(model, resolve), resolveDefault });
  };
  for (const [name, entry] of Object.entries(facts.components)) {
    const model = models[exports[name]];
    add(name, entry, model);
    // A part is a component of its own, found by what is attached to its component.
    for (const part of entry.parts ?? []) {
      const attached = model?.statics.find((found) => `${name}.${found.name}` === part.name);
      add(part.name, part, attached?.declared ? models[attached.declared] : undefined);
    }
  }
  return out;
}
