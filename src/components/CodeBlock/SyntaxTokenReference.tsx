import type { ColumnDef } from "@tanstack/react-table";
import { useTheme } from "../../theme/ThemeContext";
import { SimpleTable } from "../core/Table";
import { Box } from "../core/Box";
import { Text } from "../core/Text";

interface TokenRow {
  name: string;
  meaning: string;
  example: string;
  language: string;
  /** Path into `theme.colors.global.syntax`, resolved at render time. */
  path: string[];
}

interface ResolvedTokenRow extends TokenRow {
  resolvedColor: string;
}

function readPath(obj: unknown, path: string[]): string {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur == null || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[key];
  }
  return typeof cur === "string" ? cur : "";
}

const TOKEN_COLUMNS: ColumnDef<ResolvedTokenRow, unknown>[] = [
  { accessorKey: "name", header: "Name", meta: { width: "14%" } },
  { accessorKey: "meaning", header: "Meaning", meta: { width: "34%", rowLayout: "wrap" } },
  {
    accessorKey: "example",
    header: "Example",
    meta: { width: "32%" },
    cell: ({ row }) => (
      <Text as="code" role="body" size="sm" style={{ fontFamily: "var(--cube-typography-fontFamily-mono)" }}>
        {row.original.example}
      </Text>
    ),
  },
  {
    accessorKey: "resolvedColor",
    header: "Token value",
    meta: { width: "20%" },
    cell: ({ row }) => {
      const color = row.original.resolvedColor;
      return (
        <Box style={{ display: "inline-flex", alignItems: "center", gap: "var(--cube-stack-gap-xs)" }}>
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: "0.9rem",
              height: "0.9rem",
              borderRadius: "var(--cube-sizes-borderRadius-sm)",
              border: "var(--cube-sizes-borderWidth-thin) solid var(--cube-color-border-gray-2)",
              background: color || "transparent",
            }}
          />
          <Text as="code" role="body" size="xs" color="muted" style={{ fontFamily: "var(--cube-typography-fontFamily-mono)" }}>
            {color || "—"}
          </Text>
        </Box>
      );
    },
  },
];

/**
 * One table per `syntax.*` group (literal/identifier/string/css/markup/
 * diagnostic/surface). Column 4 reads the live resolved color from theme
 * context at render time (resolved here, in the component, rather than via
 * SimpleTable's `meta` — it doesn't forward one to useReactTable) — never a
 * hardcoded hex, so the table can't go stale when a token's value changes.
 */
function TokenTable({ rows }: { rows: TokenRow[] }) {
  const tokens = useTheme();
  const resolved: ResolvedTokenRow[] = rows.map((row) => ({
    ...row,
    resolvedColor: readPath(tokens.colors.global.syntax, row.path),
  }));
  return (
    <SimpleTable
      columns={TOKEN_COLUMNS}
      data={resolved}
      getRowId={(row) => row.path.join(".")}
      density="dense"
    />
  );
}

const LITERAL_ROWS: TokenRow[] = [
  { name: "number", meaning: "Numeric literal.", example: "42", language: "js", path: ["token", "literal", "number"] },
  { name: "boolean", meaning: "true / false. Neutral hue — value has no inherent sentiment.", example: "true", language: "js", path: ["token", "literal", "boolean"] },
  { name: "null", meaning: "null / undefined.", example: "null", language: "js", path: ["token", "literal", "null"] },
];

const IDENTIFIER_ROWS: TokenRow[] = [
  { name: "keyword", meaning: "Language keyword or control-flow word.", example: "const, if, return", language: "js", path: ["token", "identifier", "keyword"] },
  { name: "typeName", meaning: "Identifier in a structural type position — class/interface name, generic argument, type annotation.", example: "interface UserProfile", language: "ts", path: ["token", "identifier", "typeName"] },
  { name: "typeMember", meaning: "Field name declared inside an interface/type body — a declaration, not a value read.", example: "{ id: string }", language: "ts", path: ["token", "identifier", "typeMember"] },
  { name: "functionCall", meaning: "Identifier immediately followed by ( — a function or method call.", example: "fetchUser()", language: "js", path: ["token", "identifier", "functionCall"] },
  { name: "propertyAccess", meaning: "Identifier immediately preceded by . — deliberately subtle, closer to muted foreground than a keyword.", example: "response.ok", language: "js", path: ["token", "identifier", "propertyAccess"] },
  { name: "entityTag", meaning: "Tag name — shared across HTML and JSX for visual consistency.", example: "<div>, <Icon>", language: "html", path: ["token", "identifier", "entityTag"] },
  { name: "attributeName", meaning: "Attribute/prop name on a tag — shared hue across HTML and JSX.", example: 'class="row"', language: "html", path: ["token", "identifier", "attributeName"] },
];

const STRING_ROWS: TokenRow[] = [
  { name: "default", meaning: "Plain string literal.", example: '"hello"', language: "js", path: ["token", "string", "default"] },
  { name: "regexp", meaning: "Regular expression literal.", example: "/^\\d+$/", language: "js", path: ["token", "string", "regexp"] },
  { name: "url", meaning: "String value classified as a URL (JSON viewer linkify).", example: '"https://example.com"', language: "json", path: ["token", "string", "url"] },
  { name: "email", meaning: "String value classified as an email address (JSON viewer linkify).", example: '"a@example.com"', language: "json", path: ["token", "string", "email"] },
  { name: "uuid", meaning: "String value classified as a UUID.", example: '"8f14e...4"', language: "json", path: ["token", "string", "uuid"] },
];

const CSS_ROWS: TokenRow[] = [
  { name: "selector", meaning: ".class / #id / :pseudo selector.", example: ".docs-section", language: "css", path: ["token", "css", "selector"] },
  { name: "property", meaning: "CSS property name before :.", example: "color:", language: "css", path: ["token", "css", "property"] },
  { name: "value", meaning: "CSS property value keyword.", example: "flex", language: "css", path: ["token", "css", "value"] },
];

const MARKUP_ROWS: TokenRow[] = [
  { name: "bold", meaning: "Bold prose emphasis (diff/markdown rendering).", example: "**bold**", language: "md", path: ["markup", "bold"] },
  { name: "italic", meaning: "Italic prose emphasis.", example: "*italic*", language: "md", path: ["markup", "italic"] },
  { name: "heading", meaning: "Heading text.", example: "## Section", language: "md", path: ["markup", "heading"] },
  { name: "list", meaning: "List marker/item.", example: "- item", language: "md", path: ["markup", "list"] },
  { name: "insertedBg", meaning: "Background for an added diff line.", example: "+ added line", language: "diff", path: ["markup", "insertedBg"] },
  { name: "insertedText", meaning: "Text color for an added diff line.", example: "+ added line", language: "diff", path: ["markup", "insertedText"] },
  { name: "deletedBg", meaning: "Background for a removed diff line.", example: "- removed line", language: "diff", path: ["markup", "deletedBg"] },
  { name: "deletedText", meaning: "Text color for a removed diff line.", example: "- removed line", language: "diff", path: ["markup", "deletedText"] },
  { name: "changedBg", meaning: "Background for a changed diff line.", example: "~ changed line", language: "diff", path: ["markup", "changedBg"] },
  { name: "changedText", meaning: "Text color for a changed diff line.", example: "~ changed line", language: "diff", path: ["markup", "changedText"] },
];

const DIAGNOSTIC_ROWS: TokenRow[] = [
  { name: "brackethighlighterAngle", meaning: "Angle-bracket bracket-highlighter accent.", example: "<T>", language: "ts", path: ["diagnostic", "brackethighlighterAngle"] },
  { name: "brackethighlighterUnmatched", meaning: "An unmatched/unbalanced bracket.", example: "function f( {", language: "js", path: ["diagnostic", "brackethighlighterUnmatched"] },
  { name: "carriageReturnBg", meaning: "Background flagging a stray \\r carriage-return character.", example: "line\\r\\n", language: "text", path: ["diagnostic", "carriageReturnBg"] },
  { name: "carriageReturnText", meaning: "Text color over carriageReturnBg.", example: "\\r", language: "text", path: ["diagnostic", "carriageReturnText"] },
  { name: "invalidIllegalText", meaning: "Text color for an invalid/illegal character.", example: "\\x00", language: "text", path: ["diagnostic", "invalidIllegalText"] },
  { name: "invalidIllegalBg", meaning: "Background for an invalid/illegal character.", example: "\\x00", language: "text", path: ["diagnostic", "invalidIllegalBg"] },
];

const SURFACE_ROWS: TokenRow[] = [
  { name: "rowHoverBg", meaning: "Background tint when the pointer hovers a CodeSurface row.", example: "(hover state)", language: "ui", path: ["surface", "rowHoverBg"] },
  { name: "collapsedRowBg", meaning: "Background for a collapsed JSON node summary row.", example: "{ … }", language: "json", path: ["surface", "collapsedRowBg"] },
  { name: "watchMark", meaning: "Gutter watchlist marker dot when a line is watched.", example: "●", language: "ui", path: ["surface", "watchMark"] },
  { name: "watchMarkHover", meaning: "Gutter watchlist dot preview on row hover, before click.", example: "○", language: "ui", path: ["surface", "watchMarkHover"] },
  { name: "watchRowBg", meaning: "Row background when a line is on the watchlist.", example: "(watched row)", language: "ui", path: ["surface", "watchRowBg"] },
];

export function SyntaxTokenReferenceSection() {
  return (
    <div className="cube-docs-sections">
      <div className="cube-docs-section cube-docs-section--wide">
        <h3 className="cube-docs-section__title">Syntax token reference</h3>
        <p className="cube-docs-note">
          Every <code>color.syntax.*</code> token, grouped the same way the theme is:{" "}
          <code>token</code> (real language syntax highlighting), <code>markup</code>{" "}
          (diff/prose rendering), <code>diagnostic</code> (error/edge-case rendering), and{" "}
          <code>surface</code> (CodeSurface UI chrome). The <em>Token value</em> column reads
          live from the active theme, so it never goes stale.
        </p>
      </div>

      <div className="cube-docs-section cube-docs-section--wide">
        <h4 className="cube-docs-section__title">token.literal</h4>
        <TokenTable rows={LITERAL_ROWS} />
      </div>

      <div className="cube-docs-section cube-docs-section--wide">
        <h4 className="cube-docs-section__title">token.identifier</h4>
        <TokenTable rows={IDENTIFIER_ROWS} />
      </div>

      <div className="cube-docs-section cube-docs-section--wide">
        <h4 className="cube-docs-section__title">token.string</h4>
        <TokenTable rows={STRING_ROWS} />
      </div>

      <div className="cube-docs-section cube-docs-section--wide">
        <h4 className="cube-docs-section__title">token.css</h4>
        <TokenTable rows={CSS_ROWS} />
      </div>

      <div className="cube-docs-section cube-docs-section--wide">
        <h4 className="cube-docs-section__title">markup</h4>
        <TokenTable rows={MARKUP_ROWS} />
      </div>

      <div className="cube-docs-section cube-docs-section--wide">
        <h4 className="cube-docs-section__title">diagnostic</h4>
        <TokenTable rows={DIAGNOSTIC_ROWS} />
      </div>

      <div className="cube-docs-section cube-docs-section--wide cube-docs-section--last">
        <h4 className="cube-docs-section__title">surface</h4>
        <TokenTable rows={SURFACE_ROWS} />
      </div>
    </div>
  );
}
