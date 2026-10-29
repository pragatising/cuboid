import { HTML, ROW_GROUPS, mayHold } from "./content/html";
import type { ComponentDoc, Fixtures, Node, PartDoc, PropDoc, Value } from "./types";

/**
 * One thing a prop can be, as far as an example cares. Which icon fills a slot makes no difference to the component, so a slot has
 * two choices (empty, filled), not one per icon: choices are equivalence classes.
 */
export type Choice = {
  prop: string;
  id: string;
  label: string;
  /** What to set the prop to. `undefined` leaves it off, which is how the default is shown. */
  value: Value | undefined;
  /** The choice an example uses when it has nothing to say about this prop. */
  baseline: boolean;
  /** Whether some example must show it. Leaving a flag off, or a slot empty, needs no example of its own. */
  required: boolean;
};

export type Domain = { prop: string; choices: Choice[] };
export type Skipped = { prop: string; kind: string; reason: string };

export type Domains = {
  domains: Domain[];
  /** Props that no example varies, and why. A gap on the page, not a silent omission. */
  skipped: Skipped[];
  /** Required props with nothing to fill them: the component cannot be drawn until the host says what they are. */
  blocked: Skipped[];
};

/** `"\"center\""` is `center`, `"true"` is `true`. Anything that is not a literal has no default we can show. */
export function parseDefault(text: string | undefined): string | number | boolean | undefined {
  if (text === undefined) return undefined;
  try {
    const value: unknown = JSON.parse(text);
    return typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? value : undefined;
  } catch {
    return undefined;
  }
}

const choice = (prop: string, id: string, label: string, value: Value | undefined, baseline: boolean, required: boolean): Choice => ({
  prop,
  id: `${prop}=${id}`,
  label,
  value,
  baseline,
  required,
});

function enumDomain(prop: PropDoc): Domain {
  const fallback = parseDefault(prop.default);
  const values = prop.values ?? [];
  const choices = values.map((value) => {
    const isDefault = value === fallback;
    return choice(prop.name, String(value), `${prop.name}: ${value}`, isDefault ? undefined : value, isDefault, true);
  });
  // No default in the types: the component picks one when the prop is left off. That is the baseline; it needs no example.
  if (!choices.some((c) => c.baseline)) choices.unshift(choice(prop.name, "unset", `${prop.name} unset`, undefined, true, false));
  return { prop: prop.name, choices };
}

function flagDomain(prop: PropDoc): Domain {
  const onByDefault = parseDefault(prop.default) === true;
  return {
    prop: prop.name,
    choices: [
      // The state a flag is in when nobody asked for anything needs no demonstration; the other one does.
      choice(prop.name, "on", prop.name, onByDefault ? undefined : true, onByDefault, !onByDefault),
      choice(prop.name, "off", `${prop.name} off`, onByDefault ? false : undefined, !onByDefault, onByDefault),
    ],
  };
}

/** An instance of a part, with what it needs to be written: each required prop gets a sample. */
export function instance(part: PartDoc, text: string, n: number, children?: (Node | string)[]): Node {
  const props: Record<string, Value> = {};
  for (const prop of part.required) {
    if (prop.name === "children") continue;
    if (prop.kind === "enum" && prop.values?.length) props[prop.name] = prop.values[0];
    else if (prop.kind === "value") props[prop.name] = prop.name === "value" ? `value-${n}` : humanise(prop.name);
    else if (prop.kind === "flag") props[prop.name] = true;
    // A required slot is text named after it (`label="Label"`): a part with no label is not a part in use.
    else if (prop.kind === "slot") props[prop.name] = humanise(prop.name);
  }
  return { tag: part.tag, ...(Object.keys(props).length ? { props } : {}), children: children ?? [text] };
}

/**
 * What goes between a compound component's tags, from its parts, nested as HTML needs them (`Table.Row` in `Table.Header`, its cells in
 * the row). Where a level has items (parts whose role must sit inside another) it is those, `items` of them; otherwise each part that
 * takes content appears once. A part that holds only elements and has nothing placed in it is left out. Null when there is nothing to use.
 */
function partsChildren(parts: PartDoc[], items: number, empty: string[] = []): (Node | string)[] | null {
  const level = (inside: string | undefined, count: number, trail: PartDoc[], single = false): (Node | string)[] => {
    const groups = trail.flatMap((p) => (p.element && ROW_GROUPS.includes(p.element) ? [p.element] : []));
    const here = parts.filter(
      (p) =>
        p.placeable &&
        (p.inside === inside || (inside !== undefined && p.alsoInside?.includes(inside))) &&
        !trail.includes(p) &&
        // A header cell is written in the header's rows, a data cell in the body's.
        !(p.belongsIn && groups.length && !groups.includes(p.belongsIn)),
    );
    const chosen = here.some((p) => p.item) ? here.filter((p) => p.item) : here;
    return chosen.flatMap((part) => {
      // A part HTML allows one of (a `thead`) holds a single row, not a list; what is in that row is a list again.
      // A part the host says is drawn empty is there, with nothing in it.
      if (empty.includes(part.tag)) return [instance(part, "", 1, [])];
      const nested = level(part.tag, part.item ? Math.min(count, 3) : count, [...trail, part], !!part.element && !!HTML[part.element]?.unique);
      // Text goes where the part's own element takes it; elsewhere it holds what was placed in it, or nothing and is left out.
      const text = !part.holds || mayHold(part.holds, "text");
      if (!nested.length && (!part.content || !text)) return [];
      return Array.from({ length: part.item && !part.once && !single ? count : 1 }, (_, i) => instance(part, nested.length ? "" : part.item ? `${humanise(part.name)} ${i + 1}` : humanise(part.name), i + 1, nested.length ? nested : undefined));
    });
  };
  const children = level(undefined, items, []);
  return children.length ? children : null;
}

/**
 * `children` is the component's content. With parts it is those parts (a few items, and many to show a long list); otherwise a
 * short label, and a long one to show wrapping and truncation.
 */
function labelDomain(prop: PropDoc, fixtures: Fixtures, parts: PartDoc[] = []): Domain {
  const typical = partsChildren(parts, 3, fixtures.empty);
  if (typical)
    return {
      prop: prop.name,
      choices: [
        choice(prop.name, "parts", "typical parts", typical, true, false),
        ...(parts.some((p) => p.item) ? [choice(prop.name, "many", "many items", partsChildren(parts, 8, fixtures.empty) ?? typical, false, true)] : []),
      ],
    };
  return {
    prop: prop.name,
    choices: [
      choice(prop.name, "short", "short label", fixtures.labels.short, true, false),
      choice(prop.name, "long", "long label", fixtures.labels.long, false, true),
    ],
  };
}

/** `descriptionVisual` as words: "Description visual". The text a slot gets when nothing says it wants more than text. */
export const humanise = (name: string) => {
  const words = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return words[0].toUpperCase() + words.slice(1);
};

/**
 * A slot takes any node, and text is a node that is always valid and always visible, so that is what it gets unless the host
 * says what fills this one. The text is the slot's own name, which also shows which slot it is.
 */
function slotDomain(prop: PropDoc, fixtures: Fixtures): Domain | null {
  const filler = fixtures.fillers[prop.name] ?? prop.filler ?? fixtures.fillers["*"] ?? humanise(prop.name);
  // What names the control is always there: a field without its label is not an example of the field.
  const always = prop.required || prop.names;
  const filled = choice(prop.name, "filled", prop.name, filler, !!always, true);
  return { prop: prop.name, choices: always ? [filled] : [choice(prop.name, "empty", `${prop.name} empty`, undefined, true, false), filled] };
}

const WHY: Record<string, string> = {
  event: "a handler does nothing to look at",
  function: "a function has no look",
  ref: "a ref has no look",
  state: "state the app holds; the Playground controls it, an example does not",
  open: "its values are open-ended; the host supplies samples",
  value: "free text or a number; the host supplies samples",
  other: "not a shape the engine knows",
};

/**
 * Each prop's choices. enum: its values. flag: off and on. slot: empty and filled. `children`: a short and a long label. What
 * cannot be shown from the types alone (free values, handlers) is listed as skipped, so it shows up as a gap.
 */
export function domainsOf(doc: ComponentDoc, fixtures: Fixtures): Domains {
  const domains: Domain[] = [];
  const skipped: Skipped[] = [];
  const blocked: Skipped[] = [];
  // A set of choices (items that each have a `value`) with nothing chosen is not a picture of one in use: start with the first chosen,
  // through React's own `defaultValue`, which leaves the state with the component.
  const choices = doc.parts?.some((part) => part.item && part.required.some((r) => r.name === "value"));
  for (const prop of doc.props) {
    if (choices && prop.kind === "state" && prop.name === "defaultValue") {
      domains.push({ prop: prop.name, choices: [choice(prop.name, "first", "first chosen", "value-1", true, false)] });
      continue;
    }
    const domain =
      prop.kind === "enum"
        ? enumDomain(prop)
        : prop.kind === "flag"
          ? flagDomain(prop)
          : prop.kind === "slot"
            ? prop.name === "children" && !prop.element
              ? labelDomain(prop, fixtures, doc.parts)
              : slotDomain(prop, fixtures)
            : null;
    if (domain) {
      domains.push(domain);
      continue;
    }
    // A prop the host says every example carries (`name="add"` on an Icon) is not a gap: it is added below.
    if (fixtures.attributes?.[doc.name]?.[prop.name] !== undefined) continue;
    const entry = { prop: prop.name, kind: prop.kind, reason: WHY[prop.kind] ?? "unknown kind" };
    // A handler or a ref is never needed to draw the component; a required value or slot is.
    (prop.required && !["event", "function", "ref"].includes(prop.kind) ? blocked : skipped).push(entry);
  }
  // What the host says every example of this component carries.
  for (const [name, value] of Object.entries(fixtures.attributes?.[doc.name] ?? {})) domains.push({ prop: name, choices: [choice(name, "given", name, value, true, false)] });
  return { domains, skipped, blocked };
}

/**
 * Whether a combination (a partial one included) turns on more than one thing of a group that do not go together. A prop is on when
 * its choice is not the baseline: a flag set, a slot filled.
 */
export function allowedBy(exclusive: string[][] = []) {
  const on = (choice: Choice | undefined) => !!choice && !choice.baseline && choice.value !== undefined;
  return (picks: Record<string, Choice>) => exclusive.every((group) => group.filter((prop) => on(picks[prop])).length <= 1);
}
