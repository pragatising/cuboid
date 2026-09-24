import type { Dictionary, TransformedToken, FormatFn, FormatFnArguments, PlatformConfig } from "style-dictionary/types";
import { format } from "prettier";
import { transformNamePathToFigma } from "../transformers/namePathToFigma";
import type { ShadowTokenValue } from "../types/shadowTokenValue";
import { hexToRgbaFloat } from "../transformers/utilities/hexToRgbaFloat";
import type { RgbaFloat } from "../transformers/utilities/isRgbaFloat";
import { isRgbaFloat } from "../transformers/utilities/isRgbaFloat";
import { getReferences, sortByReference } from "style-dictionary/utils";

function isReference(value: string): boolean {
  return /^\{([^\\]*)\}$/g.test(value);
}

function getReference(dictionary: Dictionary, refString: string, platform: PlatformConfig): string | undefined {
  if (!isReference(refString)) return undefined;
  const refToken = getReferences(refString, dictionary.tokens, { unfilteredTokens: dictionary.unfilteredTokens })[0];
  return [refToken.attributes?.collection, transformNamePathToFigma(refToken, platform)].filter(Boolean).join("/");
}

const FIGMA_TYPES: Record<string, string> = {
  color: "COLOR",
  dimension: "FLOAT",
  fontWeight: "FLOAT",
  number: "FLOAT",
  fontFamily: "STRING",
};

function getFigmaType(type: string): string {
  if (type in FIGMA_TYPES) return FIGMA_TYPES[type];
  throw new Error(`Invalid type: ${type}`);
}

function shadowToVariables(name: string, values: Omit<ShadowTokenValue, "color"> & { color: string | RgbaFloat }, token: TransformedToken) {
  function getDimensionValue(dim: ShadowTokenValue["offsetX"]): number {
    if (typeof dim === "object" && "value" in dim) return dim.value;
    throw new Error(`Invalid shadow dimension: expected W3C object format, got ${JSON.stringify(dim)}`);
  }

  const { attributes } = token;
  const { mode, collection, group } = (attributes as { mode?: unknown; collection?: unknown; group?: unknown }) || {};

  function floatValue(property: "offsetX" | "offsetY" | "blur" | "spread") {
    return {
      name: `${name}/${property}`,
      value: getDimensionValue(values[property]),
      type: "FLOAT",
      scopes: ["EFFECT_FLOAT"],
      mode,
      collection,
      group,
    };
  }

  return [
    floatValue("offsetX"),
    floatValue("offsetY"),
    floatValue("blur"),
    floatValue("spread"),
    {
      name: `${name}/color`,
      value: isRgbaFloat(values.color) ? { ...values.color, ...(values.alpha ? { a: values.alpha } : {}) } : hexToRgbaFloat(values.color, values.alpha),
      type: "COLOR",
      scopes: ["EFFECT_COLOR"],
      mode,
      collection,
      group,
    },
  ];
}

/**
 * Resolved token tree -> a flat array of Figma Variable API objects,
 * ready for the Figma-sync work (DESIGN.md §6). Matches Primer's
 * formats/jsonFigma.ts.
 */
export const jsonFigma: FormatFn = async ({ dictionary, file: _file, platform }: FormatFnArguments) => {
  const tokens: Array<Record<string, unknown>> = [];
  const sortedTokens = [...dictionary.allTokens].sort(sortByReference(dictionary.tokens, { unfilteredTokens: dictionary.unfilteredTokens }));

  for (const token of sortedTokens) {
    const { attributes, $value: value, $type, $description: description, original, alpha } = token as TransformedToken & { alpha?: unknown };
    const { mode, collection, scopes, group, codeSyntax } = (attributes as Record<string, unknown>) || {};

    if (!$type) continue;

    if ($type === "shadow") {
      const shadowValues = !Array.isArray(value) ? [value] : value;

      if (shadowValues.length === 1) {
        tokens.push(...shadowToVariables(token.name, shadowValues[0], { ...token, ...(platform.mode ? { mode: platform.mode } : {}) }));
      } else {
        shadowValues.forEach((stepValue, index) => {
          tokens.push(...shadowToVariables(`${token.name}/${index + 1}`, stepValue, { ...token, ...(platform.mode ? { mode: platform.mode } : {}) }));
        });
      }
    } else {
      tokens.push({
        name: token.name,
        value,
        type: getFigmaType($type),
        alpha,
        description,
        refId: [collection, token.name].filter(Boolean).join("/"),
        reference: getReference(dictionary, (original as { $value: string }).$value, platform),
        collection,
        mode,
        group,
        scopes,
        codeSyntax,
      });
    }
  }

  const output = JSON.stringify(tokens, null, 2);
  return format(output, { parser: "json", printWidth: 500 });
};
