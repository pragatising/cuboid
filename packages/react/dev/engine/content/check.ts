import type { ComponentModel } from "../Interfaces/ComponentModel/ComponentModel";
import { propDoc } from "../recognise/recognise";
import type { Models } from "../recognise/recognise";
import { rootHostOf, slotChains } from "../recognise/role";
import type { Node } from "../types";
import { HTML, admitsText, describe, fits, holderIn as container, specUrl } from "./html";
import type { Category } from "./html";
import type { Issue } from "./issue";

/** What the check reads: every component's model, and which are exported under what name (`Button`, `Header`). */
export type Env = { models: Models; exported: Record<string, string> };

const isHost = (tag: string) => /^[a-z]/.test(tag) && !tag.includes(".");

/** The model behind `Button` or `ActionMenu.Item`: a part is found through its parent's statics. */
function modelFor(tag: string, env: Env) {
  const [root, ...rest] = tag.split(".");
  let model: ComponentModel | undefined = env.models[env.exported[root]];
  for (const name of rest) {
    const declared: string | undefined = model?.statics.find((s) => s.name === name)?.declared;
    model = declared ? env.models[declared] : undefined;
  }
  return model;
}

/** The attributes a node writes as plain strings: `as="a"` decides which element a component renders. */
const literalProps = (node: Node) => Object.fromEntries(Object.entries(node.props ?? {}).filter(([, v]) => typeof v === "string")) as Record<string, string>;

/**
 * What a piece of content is: the HTML element it renders. A component is the element at its root (a Button is a `button`, a Table a
 * `table`, a `Pill as="a"` an `a`). Null when it cannot be told, and nothing is claimed.
 */
function elementOf(item: Node | string, env: Env): "text" | string | null {
  if (typeof item === "string") return "text";
  if (isHost(item.tag)) return HTML[item.tag] ? item.tag : null;
  const model = modelFor(item.tag, env);
  const root = model ? rootHostOf(model, env.models, literalProps(item)) : null;
  return root && HTML[root.tag] ? root.tag : null;
}

const forbidden = (kind: string, what: string) => kind === what || (HTML[kind]?.categories as string[] | undefined)?.includes(what);

/**
 * Checks a composition against the HTML content model. Every piece of content is the element it renders; every slot is the
 * innermost element it lands in, narrowed by what each ancestor forbids (a `button` forbids interactive content anywhere inside it).
 * So a Button's leading visual, which renders in a `span` inside the `button`, takes phrasing content and no other control.
 */
export function checkComposition(root: Node, env: Env): Issue[] {
  const issues: Issue[] = [];

  // `outer` is the host elements around this node, from the top: what its ancestors admit and forbid applies to everything inside it.
  const visit = (node: Node, path: string[], outer: string[]) => {
    const host = isHost(node.tag);
    const model = host ? undefined : modelFor(node.tag, env);
    const slots: { name: string; items: (Node | string)[] }[] = [];
    for (const [name, value] of Object.entries(node.props ?? {})) {
      if (Array.isArray(value)) slots.push({ name, items: value });
      else if (typeof value === "object") slots.push({ name, items: [value] });
      else if (typeof value === "string" && model?.props.some((p) => p.name === name && propDoc(p).kind === "slot")) slots.push({ name, items: [value] });
    }
    if (node.children?.length) slots.push({ name: "children", items: node.children });

    for (const slot of slots) {
      // Where it lands: one place, or several when the component places it differently by prop. Content is accepted if it fits one.
      // An empty chain is a placement that could not be read (a component made of ones we cannot see into): no claim.
      const chains = host ? [[node.tag]] : model ? slotChains(model, env.models, slot.name, literalProps(node)).filter((chain) => chain.length > 0) : [];

      for (const item of slot.items) {
        const kind = chains.length ? elementOf(item, env) : null;
        const where = [...path, slot.name, typeof item === "string" ? "text" : item.tag];
        const tried = kind ? chains.map((chain) => violations(kind, [...outer, ...chain], path, slot.name, where)) : [];
        if (tried.length && tried.every((found) => found.length > 0)) issues.push(...tried[0]);
        if (typeof item !== "string") visit(item, where, chains.length ? [...outer, ...chains[0]] : outer);
      }
    }
  };

  /** What is wrong with putting this kind of content in this place, or nothing. */
  const violations = (kind: string, around: string[], path: string[], slot: string, where: string[]): Issue[] => {
    const found: Issue[] = [];
    const inside = container(around);
    const label = kind === "text" ? "text" : `<${kind}> (${describe(kind)})`;
    const parents = kind === "text" ? undefined : HTML[kind].parents;
    if (inside && HTML[inside] && !fits(HTML[inside].content, kind))
      found.push({
        rule: "html.content-model",
        severity: "error",
        source: "html",
        message: `${label} does not fit ${path.join(" › ")} › ${slot}: it lands in a <${inside}>, which admits ${admitsText(HTML[inside].content)}.`,
        path: where,
        references: [{ name: `HTML: the ${inside} element`, url: specUrl(inside) }],
      });
    else if (parents && !(inside && parents.includes(inside)))
      found.push({
        rule: "html.parent",
        severity: "error",
        source: "html",
        message: `${label} must be inside ${parents.map((p) => `<${p}>`).join(", ")}, but ${path.join(" › ")} › ${slot} lands in ${inside ? `a <${inside}>` : "the page"}.`,
        path: where,
        references: [{ name: `HTML: the ${kind} element`, url: specUrl(kind) }],
      });
    for (const tag of around) {
      for (const what of HTML[tag]?.forbids ?? []) {
        if (!forbidden(kind, what)) continue;
        found.push({
          rule: what === "interactive" ? "html.nested-interactive" : "html.forbidden-descendant",
          severity: "error",
          source: what === "interactive" ? "wcag" : "html",
          message: `${label} does not fit ${path.join(" › ")} › ${slot}: a <${tag}> forbids ${what} content among its descendants.`,
          path: where,
          references: [
            { name: `HTML: the ${tag} element`, url: specUrl(tag) },
            ...(what === "interactive" ? [{ name: "WCAG 2.2: Name, Role, Value", criterion: "4.1.2" }] : []),
          ],
        });
      }
    }
    return found;
  };

  visit(root, [root.tag], []);
  return issues;
}

export type { Category };
