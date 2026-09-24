import { format } from "prettier";
import { readFileSync } from "node:fs";
import { resolve as resolvePath } from "node:path";
import { treeWalker } from "../utilities/treeWalker";
import type { W3cTransformedToken } from "../types/w3cTransformedToken";
import { prefixTokens } from "./utilities/prefixTokens";
import type { Config, DesignTokens, FormatFn, FormatFnArguments, LocalOptions } from "style-dictionary/types";
import { fileHeader } from "style-dictionary/utils";
import { getPropName } from "./utilities/getPropName";
import { lowerCaseFirstCharacter } from "../utilities/lowerCaseFirstCharacter";

/**
 * Generates compiled TypeScript type definitions for the resolved token
 * tree, reading each real type's `.d.ts` file from src/types/ (e.g.
 * "ColorHex" -> types/colorHex.d.ts) and stitching them together with a
 * generated type alias mirroring the token tree's shape. Matches
 * Primer's formats/typescriptExportDefinition.ts. No current consumer —
 * cuboid already hand-writes its `.d.ts` types and ships them via the
 * `./tokens` export — real infrastructure for a future generated-types
 * consumer.
 */
function unquoteTypes(output: string, designTokenTypes: string[]): string {
  const regex = `"(${["number", "string", "any", ...designTokenTypes].join("|")})"`;
  return output.replace(new RegExp(regex, "g"), "$1");
}

function getTokenType(tokenTypesPath: string): string {
  try {
    return readFileSync(resolvePath(tokenTypesPath), { encoding: "utf-8" });
  } catch (error) {
    throw new Error(`Error trying to load design token type from file "${tokenTypesPath}". Error: ${error}`);
  }
}

function invalidTokenValueError(token: W3cTransformedToken, options: Config & LocalOptions): never {
  throw new Error(
    `Invalid token: "${token.name}" with type "${(token as unknown as Record<string, unknown>)[getPropName("type", options.usesDtcg)]}" can not have a value of "${(token as unknown as Record<string, unknown>)[getPropName("value", options.usesDtcg)]}"`,
  );
}

function convertPropToType(tree: W3cTransformedToken, options: Config & LocalOptions): string {
  const valueProp = getPropName("value", options.usesDtcg);
  const record = tree as unknown as Record<string, unknown>;

  if (!Object.prototype.hasOwnProperty.call(tree, valueProp)) {
    throw new Error(`Invalid token: ${tree}`);
  }

  const value = record[valueProp];

  switch (tree.$type) {
    case "color":
      if (typeof value === "string" && value[0] === "#") return "ColorHex";
      return invalidTokenValueError(tree, options);
    case "dimension":
      if (typeof value === "string" && value.endsWith("rem")) return "SizeRem";
      if (typeof value === "string" && value.endsWith("em")) return "SizeEm";
      if (typeof value === "string" && value.endsWith("px")) return "SizePx";
      return invalidTokenValueError(tree, options);
    case "shadow":
      return "Shadow";
    case "border":
      return "Border";
    default:
      if (typeof value === "number") return "number";
      if (typeof value === "string") return "string";
      if (typeof value === "boolean") return "boolean";
      return "any";
  }
}

function validTokenNode(usesDtcg?: boolean) {
  return (item: unknown): item is W3cTransformedToken => {
    return typeof item === "object" && item !== null && getPropName("value", usesDtcg) in item;
  };
}

function getUsedTokenTypes(tokens: DesignTokens, validTypes: string[], options: Config & LocalOptions): Set<string> {
  const usedTypes = new Set<string>();
  const callback = (tree: unknown) => usedTypes.add(convertPropToType(tree as W3cTransformedToken, options));

  treeWalker(tokens, callback, validTokenNode(options.usesDtcg));

  for (const type of usedTypes) {
    if (!validTypes.includes(type)) {
      usedTypes.delete(type);
    }
  }
  return usedTypes;
}

function getTokenObjectWithTypes(tokens: DesignTokens, options: Config & LocalOptions): Record<string, unknown> {
  const callback = (tree: unknown) => convertPropToType(tree as W3cTransformedToken, options);
  return treeWalker(tokens, callback, validTokenNode(options.usesDtcg)) as Record<string, unknown>;
}

function getTypeDefinition(tokens: DesignTokens, options: Config & LocalOptions): string {
  const { moduleName = "tokens", tokenTypesPath = "./src/types/" } = options as { moduleName?: string; tokenTypesPath?: string };
  const usedTypes = getUsedTokenTypes(tokens, ["Shadow", "ColorHex", "Border", "SizeEm", "SizeRem", "SizePx"], options);
  const tokenObjectWithTypes = getTokenObjectWithTypes(tokens, options);

  const designTokenTypes: string[] = [];
  for (const type of usedTypes) {
    const typePath = tokenTypesPath.replace(/\/$/g, "");
    designTokenTypes.push(getTokenType(`${typePath}/${lowerCaseFirstCharacter(type)}.d.ts`));
  }

  const output = `${designTokenTypes.join("\n")}
    export type ${moduleName} = ${JSON.stringify(tokenObjectWithTypes, null, 2)}`;

  return unquoteTypes(output, [...usedTypes]);
}

export const typescriptExportDefinition: FormatFn = async ({ dictionary, file, options = {}, platform }: FormatFnArguments) => {
  const tokens = prefixTokens(dictionary.tokens, platform);
  const output = `${await fileHeader({ file })}\n${getTypeDefinition(tokens, options as Config & LocalOptions)}\n`;
  return format(output, { parser: "typescript", printWidth: 500 });
};
