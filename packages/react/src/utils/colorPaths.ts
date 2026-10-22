import type { Tokens } from "../mode";

/** Every leaf of a nested token tree as a dot path: `{ a: { b: "x" } }` -> `"a.b"`. */
type Paths<T> = T extends string
  ? never
  : { [K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]>}` }[keyof T & string];

/** Any foreground colour token: `"neutral.muted"`, `"success.strong"`, `"danger.strong"`… */
export type FgColor = Paths<Tokens["fgColor"]>;
/** Any background colour token: `"canvas.default"`, `"neutral.light.2"`, `"danger.subtle"`… */
export type BgColor = Paths<Tokens["bgColor"]>;
/** Any border colour token: `"default"`, `"subtle"`, `"translucent.3"`… */
export type BorderColor = Paths<Tokens["borderColor"]>;

/** Look a dot path up in one resolved colour group of the active mode's tokens. */
export function resolveColorPath(group: object, path: string): string {
  const value = path.split(".").reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], group);
  if (typeof value !== "string") throw new Error(`Unknown colour token "${path}".`);
  return value;
}
