import type { SurfaceToken } from "../types";
import {
  coalesceAdjacent,
  linesFromSource,
  type HighlightState,
  type RuleMatchContext,
  type SourceRule,
  tokenizeLine,
} from "./shared";

const JS_KEYWORDS =
  "\\b(?:async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|if|import|in|instanceof|let|new|of|return|static|super|switch|throw|try|typeof|var|void|while|with|yield)\\b";

const TS_KEYWORDS =
  "\\b(?:abstract|as|declare|implements|interface|keyof|namespace|never|private|protected|public|readonly|satisfies|type|undefined)\\b";

/** TS primitive type keywords — treated as `typeName`, consistent with user-defined types. */
const TS_PRIMITIVE_TYPES = new Set([
  "string",
  "number",
  "boolean",
  "any",
  "unknown",
  "object",
  "void",
  "never",
  "symbol",
  "bigint",
]);

/** Identifiers that put the NEXT identifier token into structural type position. */
const TYPE_POSITION_KEYWORDS = new Set([
  "class",
  "interface",
  "extends",
  "implements",
  "new",
  "type",
  "as",
]);

/**
 * Per-line/per-file positional state for the JS/TS/JSX tokenizer. This is a
 * lightweight heuristic — NOT a parser — so it tracks just enough syntactic
 * position to drive `typeName`/`functionCall`/`propertyAccess` classification.
 */
export interface JsHighlightState {
  /** Next identifier should be classified as `typeName` (after class/interface/extends/etc). */
  nextIsType: boolean;
  /**
   * Depth of `<...>` we believe is a generic-type bracket (opened right after
   * an identifier/type, e.g. `Promise<`). Distinguishes from `<`/`>` used as
   * comparison operators, which don't open on an identifier and therefore never
   * increment this.
   */
  genericDepth: number;
}

function jsState(state: HighlightState): JsHighlightState {
  if (!state.lang) state.lang = {};
  const lang = state.lang as Partial<JsHighlightState>;
  lang.nextIsType ??= false;
  lang.genericDepth ??= 0;
  return lang as JsHighlightState;
}

function prevSignificant(tokensSoFar: readonly SurfaceToken[]): SurfaceToken | undefined {
  for (let i = tokensSoFar.length - 1; i >= 0; i--) {
    const t = tokensSoFar[i]!;
    if (t.type === "plain" && t.value.trim() === "") continue;
    return t;
  }
  return undefined;
}

/**
 * Heuristic for "is this `:` a TS type annotation" (param/variable/return type)
 * vs. an object-literal or ternary `:`. Structural cues, not real parsing:
 *   - `):`  → return type annotation (very reliable)
 *   - `identifier:` where the identifier isn't itself preceded by `{`/`,`
 *     inside what looks like an object literal is treated as a var/param type.
 * Known false positives: a ternary `cond ? a : b` where `a` is a bare
 * identifier reads as "identifier :" and can be misclassified as a type
 * position — rare in practice because ternary branches are usually
 * expressions, not sole identifiers, and the cost of a misfire is cosmetic
 * (an identifier gets `typeName` colour instead of `plain`).
 * Known false negative: destructured renames (`{ foo: bar }`) are correctly
 * excluded (object-literal-looking), but so is object *type* literal shorthand
 * like `{ id: string }` — deliberately treated as non-type there is ambiguous
 * without real scope tracking, so it's classified as NOT a type position and
 * the value after `:` stays `plain`/`keyword` rather than `typeName`.
 */
function isTypeAnnotationColon(tokensSoFar: readonly SurfaceToken[]): boolean {
  const prev = prevSignificant(tokensSoFar);
  if (!prev) return false;
  if (prev.type === "bracket" && prev.value === ")") return true;
  if (prev.type === "plain" || prev.type === "propertyAccess") {
    for (let i = tokensSoFar.length - 2; i >= 0; i--) {
      const t = tokensSoFar[i]!;
      if (t.type === "bracket" && (t.value === "{" || t.value === ",")) return false;
      if (t.type === "bracket" && (t.value === "(" || t.value === ";")) return true;
      if (t.type === "plain" && t.value.trim() === "") continue;
      break;
    }
    return true;
  }
  return false;
}

function classifyIdentifier(ctx: RuleMatchContext): string {
  const { value, state, rest, tokensSoFar } = ctx;
  const js = jsState(state);

  if (js.nextIsType) {
    js.nextIsType = false;
    return "typeName";
  }

  if (TS_PRIMITIVE_TYPES.has(value)) return "typeName";

  const prev = prevSignificant(tokensSoFar);
  if (prev?.type === "bracket" && prev.value === ".") {
    return "propertyAccess";
  }

  if (/^\s*\(/.test(rest)) {
    return "functionCall";
  }

  if (/^\s*</.test(rest)) {
    return "typeName";
  }

  // Inside `<...>` we believe is a generic bracket (`Promise<UserProfile>`),
  // a bare identifier not otherwise classified is almost certainly a type
  // argument, not a value reference — generics can only hold types.
  if (js.genericDepth > 0) {
    return "typeName";
  }

  return "plain";
}

/**
 * Builds the shared rule list, parameterised on the keyword pattern (JS-only
 * vs. JS+TS combined) so the keyword rule — for BOTH variants — sits before
 * the general identifier rule below. Keeping them in one list (rather than
 * appending a separate `TS_ONLY_RULES` array after) matters: `tokenizeLine`
 * tries rules in order and stops at the first match, so if the identifier
 * rule came first, TS keywords like `interface`/`implements`/`as` would
 * never reach the keyword rule at all — they'd be consumed as plain
 * identifiers, silently breaking the `nextIsType` triggers that depend on
 * seeing them as keywords.
 */
function buildRules(keywordPattern: string): SourceRule[] {
  return [
    {
      type: "comment",
      pattern: /^\/\*[\s\S]*?\*\//,
    },
    {
      type: "comment",
      pattern: /^\/\*/,
      onMatch(state) {
        state.inBlockComment = true;
      },
    },
    {
      type: "comment",
      pattern: /^\/\/[^\n]*/,
    },
    {
      type: "string",
      pattern: /^"(?:\\.|[^"\\])*"/,
    },
    {
      type: "string",
      pattern: /^'(?:\\.|[^'\\])*'/,
    },
    {
      type: "string",
      pattern: /^`(?:\\.|[^`\\])*`/,
    },
    {
      type: "keyword",
      pattern: new RegExp(keywordPattern),
      onMatch(state, value) {
        if (TYPE_POSITION_KEYWORDS.has(value)) {
          jsState(state).nextIsType = true;
        }
      },
    },
    ...IDENTIFIER_AND_LITERAL_RULES,
  ];
}

const IDENTIFIER_AND_LITERAL_RULES: SourceRule[] = [
  {
    type: "boolean",
    pattern: /^\btrue\b|^\bfalse\b/,
  },
  {
    type: "null",
    pattern: /^\bnull\b|^\bundefined\b/,
  },
  {
    type: "number",
    pattern: /^-?(?:0x[\da-fA-F]+|\d+\.\d+|\d+)(?:[eE][+-]?\d+)?\b/,
  },
  {
    // `:` is split out from the general bracket char class so we can decide
    // "is this a type annotation" from tokens seen so far, before the char
    // itself is consumed as a plain bracket token.
    type: (ctx) => {
      if (isTypeAnnotationColon(ctx.tokensSoFar)) {
        jsState(ctx.state).nextIsType = true;
      }
      return "bracket";
    },
    pattern: /^:/,
  },
  {
    type: (ctx) => {
      const { value, state } = ctx;
      const js = jsState(state);
      if (value === "<") {
        const prev = prevSignificant(ctx.tokensSoFar);
        const opensGeneric =
          prev?.type === "typeName" ||
          prev?.type === "plain" ||
          prev?.type === "functionCall";
        if (opensGeneric) js.genericDepth++;
      } else if (value === ">" && js.genericDepth > 0) {
        js.genericDepth--;
      }
      return "bracket";
    },
    pattern: /^[{}[\]().,;<>]/,
  },
  {
    type: "typeName",
    pattern: /^#[A-Za-z][\w-]*/,
  },
  {
    type: classifyIdentifier,
    pattern: /^[$A-Z_a-z][\w$]*/,
  },
  {
    type: "operator",
    pattern: /^[=+\-*/%!&|^~?]+/,
  },
];

const BASE_RULES = buildRules(JS_KEYWORDS);
const TS_RULES = buildRules(`${JS_KEYWORDS}|${TS_KEYWORDS}`);

function highlightJsLine(line: string, state: HighlightState, ts: boolean): SurfaceToken[] {
  const rules = ts ? TS_RULES : BASE_RULES;
  return tokenizeLine(line, rules, state);
}

export function highlightJavaScript(code: string) {
  return linesFromSource(code, (line, state) => highlightJsLine(line, state, false));
}

export function highlightTypeScript(code: string) {
  return linesFromSource(code, (line, state) => highlightJsLine(line, state, true));
}

// ── JSX / TSX ────────────────────────────────────────────────────────────────

/**
 * JSX needs a small state machine layered on top of the JS/TS expression
 * tokenizer: "js" (plain JS/TS), "tag" (inside a tag's attribute list, after
 * `<Name`/`</Name` and before the matching `>`/`/>`), and "expr" (inside a
 * `{...}` JSX expression child/attribute value, which falls back to full
 * JS/TS tokenization). Modes are tracked as a stack so `{...}` expressions
 * containing more JSX (`{cond && <Child />}`) resolve correctly, and a tag's
 * `{expr}` attribute value nests inside "tag" the same way.
 */
type JsxMode = "js" | "tag" | "expr" | "children";

interface JsxHighlightState {
  modeStack: JsxMode[];
  /**
   * True right after entering "tag" mode, until the first identifier in it
   * is consumed. Same one-shot trick as HTML's `tagPending`: the tag name
   * and an attribute name are syntactically identical identifiers, so only
   * position (first vs. later) tells them apart.
   */
  tagNamePending: boolean;
  /** The tag being read is a closing tag (`</X>` or `</>`): its `>` also ends the element's children. */
  closing: boolean;
}

function jsxState(state: HighlightState): JsxHighlightState {
  if (!state.lang) state.lang = {};
  const lang = state.lang as Partial<JsxHighlightState>;
  lang.modeStack ??= ["js"];
  lang.tagNamePending ??= false;
  lang.closing ??= false;
  return lang as JsxHighlightState;
}

function currentMode(jsx: JsxHighlightState): JsxMode {
  return jsx.modeStack[jsx.modeStack.length - 1] ?? "js";
}

/**
 * What a tag name is, from how it is written: `Button` and `ActionMenu.Item` are components (a capital letter or a member
 * access), `div` is an element of the platform. They get different colours, and the opening and the closing tag of one
 * element always get the same.
 */
const isComponentTag = (name: string) => /^[A-Z]/.test(name) || name.includes(".");

const JSX_TAG_RULES: SourceRule[] = [
  {
    type: (ctx) => {
      const jsx = jsxState(ctx.state);
      if (jsx.tagNamePending) {
        jsx.tagNamePending = false;
        return isComponentTag(ctx.value) ? "componentTag" : "entityTag";
      }
      return "jsxAttribute";
    },
    pattern: /^[A-Za-z_$][\w$:.-]*/,
  },
  {
    type: "string",
    pattern: /^"(?:\\.|[^"\\])*"/,
  },
  {
    type: "string",
    pattern: /^'(?:\\.|[^'\\])*'/,
  },
  {
    type: "operator",
    pattern: /^=/,
  },
];

/** The text between an element's tags: not code, so it is not read as code. It ends at the next tag or `{expression}`. */
const JSX_CHILDREN_RULES: SourceRule[] = [{ type: "jsxText", pattern: /^[^<{]+/ }];

function makeModeRules(ts: boolean): Record<JsxMode, SourceRule[]> {
  const exprRules = ts ? TS_RULES : BASE_RULES;

  // `<Identifier` is ambiguous between a JSX tag open and a TS generic
  // instantiation (`Array<string>`, `foo<Bar>()`). Heuristic: only treat it
  // as a tag when NOT immediately preceded (ignoring whitespace) by an
  // identifier/`)`/`]` — those precede generics, not JSX, which normally
  // opens after punctuation, `return`/`=>`/`&&`/`(`, or at line start.
  // Known false positive: `condition<Component/>` (no space, no valid
  // preceding token) is rare enough in practice to accept.
  const looksLikeGenericAt = (tokensSoFar: readonly SurfaceToken[]) => {
    const prev = prevSignificant(tokensSoFar);
    return Boolean(
      prev &&
        ((prev.type === "plain" && /[$\w]$/.test(prev.value) && !/^(return|typeof|yield|default|do|else|in|of)$/.test(prev.value)) ||
          prev.type === "typeName" ||
          prev.type === "functionCall" ||
          (prev.type === "bracket" && (prev.value === ")" || prev.value === "]"))),
    );
  };

  // `<` opens a tag, `</` opens a closing tag (both are one `tagBracket`, so a pair is always the same colour). Between an
  // element's tags the text is not code, so a `<` there is always a tag; elsewhere it may be a generic (see above).
  const openTag: SourceRule = {
    type: (ctx) => {
      const jsx = jsxState(ctx.state);
      const closing = ctx.value === "</";
      if (closing || currentMode(jsx) === "children" || !looksLikeGenericAt(ctx.tokensSoFar)) {
        jsx.modeStack.push("tag");
        jsx.tagNamePending = true;
        jsx.closing = closing;
        return "tagBracket";
      }
      return "bracket";
    },
    pattern: /^<\/?(?=[A-Za-z>])/,
  };

  // `/>` ends a tag that has no children; `>` ends an opening tag (its children follow) or a closing tag (they are over).
  const selfClose: SourceRule = {
    type: "tagBracket",
    pattern: /^\/>/,
    onMatch(state) {
      const jsx = jsxState(state);
      if (currentMode(jsx) === "tag") jsx.modeStack.pop();
      jsx.closing = false;
    },
  };

  const tagEnd: SourceRule = {
    type: "tagBracket",
    pattern: /^>/,
    onMatch(state) {
      const jsx = jsxState(state);
      if (currentMode(jsx) !== "tag") return;
      jsx.modeStack.pop();
      if (jsx.closing) {
        if (currentMode(jsx) === "children") jsx.modeStack.pop();
        jsx.closing = false;
      } else {
        jsx.modeStack.push("children");
      }
    },
  };

  const exprOpen: SourceRule = {
    type: "bracket",
    pattern: /^\{/,
    onMatch(state) {
      jsxState(state).modeStack.push("expr");
    },
  };

  const exprClose: SourceRule = {
    type: "bracket",
    pattern: /^\}/,
    onMatch(state) {
      const jsx = jsxState(state);
      if (currentMode(jsx) === "expr") jsx.modeStack.pop();
    },
  };

  return {
    tag: [selfClose, tagEnd, exprOpen, ...JSX_TAG_RULES],
    children: [openTag, exprOpen, ...JSX_CHILDREN_RULES],
    // Inside a JSX expression we're back in full JS/TS, but must still
    // recognise a NEW `<Tag` opening (nested JSX) and the `}` that closes us.
    // Braces nest: `style={{ a: 1 }}` is two, so each `{` here opens a level and each `}` closes one.
    expr: [exprClose, exprOpen, openTag, ...exprRules],
    js: [openTag, ...exprRules],
  };
}

/**
 * Tokenizes one line against a mode-aware rule set, re-selecting the active
 * rules whenever a match transitions `state`'s mode stack (entering/leaving a
 * tag or a `{...}` expression). This intentionally mirrors `tokenizeLine`'s
 * loop rather than calling it per-segment, so `tokensSoFar` lookbehind (used
 * by `propertyAccess`/`functionCall`/the `:` type-annotation heuristic) stays
 * correct across an entire line, including across mode transitions within an
 * expression.
 */
function highlightJsxLine(
  line: string,
  state: HighlightState,
  modeRules: Record<JsxMode, SourceRule[]>,
): SurfaceToken[] {
  const jsx = jsxState(state);
  const tokens: SurfaceToken[] = [];
  let rest = line;

  if (state.inBlockComment) {
    const end = rest.indexOf("*/");
    if (end === -1) {
      tokens.push({ type: "comment", value: rest });
      return tokens;
    }
    tokens.push({ type: "comment", value: rest.slice(0, end + 2) });
    rest = rest.slice(end + 2);
    state.inBlockComment = false;
  }

  while (rest.length > 0) {
    const rules = modeRules[currentMode(jsx)];
    let matched = false;

    for (const rule of rules) {
      const m = rule.pattern.exec(rest);
      if (!m || m.index !== 0) continue;

      const value = m[0];
      const consumedRest = rest.slice(value.length);
      rule.onMatch?.(state, value);
      const type =
        typeof rule.type === "function"
          ? rule.type({ value, state, rest: consumedRest, tokensSoFar: tokens })
          : rule.type;
      tokens.push({ type, value });
      rest = consumedRest;
      matched = true;
      break;
    }

    if (!matched) {
      tokens.push({ type: "plain", value: rest[0]! });
      rest = rest.slice(1);
    }
  }

  return coalesceAdjacent(tokens, "plain");
}

function makeJsxHighlighter(ts: boolean) {
  const modeRules = makeModeRules(ts);
  return function highlight(code: string) {
    return linesFromSource(
      code,
      (line, state) => highlightJsxLine(line, state, modeRules),
      () => ({ modeStack: ["js"], tagNamePending: false, closing: false }) satisfies JsxHighlightState,
    );
  };
}

export const highlightJsx = makeJsxHighlighter(false);
export const highlightTsx = makeJsxHighlighter(true);
