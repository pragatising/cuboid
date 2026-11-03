/**
 * The HTML content model for the elements a design system writes: what each element is (its categories) and what it admits
 * (its content model). This is the baseline every other rule narrows. Written from the HTML Living Standard; each entry says
 * where in it. An element not listed here is unknown, and nothing is claimed about it.
 */
export type Category = "flow" | "phrasing" | "interactive" | "heading" | "sectioning" | "embedded" | "palpable";

/** What an element admits between its tags. */
export type Content =
  /** Elements of these categories (and text, when `phrasing` or `flow` is among them), and the named elements in `also`. */
  | { admits: "categories"; categories: Category[]; also?: string[] }
  /** Only these elements (a `ul` takes `li`), and no text. */
  | { admits: "elements"; elements: string[] }
  /** Only text (a `textarea`, an `option`). */
  | { admits: "text" }
  /** Nothing: a void element (`input`, `hr`). */
  | { admits: "none" }
  /** What its parent admits (an `a` is flow inside a `div`, phrasing inside a `p`). */
  | { admits: "transparent" }
  /** Anything: the content is another vocabulary (`svg`). */
  | { admits: "any" };

export type ElementModel = {
  categories: Category[];
  content: Content;
  /** Descendants it forbids, whatever sits between: categories (a `button` forbids `interactive`) or element names (a `label` forbids `label`). */
  forbids?: (Category | string)[];
  /** The only parents it may have (a `tr` is in a `table`, `thead`, `tbody` or `tfoot`). Absent when it may go wherever its categories fit. */
  parents?: string[];
  /** The row group its content belongs in, by what the standard says that group is for: column labels go in `thead`, data in `tbody`. */
  belongsIn?: string;
  /** At most one in its parent (a `table` has one `thead`). */
  unique?: boolean;
  /** Where it is in the standard: `page#anchor` under html.spec.whatwg.org/multipage/. */
  spec: string;
};

const flow = ["flow", "palpable"] as Category[];
const phrasing = ["flow", "phrasing", "palpable"] as Category[];
const control = ["flow", "phrasing", "interactive", "palpable"] as Category[];
const inFlow: Content = { admits: "categories", categories: ["flow"] };
const inPhrasing: Content = { admits: "categories", categories: ["phrasing"] };
const text = (anchor: string) => `text-level-semantics.html#${anchor}`;
const group = (anchor: string) => `grouping-content.html#${anchor}`;
const section = (anchor: string) => `sections.html#${anchor}`;
const tables = (anchor: string) => `tables.html#${anchor}`;
const forms = (anchor: string) => `form-elements.html#${anchor}`;

const phrase = (anchor: string): ElementModel => ({ categories: phrasing, content: inPhrasing, spec: text(anchor) });

export const HTML: Record<string, ElementModel> = {
  div: { categories: flow, content: inFlow, spec: group("the-div-element") },
  span: phrase("the-span-element"),
  p: { categories: flow, content: inPhrasing, spec: group("the-p-element") },
  pre: { categories: flow, content: inPhrasing, spec: group("the-pre-element") },
  hr: { categories: ["flow"], content: { admits: "none" }, spec: group("the-hr-element") },
  em: phrase("the-em-element"),
  strong: phrase("the-strong-element"),
  mark: phrase("the-mark-element"),
  kbd: phrase("the-kbd-element"),
  code: phrase("the-code-element"),
  small: phrase("the-small-element"),
  abbr: phrase("the-abbr-element"),
  time: phrase("the-time-element"),

  a: { categories: control, content: { admits: "transparent" }, forbids: ["interactive"], spec: text("the-a-element") },
  button: { categories: control, content: inPhrasing, forbids: ["interactive"], spec: forms("the-button-element") },
  input: { categories: control, content: { admits: "none" }, spec: "input.html#the-input-element" },
  label: { categories: control, content: inPhrasing, forbids: ["label"], spec: "forms.html#the-label-element" },
  textarea: { categories: control, content: { admits: "text" }, spec: forms("the-textarea-element") },
  select: { categories: control, content: { admits: "elements", elements: ["option", "optgroup"] }, spec: forms("the-select-element") },
  optgroup: { categories: [], content: { admits: "elements", elements: ["option"] }, parents: ["select"], spec: forms("the-optgroup-element") },
  option: { categories: [], content: { admits: "text" }, parents: ["select", "optgroup", "datalist"], spec: forms("the-option-element") },
  fieldset: { categories: flow, content: { admits: "categories", categories: ["flow"], also: ["legend"] }, spec: forms("the-fieldset-element") },
  legend: { categories: [], content: { admits: "categories", categories: ["phrasing", "heading"] }, parents: ["fieldset"], unique: true, spec: forms("the-legend-element") },
  form: { categories: flow, content: inFlow, forbids: ["form"], spec: "forms.html#the-form-element" },

  ul: { categories: flow, content: { admits: "elements", elements: ["li"] }, spec: group("the-ul-element") },
  ol: { categories: flow, content: { admits: "elements", elements: ["li"] }, spec: group("the-ol-element") },
  li: { categories: [], content: inFlow, parents: ["ul", "ol", "menu"], spec: group("the-li-element") },
  dl: { categories: flow, content: { admits: "elements", elements: ["dt", "dd", "div"] }, spec: group("the-dl-element") },
  dt: { categories: [], content: inFlow, forbids: ["header", "footer", "sectioning", "heading"], parents: ["dl", "div"], spec: group("the-dt-element") },
  dd: { categories: [], content: inFlow, parents: ["dl", "div"], spec: group("the-dd-element") },

  table: { categories: flow, content: { admits: "elements", elements: ["caption", "colgroup", "thead", "tbody", "tfoot", "tr"] }, spec: tables("the-table-element") },
  caption: { categories: [], content: inFlow, forbids: ["table"], parents: ["table"], unique: true, spec: tables("the-caption-element") },
  colgroup: { categories: [], content: { admits: "elements", elements: ["col"] }, parents: ["table"], spec: tables("the-colgroup-element") },
  col: { categories: [], content: { admits: "none" }, parents: ["colgroup"], spec: tables("the-col-element") },
  thead: { categories: [], content: { admits: "elements", elements: ["tr"] }, parents: ["table"], unique: true, spec: tables("the-thead-element") },
  tbody: { categories: [], content: { admits: "elements", elements: ["tr"] }, parents: ["table"], spec: tables("the-tbody-element") },
  tfoot: { categories: [], content: { admits: "elements", elements: ["tr"] }, parents: ["table"], unique: true, spec: tables("the-tfoot-element") },
  tr: { categories: [], content: { admits: "elements", elements: ["td", "th"] }, parents: ["table", "thead", "tbody", "tfoot"], spec: tables("the-tr-element") },
  td: { categories: [], content: inFlow, parents: ["tr"], belongsIn: "tbody", spec: tables("the-td-element") },
  th: { categories: [], content: inFlow, forbids: ["header", "footer", "sectioning", "heading"], parents: ["tr"], belongsIn: "thead", spec: tables("the-th-element") },

  nav: { categories: ["flow", "sectioning", "palpable"], content: inFlow, spec: section("the-nav-element") },
  main: { categories: flow, content: inFlow, spec: group("the-main-element") },
  header: { categories: flow, content: inFlow, forbids: ["header", "footer"], spec: section("the-header-element") },
  footer: { categories: flow, content: inFlow, forbids: ["header", "footer"], spec: section("the-footer-element") },
  section: { categories: ["flow", "sectioning", "palpable"], content: inFlow, spec: section("the-section-element") },
  article: { categories: ["flow", "sectioning", "palpable"], content: inFlow, spec: section("the-article-element") },
  aside: { categories: ["flow", "sectioning", "palpable"], content: inFlow, spec: section("the-aside-element") },
  ...Object.fromEntries(["h1", "h2", "h3", "h4", "h5", "h6"].map((tag) => [tag, { categories: ["flow", "heading", "palpable"], content: inPhrasing, spec: section("the-h1,-h2,-h3,-h4,-h5,-and-h6-elements") } as ElementModel])),

  img: { categories: ["flow", "phrasing", "embedded", "palpable"], content: { admits: "none" }, spec: "embedded-content.html#the-img-element" },
  svg: { categories: ["flow", "phrasing", "embedded", "palpable"], content: { admits: "any" }, spec: "embedded-content-other.html" },
};

/** The standard's page for an element. */
export const specUrl = (tag: string) => `https://html.spec.whatwg.org/multipage/${HTML[tag]?.spec ?? ""}`;

/** What an element is, in words: `flow, phrasing, interactive`. */
export const describe = (tag: string) => (HTML[tag] ? HTML[tag].categories.filter((c) => c !== "palpable").join(", ") || "no category of its own" : "unknown");

/** The element content sits directly in: the innermost of a chain of host elements, looking through `a` and the like that take on their parent's model. */
export function holderIn(chain: string[]): string | null {
  for (let i = chain.length - 1; i >= 0; i--) if (HTML[chain[i]]?.content.admits !== "transparent") return chain[i];
  return null;
}

/** What an element admits, in words. */
export const admitsText = (content: Content): string =>
  content.admits === "categories" ? `${content.categories.join(" or ")} content${content.also ? ` and <${content.also.join(">, <")}>` : ""}` : content.admits === "elements" ? `only <${content.elements.join(">, <")}>` : content.admits === "text" ? "only text" : content.admits === "none" ? "nothing (it is a void element)" : "what its parent admits";

/** Whether a kind of content (an element's name, or `text`) fits what an element admits. */
export function fits(content: Content, kind: string): boolean {
  if (content.admits === "any") return true;
  if (kind === "text") return content.admits === "text" || (content.admits === "categories" && content.categories.some((c) => c === "phrasing" || c === "flow"));
  if (content.admits === "elements") return content.elements.includes(kind);
  if (content.admits !== "categories") return false;
  return !!content.also?.includes(kind) || HTML[kind].categories.some((category) => content.categories.includes(category));
}

/**
 * Whether `child` may sit directly in `holder`: the holder admits it, and the child accepts the holder as a parent (an `li` only in a
 * `ul`, `ol` or `menu`). True when either is unknown, because nothing is claimed about what is not described.
 */
export function mayHold(holder: string, child: string): boolean {
  const outer = HTML[holder];
  const inner = child === "text" ? undefined : HTML[child];
  if (!outer || (child !== "text" && !inner)) return true;
  if (outer.content.admits === "transparent") return true;
  return fits(outer.content, child) && (!inner?.parents || inner.parents.includes(holder));
}

/** The groups of rows in a table. */
export const ROW_GROUPS = ["thead", "tbody", "tfoot"];
