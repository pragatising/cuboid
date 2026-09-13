import { linesFromSource, tokenizeLine, type HighlightState, type SourceRule } from "./shared";

/**
 * `entityTag` and `attributeName` share an identical identifier shape
 * (`[A-Za-z][\w:-]*`), so which one applies — and whether an identifier is
 * tag/attribute markup at all, vs. plain text content between tags — is
 * purely positional: only the FIRST identifier right after `<`/`</` is the
 * tag name; identifiers after that, up to the closing `>`, are attribute
 * names; identifiers outside any `<...>` span are just text content.
 * `inTag`/`tagPending` track that one-shot + span state; without it, a
 * single "identifier" rule can't tell `div` (tag) from `id`/`class`
 * (attributes) from `Hello` (text) since HTML has no keyword marking any of
 * these apart.
 */
interface HtmlLangState {
  inTag: boolean;
  tagPending: boolean;
}

function htmlState(state: HighlightState): HtmlLangState {
  if (!state.lang) state.lang = {};
  const lang = state.lang as Partial<HtmlLangState>;
  lang.inTag ??= false;
  lang.tagPending ??= false;
  return lang as HtmlLangState;
}

const RULES: SourceRule[] = [
  {
    type: "comment",
    pattern: /^<!--[\s\S]*?-->/,
  },
  {
    type: "comment",
    pattern: /^<!--[\s\S]*/,
  },
  {
    type: "bracket",
    pattern: /^<\/?/,
    onMatch(state) {
      const html = htmlState(state);
      html.inTag = true;
      html.tagPending = true;
    },
  },
  {
    type: (ctx) => {
      const html = htmlState(ctx.state);
      if (!html.inTag) return "plain";
      if (html.tagPending) {
        html.tagPending = false;
        return "entityTag";
      }
      return "attributeName";
    },
    pattern: /^[A-Za-z][\w:.-]*/,
  },
  {
    type: "bracket",
    pattern: /^\/\/>/,
  },
  {
    type: "bracket",
    pattern: /^\/?>/,
    onMatch(state) {
      htmlState(state).inTag = false;
    },
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
    type: "attributeName",
    pattern: /^[A-Za-z_:][\w:.-]*/,
  },
  {
    type: "operator",
    pattern: /^=/,
  },
  {
    type: "bracket",
    pattern: /^[{}[\]()]/,
  },
];

function highlightHtmlLine(line: string, state: HighlightState) {
  return tokenizeLine(line, RULES, state);
}

export function highlightHtml(code: string) {
  return linesFromSource(code, highlightHtmlLine);
}
