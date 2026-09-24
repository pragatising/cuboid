import type { PreprocessedTokens, Preprocessor, DesignToken } from "style-dictionary/types";

/**
 * Propagates group-level $description/$extensions down to child tokens
 * that don't have their own values for those properties, per the W3C
 * Design Tokens spec's group-properties model. Matches Primer's
 * preprocessors/inheritGroupProperties.ts (renamed `org.primer.llm` ->
 * `org.cuboid.llm`).
 */
interface GroupProperties {
  $description?: string;
  $extensions?: Record<string, unknown>;
}

function inheritProperties(tokens: Record<string, unknown>, inheritedProps: GroupProperties = {}): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const currentGroupProps: GroupProperties = {};
  if (typeof tokens.$description === "string") {
    currentGroupProps.$description = tokens.$description;
  }
  if (tokens.$extensions && typeof tokens.$extensions === "object") {
    currentGroupProps.$extensions = tokens.$extensions as Record<string, unknown>;
  }

  const mergedProps: GroupProperties = { ...inheritedProps, ...currentGroupProps };

  if (inheritedProps.$extensions || currentGroupProps.$extensions) {
    mergedProps.$extensions = { ...inheritedProps.$extensions, ...currentGroupProps.$extensions };
  }

  for (const [key, value] of Object.entries(tokens)) {
    if (key === "$description" || key === "$extensions") continue;

    if (typeof value !== "object" || value === null) {
      result[key] = value;
      continue;
    }

    const tokenValue = value as Record<string, unknown>;

    if ("$value" in tokenValue || "value" in tokenValue) {
      const token = tokenValue as DesignToken;
      const inheritedDescription = !token.$description && mergedProps.$description ? mergedProps.$description : undefined;

      let mergedExtensions = token.$extensions;
      if (mergedProps.$extensions) {
        const inheritedLlm = mergedProps.$extensions["org.cuboid.llm"] as Record<string, unknown> | undefined;
        const tokenLlm = token.$extensions?.["org.cuboid.llm"] as Record<string, unknown> | undefined;

        if (inheritedLlm && !tokenLlm) {
          mergedExtensions = { ...token.$extensions, "org.cuboid.llm": inheritedLlm };
        }
      }

      result[key] = {
        ...token,
        ...(inheritedDescription ? { $description: inheritedDescription } : {}),
        ...(mergedExtensions ? { $extensions: mergedExtensions } : {}),
      };
    } else {
      result[key] = inheritProperties(tokenValue, mergedProps);
    }
  }

  return result;
}

export const inheritGroupProperties: Preprocessor = {
  name: "inheritGroupProperties",
  preprocessor: (dictionary: PreprocessedTokens): PreprocessedTokens => {
    return inheritProperties(dictionary as unknown as Record<string, unknown>) as unknown as PreprocessedTokens;
  },
};
