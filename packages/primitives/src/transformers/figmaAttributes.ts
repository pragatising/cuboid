import type { PlatformConfig, Transform, TransformedToken } from "style-dictionary/types";
import { asArray } from "../utilities/asArray.ts";

/**
 * Extracts a token's `org.cuboid.figma` extension fields into the shape
 * a Figma Variables output needs (mode, collection, group, scopes,
 * code syntax). Matches Primer's transformers/figmaAttributes.ts
 * (renamed from `org.primer.figma`).
 */
type FigmaVariableScope =
  | "ALL_SCOPES"
  | "TEXT_CONTENT"
  | "CORNER_RADIUS"
  | "WIDTH_HEIGHT"
  | "GAP"
  | "ALL_FILLS"
  | "FRAME_FILL"
  | "SHAPE_FILL"
  | "TEXT_FILL"
  | "STROKE_COLOR"
  | "STROKE_FLOAT"
  | "EFFECT_COLOR"
  | "EFFECT_FLOAT"
  | "OPACITY"
  | "FONT_FAMILY"
  | "FONT_STYLE"
  | "FONT_WEIGHT"
  | "FONT_SIZE"
  | "LINE_HEIGHT"
  | "LETTER_SPACING"
  | "PARAGRAPH_SPACING"
  | "PARAGRAPH_INDENT";

const FIGMA_SCOPES: Record<string, FigmaVariableScope[]> = {
  all: ["ALL_SCOPES"],
  radius: ["CORNER_RADIUS"],
  size: ["WIDTH_HEIGHT"],
  gap: ["GAP"],
  bgColor: ["FRAME_FILL", "SHAPE_FILL"],
  fgColor: ["TEXT_FILL", "SHAPE_FILL"],
  effectColor: ["EFFECT_COLOR"],
  effectFloat: ["EFFECT_FLOAT"],
  borderColor: ["STROKE_COLOR"],
  borderWidth: ["STROKE_FLOAT"],
  opacity: ["OPACITY"],
  fontFamily: ["FONT_FAMILY"],
  fontStyle: ["FONT_STYLE"],
  fontWeight: ["FONT_WEIGHT"],
  fontSize: ["FONT_SIZE"],
  lineHeight: ["LINE_HEIGHT"],
  letterSpacing: ["LETTER_SPACING"],
  paragraphSpacing: ["PARAGRAPH_SPACING"],
  paragraphIndent: ["PARAGRAPH_INDENT"],
};

function getScopes(scopes: string[] | string | undefined): FigmaVariableScope[] {
  const list = typeof scopes === "string" ? [scopes] : scopes;
  if (Array.isArray(list)) {
    return list
      .map((scope) => {
        if (scope in FIGMA_SCOPES) return FIGMA_SCOPES[scope];
        throw new Error(`Invalid scope: ${scope}`);
      })
      .flat();
  }
  return ["ALL_SCOPES"];
}

export const figmaAttributes: Transform = {
  name: "figma/attributes",
  type: "attribute",
  transform: (token: TransformedToken, platform: PlatformConfig = {}) => {
    const figmaExtension = (token.$extensions?.["org.cuboid.figma"] ?? {}) as {
      modeOverride?: string;
      collection?: string;
      scopes?: string[] | string;
      group?: string;
      codeSyntax?: unknown;
    };
    const { modeOverride, collection, scopes, group, codeSyntax } = figmaExtension;

    const collectionOverride = platform.options?.collectionOverride as Record<string, string> | undefined;
    const resolvedCollection = collectionOverride && collection && collection in collectionOverride ? collectionOverride[collection] : collection;

    return {
      mode: asArray(platform.options?.theme)[0] || modeOverride || "default",
      collection: resolvedCollection,
      group: group || resolvedCollection,
      scopes: getScopes(scopes),
      codeSyntax,
    };
  },
};
