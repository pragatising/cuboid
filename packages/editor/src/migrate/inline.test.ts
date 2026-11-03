import type { DocNode, Mark } from "../core";
import { parseInline } from "./inline";

const t = (text: string, ...marks: Mark[]): DocNode => (marks.length ? { type: "text", text, marks } : { type: "text", text });
const bold: Mark = { type: "bold" };
const italic: Mark = { type: "italic" };
const color = (value: string): Mark => ({ type: "textColor", attrs: { color: value } });

describe("parseInline", () => {
  it("keeps plain text as it is, and breaks lines", () => {
    expect(parseInline("hello world")).toEqual([t("hello world")]);
    expect(parseInline("a\nb")).toEqual([t("a"), { type: "hardBreak" }, t("b")]);
    expect(parseInline("")).toEqual([]);
  });

  it.each([
    ["**bold**", bold],
    ["*italic*", italic],
    ["++under++", { type: "underline" }],
  ])("reads %s", (source, mark) => {
    const word = source.replace(/[*+]/g, "");
    expect(parseInline(`a ${source} b`)).toEqual([t("a "), t(word, mark), t(" b")]);
  });

  it("reads code as literal text with no other mark, even inside bold", () => {
    expect(parseInline("`a **b**`")).toEqual([t("a **b**", { type: "code" })]);
    expect(parseInline("**x `y` z**")).toEqual([t("x ", bold), t("y", { type: "code" }), t(" z", bold)]);
  });

  it("nests marks", () => {
    expect(parseInline("**a *b* c**")).toEqual([t("a ", bold), t("b", bold, italic), t(" c", bold)]);
  });

  it("leaves a marker with no partner as text, as the old editor did", () => {
    expect(parseInline("a * b")).toEqual([t("a * b")]);
    expect(parseInline("2 ** 3")).toEqual([t("2 ** 3")]);
    expect(parseInline("an `unclosed")).toEqual([t("an `unclosed")]);
    expect(parseInline("{c:fg.red.3}never closed")).toEqual([t("{c:fg.red.3}never closed")]);
  });

  describe("links", () => {
    it("reads a safe link, with marks inside its label", () => {
      expect(parseInline("see [the **docs**](example.com/a) now")).toEqual([
        t("see "),
        t("the ", { type: "link", attrs: { href: "https://example.com/a" } }),
        t("docs", { type: "link", attrs: { href: "https://example.com/a" } }, bold),
        t(" now"),
      ]);
    });

    it("keeps an unsafe link as the text it was, not as a link", () => {
      const nodes = parseInline("[click](javascript:alert(1))");
      expect(nodes.flatMap((n) => n.marks ?? []).some((m) => m.type === "link")).toBe(false);
      expect(nodes.map((n) => n.text).join("")).toContain("click");
    });
  });

  describe("colours", () => {
    it("maps a text colour to the palette, and a highlight to Cuboid's", () => {
      expect(parseInline("{c:fg.red.3}x{/c}")).toEqual([t("x", color("danger.strong"))]);
      expect(parseInline("{c:text.muted}x{/c}")).toEqual([t("x", color("neutral.muted"))]);
      expect(parseInline("{bg:highlight.blue}x{/bg}")).toEqual([t("x", { type: "highlight", attrs: { color: "blue" } })]);
      expect(parseInline("{bg:highlight.yellow.sharp}x{/bg}")).toEqual([t("x", { type: "highlight", attrs: { color: "yellow" } })]);
      // The old pale yellow is the soft one now; the old saturated one is `yellow`.
      expect(parseInline("{bg:highlight.yellow}x{/bg}")).toEqual([t("x", { type: "highlight", attrs: { color: "yellowSoft" } })]);
      expect(parseInline("{bg:highlight.teal}x{/bg}")).toEqual([t("x", { type: "highlight", attrs: { color: "teal" } })]);
    });

    it("keeps the text, without the colour, when the colour is not one it knows", () => {
      expect(parseInline("{c:fg.brown.9}x{/c}")).toEqual([t("x")]);
    });

    it("nests a colour inside a highlight", () => {
      expect(parseInline("{bg:highlight.red}a {c:fg.green.2}b{/c}{/bg}")).toEqual([
        t("a ", { type: "highlight", attrs: { color: "red" } }),
        t("b", { type: "highlight", attrs: { color: "red" } }, color("success.strong")),
      ]);
    });
  });

  describe("atoms", () => {
    it("reads a pill with its colour, emphasis and border", () => {
      expect(parseInline("{pill:blue-extrabold-b}Shipped{/pill}")).toEqual([{ type: "pill", attrs: { label: "Shipped", shade: "blue", intensity: "extraBold", bordered: true } }]);
      expect(parseInline("{pill:gray-light-f}x{/pill}")).toEqual([{ type: "pill", attrs: { label: "x", shade: "gray", intensity: "light", bordered: false } }]);
    });

    it("keeps a pill with a token it does not know as text", () => {
      expect(parseInline("{pill:pink-light-f}x{/pill}").every((n) => n.type === "text")).toBe(true);
    });

    it("reads a date from its token, ignoring the fallback text", () => {
      expect(parseInline("due {date:2026-11-12}Nov 12{/date}.")).toEqual([t("due "), { type: "date", attrs: { iso: "2026-11-12" } }, t(".")]);
    });

    it("reads the old chip as the chip mark, keeping what is inside it", () => {
      expect(parseInline("a {{tag}} b")).toEqual([t("a "), t("tag", { type: "chip" }), t(" b")]);
      expect(parseInline("{{**x**}}")).toEqual([t("x", { type: "chip" }, bold)]);
      expect(parseInline("{{x}}").some((n) => n.type === "pill")).toBe(false);
    });
  });

  it("puts the base marks on all of it", () => {
    expect(parseInline("a **b**", [color("neutral.muted")])).toEqual([t("a ", color("neutral.muted")), t("b", color("neutral.muted"), bold)]);
  });

  it("never makes an empty text node", () => {
    const all = [parseInline("****"), parseInline("`` x"), parseInline("{c:text.muted}{/c}"), parseInline("**a****b**")];
    for (const nodes of all) expect(nodes.filter((n) => n.type === "text" && !n.text)).toEqual([]);
  });
});
