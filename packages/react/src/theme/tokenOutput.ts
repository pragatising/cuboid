import tokenOutputJson from "./output/token-output.json";

/**
 * Resolved component tokens from `npm run tokens:theme`.
 * Source: tokens/functional/components/** — do not import component colors from theme.json.
 */
export const tokenOutput = tokenOutputJson;

export type TokenOutput = typeof tokenOutputJson;
