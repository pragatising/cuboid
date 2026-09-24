/**
 * A CSS border string: `width style color`. Matches Primer's
 * types/border.d.ts (their doc comment says "color | style | width" but
 * the actual template-literal type and their transformer both produce
 * "width style color" order — matching the real behavior, not the
 * comment).
 */
export type Border = `${string} ${string} ${string}`;
