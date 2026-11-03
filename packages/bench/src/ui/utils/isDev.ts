/**
 * True outside production builds. Guards development-only warnings. Bundlers replace
 * `process.env.NODE_ENV`; the `typeof` check keeps it from throwing where `process` is undefined.
 */
export const isDev = (): boolean => typeof process !== "undefined" && process.env?.NODE_ENV !== "production";
