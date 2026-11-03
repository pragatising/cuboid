import { tagHighlighter, tags as t } from "@lezer/highlight";
import type { SyntaxColors, SyntaxKey } from "../../ui/index";

/**
 * Colours the editor from the same place `CodeBlock` gets them. The highlighter names each token with the kit's own vocabulary
 * (`keyword`, `storage`, `componentTag`…), and the colours for those names are the ones `resolveSyntaxColors` gives from the tokens
 * (`syntax.typescript.*`). What the grammar cannot say alone is in `syntaxMarks`: a bracket's colour is its nesting depth, and a tag's
 * `<` and `>` are the colour of the tag.
 */
export const syntaxHighlighter = tagHighlighter([
  { tag: t.comment, class: "cs-comment" },
  // `import`, `export`, `from`, `return`, `if`, `typeof`, `new`: where the code goes. `const`, `function`, `class`, `type`, `public`, `this`: what a name is declared as.
  { tag: [t.moduleKeyword, t.controlKeyword, t.operatorKeyword, t.keyword], class: "cs-keyword" },
  { tag: [t.definitionKeyword, t.modifier, t.self], class: "cs-storage" },
  { tag: [t.definition(t.function(t.variableName)), t.definition(t.function(t.propertyName))], class: "cs-functionDeclaration" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], class: "cs-functionCall" },
  // A component is written with a capital (or as a member), a platform element is lower case: the grammar tells them apart.
  { tag: t.tagName, class: "cs-componentTag" },
  { tag: t.standard(t.tagName), class: "cs-htmlTag" },
  { tag: t.attributeName, class: "cs-jsxAttribute" },
  { tag: t.escape, class: "cs-stringEscape" },
  { tag: t.regexp, class: "cs-stringRegexp" },
  { tag: [t.string, t.special(t.string), t.character], class: "cs-string" },
  { tag: t.number, class: "cs-numberLiteral" },
  { tag: t.bool, class: "cs-booleanLiteral" },
  { tag: t.null, class: "cs-nullLiteral" },
  { tag: [t.typeName, t.className], class: "cs-typeName" },
  { tag: [t.propertyName, t.definition(t.propertyName)], class: "cs-propertyAccess" },
  { tag: [t.operator, t.derefOperator, t.logicOperator, t.compareOperator, t.arithmeticOperator, t.bitwiseOperator, t.definitionOperator, t.updateOperator, t.controlOperator], class: "cs-operator" },
  { tag: t.separator, class: "cs-punctuation" },
]);

/** The theme rules that give each of those names its colour. */
export function syntaxStyles(colors: SyntaxColors): Record<string, { color: string }> {
  const rules: Record<string, { color: string }> = {};
  for (const key of Object.keys(colors) as SyntaxKey[]) rules[`.cs-${key}`] = { color: colors[key] };
  return rules;
}
